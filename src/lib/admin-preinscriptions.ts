// Lecture admin des préinscriptions directement dans la table de la base,
// avec la session de l'utilisateur. La règle d'accès « Admins read preinscriptions »
// (is_admin()) décide seule : aucun contournement, aucune clé de service ici.

type QueryError = { code?: string; message: string } | null;
const PAGE_SIZE = 500;
export type PreinscriptionsReader = {
  from(table: "preinscriptions"): {
    select(columns: "*"): {
      order(
        column: "created_at",
        options: { ascending: false },
      ): {
        order(column: "id", options: { ascending: false }): {
          range(from: number, to: number): PromiseLike<{ data: unknown[] | null; error: QueryError }>;
        };
      };
    };
  };
};

export type AdminReadResult<T> =
  | { status: "ok"; rows: T[] }
  | { status: "forbidden" }
  | { status: "error" };

export async function loadAdminPreinscriptions<T>(
  client: PreinscriptionsReader,
): Promise<AdminReadResult<T>> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("preinscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      if (error.code === "42501" || /permission|jwt/i.test(error.message))
        return { status: "forbidden" };
      return { status: "error" };
    }
    if (!data) return { status: "error" };
    rows.push(...(data as T[]));
    if (data.length < PAGE_SIZE) return { status: "ok", rows };
  }
}
