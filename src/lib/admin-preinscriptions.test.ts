import { describe, expect, test } from "bun:test";
import { loadAdminPreinscriptions, type PreinscriptionsReader } from "./admin-preinscriptions";

type QueryResult = { data: unknown[] | null; error: { code?: string; message: string } | null };
function fakeClient(result: QueryResult | ((from: number, to: number) => QueryResult)) {
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
              return {
                order(nextColumn, nextOptions) {
                  calls.push(`order:${nextColumn}:${nextOptions.ascending}`);
                  return {
                    range(from, to) {
                      calls.push(`range:${from}:${to}`);
                      return Promise.resolve(typeof result === "function" ? result(from, to) : result);
                    },
                  };
                },
              };
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
    expect(calls).toEqual([
      "from:preinscriptions", "select:*", "order:created_at:false", "order:id:false", "range:0:499",
    ]);
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

  test("lit toutes les pages sans tronquer les préinscriptions", async () => {
    const { client, calls } = fakeClient((from) => ({
      data: from === 0 ? Array.from({ length: 500 }, (_, id) => ({ id })) : [{ id: 500 }],
      error: null,
    }));
    const result = await loadAdminPreinscriptions<{ id: number }>(client);
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.rows).toHaveLength(501);
    expect(calls).toContain("range:500:999");
  });

  test("n'affiche pas une liste partielle si une page échoue", async () => {
    const { client } = fakeClient((from) => from === 0
      ? { data: Array.from({ length: 500 }, (_, id) => ({ id })), error: null }
      : { data: null, error: { message: "network" } });
    expect(await loadAdminPreinscriptions(client)).toEqual({ status: "error" });
  });
});
