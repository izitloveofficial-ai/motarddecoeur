// Lecture admin des préinscriptions directement dans la table de la base,
// avec la session de l'utilisateur. La règle d'accès « Admins read preinscriptions »
// (is_admin()) décide seule : aucun contournement, aucune clé de service ici.

type QueryError = { code?: string; message: string } | null;
export type PreinscriptionsReader = {
  from(table: "preinscriptions"): {
    select(columns: "*"): {
      order(
        column: "created_at",
        options: { ascending: false },
      ): PromiseLike<{ data: unknown[] | null; error: QueryError }>;
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
  const { data, error } = await client
    .from("preinscriptions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42501" || /permission|jwt/i.test(error.message))
      return { status: "forbidden" };
    return { status: "error" };
  }
  return { status: "ok", rows: (data ?? []) as T[] };
}
