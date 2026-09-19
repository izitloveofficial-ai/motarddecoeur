import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import {
  handleAdminPreinscriptionsRequest,
  handlePreinscriptionRequest,
} from "./preinscriptions.server";

function d1Database(sqlite: Database) {
  return {
    prepare(sql: string) {
      let values: unknown[] = [];
      const statement = sqlite.prepare(sql);
      const api = {
        bind(...next: unknown[]) {
          values = next;
          return api;
        },
        async first<T>() {
          return (statement.get(...values) as T | null) ?? null;
        },
        async all<T>() {
          return { success: true, results: statement.all(...values) as T[] };
        },
        async run() {
          const result = statement.run(...values);
          return { success: true, meta: { changes: result.changes } };
        },
      };
      return api;
    },
  };
}

const valid = {
  first_name: "Test intégration",
  email: "integration@example.test",
  location: "Lyon",
  rider_profile: "motarde",
  favorite_bike: "Honda CB500",
  primary_interest: "balades_moto",
  message: "Formulaire vers administration",
  consent_rgpd: true,
  website: "",
};

describe("POST /api/preinscriptions → base D1 → administration", () => {
  let sqlite: Database;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.exec(readFileSync("migrations/0001_preinscriptions.sql", "utf8"));
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    sqlite.close();
  });

  test.each([
    [{}, "requête vide"],
    [{ ...valid, consent_rgpd: false }, "consentement faux"],
    [{ ...valid, email: "invalide" }, "e-mail invalide"],
  ])("renvoie 400 avant toute connexion DB : %s", async (body) => {
    const response = await handlePreinscriptionRequest(
      new Request("https://app.test/api/preinscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      {},
    );
    expect(response.status).toBe(400);
  });

  test("enregistre puis expose immédiatement la ligne à l'administration", async () => {
    const DB = d1Database(sqlite);
    const createResponse = await handlePreinscriptionRequest(
      new Request("https://app.test/api/preinscriptions", {
        method: "POST",
        headers: { "content-type": "application/json", "cf-connecting-ip": "192.0.2.1" },
        body: JSON.stringify(valid),
      }),
      { DB },
    );
    expect(createResponse.status).toBe(201);
    expect(await createResponse.json()).toEqual(expect.objectContaining({ ok: true }));

    const stored = sqlite
      .prepare("SELECT email, status, consent_rgpd FROM preinscriptions WHERE email = ?")
      .get("integration@example.test") as Record<string, unknown>;
    expect(stored).toEqual({
      email: "integration@example.test",
      status: "pending",
      consent_rgpd: 1,
    });

    globalThis.fetch = (async () => Response.json(true)) as typeof fetch;
    const adminResponse = await handleAdminPreinscriptionsRequest(
      new Request("https://app.test/api/admin/preinscriptions", {
        headers: { authorization: "Bearer integration-admin" },
      }),
      { DB, SUPABASE_URL: "https://identity.test", SUPABASE_ANON_KEY: "identity-key" },
    );
    expect(adminResponse.status).toBe(200);
    const adminBody = (await adminResponse.json()) as { rows: Array<{ email: string }> };
    expect(adminBody.rows.map((row) => row.email)).toContain("integration@example.test");
  });
});
