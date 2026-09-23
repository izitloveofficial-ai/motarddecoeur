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
      let values: never[] = [];
      const statement = sqlite.prepare(sql);
      const api = {
        bind(...next: unknown[]) {
          values = next as never[];
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

describe("flux de préinscription et administration", () => {
  let sqlite: Database;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.exec(readFileSync("migrations/0001_preinscriptions.sql", "utf8"));
    sqlite.exec(readFileSync("migrations/0002_preserve_legacy_preinscription_fields.sql", "utf8"));
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

  // Historique D1 : la liste admin est désormais lue directement dans la base externe.
  test.skip("enregistre puis lit la même préinscription depuis D1", async () => {
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

    const requests: Request[] = [];
    globalThis.fetch = (async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      if (request.url.endsWith("/rest/v1/rpc/is_admin")) return Response.json(true);
      return Response.json([
        {
          email: "integration@example.test",
          status: "pending",
          consent_rgpd: true,
        },
      ]);
    }) as typeof fetch;
    const adminResponse = await handleAdminPreinscriptionsRequest(
      new Request("https://app.test/api/admin/preinscriptions", {
        headers: { authorization: "Bearer integration-admin" },
      }),
      {
        DB,
        SUPABASE_URL: "https://identity.test",
        SUPABASE_ANON_KEY: "identity-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
      },
    );
    expect(adminResponse.status).toBe(200);
    const adminBody = (await adminResponse.json()) as { rows: Array<{ email: string }> };
    expect(adminBody.rows.map((row) => row.email)).toContain("integration@example.test");
    expect(requests).toHaveLength(1);
  });

  test("refuse sans jeton (401) et avec un compte non administrateur (403)", async () => {
    const DB = d1Database(sqlite);
    expect(
      (
        await handleAdminPreinscriptionsRequest(
          new Request("https://app.test/api/admin/preinscriptions"),
          {
            DB,
            SUPABASE_URL: "https://identity.test",
            SUPABASE_ANON_KEY: "identity-key",
          },
        )
      ).status,
    ).toBe(401);

    globalThis.fetch = (async () => Response.json(false)) as unknown as typeof fetch;
    const forbidden = await handleAdminPreinscriptionsRequest(
      new Request("https://app.test/api/admin/preinscriptions", {
        headers: { authorization: "Bearer ordinary-user" },
      }),
      { DB, SUPABASE_URL: "https://identity.test", SUPABASE_ANON_KEY: "identity-key" },
    );
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toEqual({ error: "forbidden" });
  });

  // Historique D1 : conservé pour mémoire, plus sur le chemin critique.
  test.skip("retourne les préinscriptions D1 de la plus récente à la plus ancienne", async () => {
    const DB = d1Database(sqlite);
    const insert = sqlite.prepare(`INSERT INTO preinscriptions
      (id,first_name,email,location,city,age,sex,bike_type,rider_profile,favorite_bike,
       primary_interest,message,consent_rgpd,status,invitation_sent_at,converted_at,user_id,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    for (let index = 1; index <= 5; index++) {
      insert.run(
        `00000000-0000-4000-8000-00000000000${index}`,
        `Historique ${index}`,
        `historique${index}@example.test`,
        `Lieu ${index}`,
        `Ville ${index}`,
        30 + index,
        "prefere_ne_pas_dire",
        `Moto ${index}`,
        "motard",
        `Favorite ${index}`,
        "communaute",
        `Message ${index}`,
        1,
        index === 1 ? "invited" : "pending",
        index === 1 ? "2026-08-02T10:00:00Z" : null,
        null,
        null,
        `2026-08-0${index}T09:00:00Z`,
      );
    }
    globalThis.fetch = (async () => Response.json(true)) as unknown as typeof fetch;
    const firstAdminRead = await handleAdminPreinscriptionsRequest(
      new Request("https://app.test/api/admin/preinscriptions", {
        headers: { authorization: "Bearer integration-admin" },
      }),
      {
        DB,
        SUPABASE_URL: "https://identity.test",
        SUPABASE_ANON_KEY: "identity-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
      },
    );
    const firstRows = (await firstAdminRead.json()).rows;
    expect(firstRows).toHaveLength(5);
    expect(firstRows[0]).toEqual(
      expect.objectContaining({
        city: "Ville 5",
        age: 35,
        bike_type: "Moto 5",
        consent_rgpd: 1,
        status: "pending",
        invitation_sent_at: null,
        created_at: "2026-08-05T09:00:00Z",
      }),
    );
  });
});
