import {
  preinscriptionSchema,
  submitPreinscription,
  type PreinscriptionInput,
} from "./preinscriptions";

type D1Result<T = unknown> = { success: boolean; results?: T[]; meta?: { changes?: number } };
type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
};
export type AppDatabase = { prepare(sql: string): D1Statement };
type RuntimeEnv = Record<string, unknown> & { DB?: AppDatabase };

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

function database(env: unknown) {
  const db = (env as RuntimeEnv | undefined)?.DB;
  if (!db) throw new Error("The DB binding is not configured");
  return db;
}

function clientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  ).slice(0, 64);
}

async function isRateLimited(db: AppDatabase, ip: string) {
  const row = await db
    .prepare(
      "SELECT COUNT(*) AS attempts FROM preinscription_attempts WHERE ip = ? AND attempted_at > datetime('now', '-1 hour')",
    )
    .bind(ip)
    .first<{ attempts: number }>();
  await db
    .prepare("INSERT INTO preinscription_attempts (ip, attempted_at) VALUES (?, datetime('now'))")
    .bind(ip)
    .run();
  return Number(row?.attempts ?? 0) >= 5;
}

type AdminAuthorization = { authorized: true } | { authorized: false; status: 401 | 403 };

// Supabase is the source of truth for preinscriptions. The D1 helpers above are kept
// for history but are no longer on the critical path of this flow.
function readEnv(env: RuntimeEnv, ...names: string[]) {
  for (const name of names) {
    const value =
      (env?.[name] as string | undefined) ??
      (typeof process !== "undefined" ? process.env?.[name] : undefined);
    if (value) return String(value);
  }
  return "";
}

const supabaseUrl = (env: RuntimeEnv) =>
  readEnv(env, "SUPABASE_URL", "VITE_SUPABASE_URL").replace(/\/$/, "");
const supabaseAnonKey = (env: RuntimeEnv) =>
  readEnv(env, "SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY");
const supabaseServiceKey = (env: RuntimeEnv) => readEnv(env, "SUPABASE_SERVICE_ROLE_KEY");

export async function requireAdmin(request: Request, env: RuntimeEnv): Promise<AdminAuthorization> {
  const authorization = request.headers.get("authorization");
  const url = supabaseUrl(env);
  const anonKey = supabaseAnonKey(env);
  if (!authorization?.startsWith("Bearer ") || !url || !anonKey)
    return { authorized: false, status: 401 };
  const response = await fetch(`${url}/rest/v1/rpc/is_admin`, {
    method: "POST",
    headers: { authorization, apikey: anonKey, "content-type": "application/json" },
    body: "{}",
  });
  if (response.status === 401) return { authorized: false, status: 401 };
  if (!response.ok) return { authorized: false, status: response.status === 403 ? 403 : 401 };
  return (await response.json()) === true
    ? { authorized: true }
    : { authorized: false, status: 403 };
}

export async function handlePreinscriptionRequest(request: Request, env: unknown) {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Validation must not depend on infrastructure. In particular, a bad request must
  // remain a 400 even when the database binding is missing or temporarily unavailable.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, message: "Requête invalide." }, 400);
  }
  if (!preinscriptionSchema.safeParse(raw).success) {
    return json({ ok: false, message: "Requête invalide." }, 400);
  }

  try {
    const db = database(env);
    if (await isRateLimited(db, clientIp(request)))
      return json({ error: "too_many_requests" }, 429);
    const result = await submitPreinscription(raw, {
      async create(input: Omit<PreinscriptionInput, "website">) {
        const existing = await db
          .prepare("SELECT id FROM preinscriptions WHERE email = ? LIMIT 1")
          .bind(input.email)
          .first();
        if (existing) return "duplicate";
        try {
          await db
            .prepare(
              `INSERT INTO preinscriptions
              (first_name,email,location,rider_profile,favorite_bike,primary_interest,message,consent_rgpd,status,created_at)
              VALUES (?,?,?,?,?,?,?,?, 'pending', datetime('now'))`,
            )
            .bind(
              input.first_name,
              input.email,
              input.location,
              input.rider_profile,
              input.favorite_bike,
              input.primary_interest,
              input.message,
              1,
            )
            .run();
          return "created";
        } catch (error) {
          // A unique constraint closes the race between the lookup and insert.
          if (error instanceof Error && /unique/i.test(error.message)) return "duplicate";
          throw error;
        }
      },
    });
    return json(result.body, result.status);
  } catch (error) {
    console.error("POST /api/preinscriptions failed", error);
    return json(
      {
        ok: false,
        message:
          "Nous n’avons pas pu enregistrer votre préinscription. Veuillez réessayer dans quelques instants.",
      },
      500,
    );
  }
}

export async function handleAdminPreinscriptionsRequest(request: Request, rawEnv: unknown) {
  const env = rawEnv as RuntimeEnv;
  const authorization = await requireAdmin(request, env);
  if (!authorization.authorized)
    return json(
      { error: authorization.status === 401 ? "unauthenticated" : "forbidden" },
      authorization.status,
    );
  if (request.method === "GET") {
    // La liste est lue par la page admin directement dans la base (plus de D1).
    return json({ error: "method_not_allowed" }, 405);
  }
  const url = supabaseUrl(env);
  const serviceKey = supabaseServiceKey(env);
  if (!url || !serviceKey) return json({ error: "invitation_not_configured" }, 503);
  const restHeaders = {
    authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    "content-type": "application/json",
  };

  if (request.method === "POST") {
    const body = (await request.json()) as { ids?: unknown };
    if (!Array.isArray(body.ids) || body.ids.length < 1 || body.ids.length > 100)
      return json({ error: "invalid_request" }, 400);
    const ids = body.ids.filter(
      (id): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id),
    );
    if (ids.length !== body.ids.length) return json({ error: "invalid_request" }, 400);
    const results = [];
    for (const id of ids) {
      const lookup = await fetch(
        `${url}/rest/v1/preinscriptions?select=email,status&id=eq.${id}&limit=1`,
        { headers: restHeaders },
      );
      const rows = lookup.ok ? ((await lookup.json()) as { email: string; status: string }[]) : [];
      const row = rows[0];
      if (!row || row.status !== "pending") {
        results.push({ id, ok: false });
        continue;
      }
      const invited = await fetch(`${url}/auth/v1/invite`, {
        method: "POST",
        headers: restHeaders,
        body: JSON.stringify({ email: row.email, data: { preinscription_id: id } }),
      });
      if (invited.ok)
        await fetch(`${url}/rest/v1/preinscriptions?id=eq.${id}`, {
          method: "PATCH",
          headers: { ...restHeaders, prefer: "return=minimal" },
          body: JSON.stringify({ status: "invited", invitation_sent_at: new Date().toISOString() }),
        });
      results.push({ id, ok: invited.ok });
    }
    return json({ results });
  }
  return json({ error: "method_not_allowed" }, 405);
}
