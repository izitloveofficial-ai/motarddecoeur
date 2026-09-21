import { Database, type SQLQueryBindings } from "bun:sqlite";
import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  handleAdminForgotPassword,
  handleAdminLogin,
  handleAdminResetPassword,
} from "./admin-auth.server";
import type { AppDatabase } from "./preinscriptions.server";

const opened: Database[] = [];
afterEach(() => opened.splice(0).forEach((database) => database.close()));

function environment() {
  const sqlite = new Database(":memory:");
  opened.push(sqlite);
  sqlite.exec(readFileSync("migrations/0003_admin_password_reset.sql", "utf8"));
  const DB: AppDatabase = {
    prepare(sql) {
      const values: SQLQueryBindings[] = [];
      const wrapper = {
        bind(...bound: SQLQueryBindings[]) {
          values.splice(0, values.length, ...bound);
          return wrapper;
        },
        async first<T>() {
          return (sqlite.prepare(sql).get(...values) as T | null) ?? null;
        },
        async all<T>() {
          return { success: true, results: sqlite.prepare(sql).all(...values) as T[] };
        },
        async run() {
          const result = sqlite.prepare(sql).run(...values);
          return { success: true, meta: { changes: result.changes } };
        },
      };
      return wrapper;
    },
  };
  return { DB, sqlite };
}

function post(path: string, body: unknown) {
  return new Request(`https://motardsdecoeur.com${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://motardsdecoeur.com" },
    body: JSON.stringify(body),
  });
}

async function digest(token: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
  );
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

describe("réinitialisation administrateur D1", () => {
  test("renvoie le même message pour une adresse inconnue", async () => {
    const env = environment();
    const result = await handleAdminForgotPassword(
      post("/api/admin/forgot-password", { email: "unknown@example.test" }),
      env,
    );
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({
      ok: true,
      message:
        "Si cette adresse correspond à un compte administrateur, un lien de réinitialisation vient d’être envoyé.",
    });
  });

  test("refuse un jeton expiré, utilisé ou inconnu et deux mots de passe différents", async () => {
    const { DB, sqlite } = environment();
    for (const [id, token, expiry, used] of [
      ["expired", "expired-token", "-1 minute", null],
      ["used", "used-token", "+15 minutes", "2026-01-01"],
    ] as const) {
      sqlite
        .prepare(
          "INSERT INTO admin_password_resets(id,admin_id,token_hash,expires_at,used_at) VALUES(?,'primary-admin',?,datetime('now', ?),?)",
        )
        .run(id, await digest(token), expiry, used);
      const result = await handleAdminResetPassword(
        post("/api/admin/reset-password", {
          token,
          password: "Correct!Password1",
          confirmation: "Correct!Password1",
        }),
        { DB },
      );
      expect(result.status).toBe(400);
    }
    expect(
      (
        await handleAdminResetPassword(
          post("/api/admin/reset-password", {
            token: "unknown",
            password: "Correct!Password1",
            confirmation: "Correct!Password1",
          }),
          { DB },
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await handleAdminResetPassword(
          post("/api/admin/reset-password", {
            token: "unused",
            password: "Correct!Password1",
            confirmation: "Different!Password2",
          }),
          { DB },
        )
      ).status,
    ).toBe(400);
  });

  test("change le mot de passe une fois, révoque les sessions et permet la connexion", async () => {
    const { DB, sqlite } = environment();
    const token = "a-secure-one-time-test-token";
    sqlite
      .prepare(
        "INSERT INTO admin_password_resets(id,admin_id,token_hash,expires_at) VALUES('valid','primary-admin',?,datetime('now', '+15 minutes'))",
      )
      .run(await digest(token));
    sqlite.exec(
      "INSERT INTO admin_sessions(id,admin_id,token_hash,expires_at) VALUES('old','primary-admin','old-hash',datetime('now', '+8 hours'))",
    );
    const body = { token, password: "Correct!Password1", confirmation: "Correct!Password1" };
    expect(
      (await handleAdminResetPassword(post("/api/admin/reset-password", body), { DB })).status,
    ).toBe(200);
    expect(
      (await handleAdminResetPassword(post("/api/admin/reset-password", body), { DB })).status,
    ).toBe(400);
    expect(
      sqlite.query("SELECT revoked_at FROM admin_sessions WHERE id='old'").get() as {
        revoked_at: string | null;
      },
    ).toHaveProperty("revoked_at", expect.any(String));
    expect(
      (
        await handleAdminLogin(
          post("/api/admin/login", {
            email: "contact@motardsdecoeur.com",
            password: "Wrong!Password1",
          }),
          { DB },
        )
      ).status,
    ).toBe(401);
    const login = await handleAdminLogin(
      post("/api/admin/login", { email: " CONTACT@MOTARDSDECOEUR.COM ", password: body.password }),
      { DB },
    );
    expect(login.status).toBe(200);
    expect(login.headers.get("set-cookie")).toContain("HttpOnly; Secure; SameSite=Strict");
  }, 15_000);
});
