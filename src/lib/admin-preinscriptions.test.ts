import { describe, expect, test } from "bun:test";
import { loadAdminPreinscriptions, type PreinscriptionsReader } from "./admin-preinscriptions";

function fakeClient(result: { data: unknown[] | null; error: { code?: string; message: string } | null }) {
  const calls: string[] = [];
  const client: PreinscriptionsReader = {
    from(table) {
      calls.push(`from:${table}`);
      return {
        select(columns) {
          calls.push(`select:${columns}`);
          return {
            order(column, options) {
              calls.push(`order:${column}:${options.ascending}`);
              return Promise.resolve(result);
            },
          };
        },
      };
    },
  };
  return { client, calls };
}

describe("lecture admin des préinscriptions", () => {
  test("lit la table preinscriptions, la plus récente en premier", async () => {
    const { client, calls } = fakeClient({ data: [{ id: "b" }, { id: "a" }], error: null });
    const result = await loadAdminPreinscriptions<{ id: string }>(client);
    expect(calls).toEqual(["from:preinscriptions", "select:*", "order:created_at:false"]);
    expect(result).toEqual({ status: "ok", rows: [{ id: "b" }, { id: "a" }] });
  });

  test("RLS : un refus d'accès devient « forbidden », sans données", async () => {
    const { client } = fakeClient({ data: null, error: { code: "42501", message: "permission denied" } });
    expect(await loadAdminPreinscriptions(client)).toEqual({ status: "forbidden" });
  });

  test("autre erreur : « error », jamais de lignes", async () => {
    const { client } = fakeClient({ data: null, error: { message: "network" } });
    expect(await loadAdminPreinscriptions(client)).toEqual({ status: "error" });
  });

  test("aucune ligne visible (non-admin filtré par RLS) : liste vide", async () => {
    const { client } = fakeClient({ data: [], error: null });
    expect(await loadAdminPreinscriptions(client)).toEqual({ status: "ok", rows: [] });
  });
});
