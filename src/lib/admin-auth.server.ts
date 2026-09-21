import type { AppDatabase } from "./preinscriptions.server";

type Env = Record<string, unknown> & { DB?: AppDatabase };
const encoder = new TextEncoder();
const PASSWORD_ITERATIONS = 600_000;
const GENERIC_RESET_MESSAGE =
  "Si cette adresse correspond à un compte administrateur, un lien de réinitialisation vient d’être envoyé.";

function config(env: Env, name: string) {
  return String(
    env[name] ?? (typeof process !== "undefined" ? (process.env[name] ?? "") : ""),
  ).trim();
}
function db(env: Env) {
  if (!env.DB) throw new Error("DB binding is not configured");
  return env.DB;
}
function base64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
function fromBase64(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
}
function randomToken(bytes = 32) {
  return base64(crypto.getRandomValues(new Uint8Array(bytes)));
}
async function sha256(value: string) {
  return base64(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}
async function passwordHash(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS },
    key,
    256,
  );
  return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${base64(salt)}$${base64(new Uint8Array(derived))}`;
}
async function verifyPassword(password: string, encoded: string) {
  const [algorithm, iterations, salt, expected] = encoded.split("$");
  if (algorithm !== "pbkdf2-sha256" || !iterations || !salt || !expected) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const derived = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: fromBase64(salt), iterations: Number(iterations) },
      key,
      256,
    ),
  );
  const wanted = fromBase64(expected);
  if (derived.length !== wanted.length) return false;
  let difference = 0;
  for (let index = 0; index < derived.length; index++) difference |= derived[index] ^ wanted[index];
  return difference === 0;
}
function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().normalize("NFKC") : "";
}
function ip(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown"
  )
    .trim()
    .slice(0, 64);
}
function response(body: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      ...headers,
    },
  });
}
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
async function limited(database: AppDatabase, request: Request, email: string, kind: string) {
  const [emailHash, ipHash] = await Promise.all([sha256(email), sha256(ip(request))]);
  const recent = await database
    .prepare(
      "SELECT COUNT(*) AS count FROM admin_auth_attempts WHERE kind = ? AND (email_hash = ? OR ip_hash = ?) AND attempted_at > datetime('now', '-15 minutes')",
    )
    .bind(kind, emailHash, ipHash)
    .first<{ count: number }>();
  await database
    .prepare("INSERT INTO admin_auth_attempts(kind,email_hash,ip_hash) VALUES(?,?,?)")
    .bind(kind, emailHash, ipHash)
    .run();
  return Number(recent?.count ?? 0) >= (kind === "reset" ? 3 : 10);
}
function validPassword(password: string) {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
async function sendResetEmail(env: Env, email: string, token: string) {
  const apiKey = config(env, "RESEND_API_KEY");
  const from = config(env, "ADMIN_EMAIL_FROM");
  const appUrl = config(env, "APP_URL").replace(/\/$/, "");
  if (!apiKey || !from || !appUrl) throw new Error("Password reset email is not configured");
  const url = `${appUrl}/admin/reset-password?token=${encodeURIComponent(token)}`;
  const text =
    "Une demande de réinitialisation du mot de passe administrateur a été effectuée. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable pendant 15 minutes et ne peut être utilisé qu’une seule fois. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.";
  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Réinitialisation de votre accès administrateur — Motards de Cœur",
      text: `${text}\n\nChoisir mon nouveau mot de passe : ${url}`,
      html: `<p>${text}</p><p><a href="${url}">Choisir mon nouveau mot de passe</a></p>`,
    }),
  });
  if (!sent.ok) throw new Error(`Email provider rejected request (${sent.status})`);
}

export async function handleAdminForgotPassword(request: Request, rawEnv: unknown) {
  if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405);
  if (!sameOrigin(request)) return response({ error: "forbidden" }, 403);
  const database = db(rawEnv as Env);
  const email = normalizeEmail(
    ((await request.json().catch(() => ({}))) as { email?: unknown }).email,
  );
  const isLimited = await limited(database, request, email, "reset");
  const admin = !isLimited
    ? await database
        .prepare("SELECT id,email FROM admin_accounts WHERE email = ? AND role = 'admin'")
        .bind(email)
        .first<{ id: string; email: string }>()
    : null;
  if (admin) {
    const token = randomToken(32);
    await database
      .prepare(
        "INSERT INTO admin_password_resets(id,admin_id,token_hash,expires_at) VALUES(?,?,?,datetime('now', '+15 minutes'))",
      )
      .bind(crypto.randomUUID(), admin.id, await sha256(token))
      .run();
    try {
      await sendResetEmail(rawEnv as Env, admin.email, token);
    } catch {
      // Keep the public response indistinguishable and never log the token or address.
      console.error("Admin password reset email delivery failed");
    }
  }
  return response(
    { ok: true, message: GENERIC_RESET_MESSAGE },
    isLimited ? 429 : 200,
    isLimited ? { "retry-after": "900" } : undefined,
  );
}

export async function handleAdminResetPassword(request: Request, rawEnv: unknown) {
  if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405);
  if (!sameOrigin(request)) return response({ error: "forbidden" }, 403);
  const { token, password, confirmation } = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (
    typeof token !== "string" ||
    typeof password !== "string" ||
    password !== confirmation ||
    !validPassword(password)
  )
    return response({ error: "invalid_password" }, 400);
  const database = db(rawEnv as Env);
  const record = await database
    .prepare(
      "SELECT id,admin_id FROM admin_password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')",
    )
    .bind(await sha256(token))
    .first<{ id: string; admin_id: string }>();
  if (!record) return response({ error: "invalid_token" }, 400);
  const hash = await passwordHash(password);
  await database
    .prepare(
      "UPDATE admin_accounts SET password_hash = ?, password_changed_at = datetime('now') WHERE id = ? AND role = 'admin'",
    )
    .bind(hash, record.admin_id)
    .run();
  await database
    .prepare(
      "UPDATE admin_password_resets SET used_at = datetime('now') WHERE id = ? AND used_at IS NULL",
    )
    .bind(record.id)
    .run();
  await database
    .prepare(
      "UPDATE admin_sessions SET revoked_at = datetime('now') WHERE admin_id = ? AND revoked_at IS NULL",
    )
    .bind(record.admin_id)
    .run();
  return response({ ok: true });
}

export async function handleAdminLogin(request: Request, rawEnv: unknown) {
  if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405);
  if (!sameOrigin(request)) return response({ error: "forbidden" }, 403);
  const database = db(rawEnv as Env);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = normalizeEmail(body.email);
  if (await limited(database, request, email, "login"))
    return response({ error: "invalid_credentials" }, 429);
  const admin = await database
    .prepare("SELECT id,password_hash FROM admin_accounts WHERE email = ? AND role = 'admin'")
    .bind(email)
    .first<{ id: string; password_hash: string | null }>();
  if (
    !admin?.password_hash ||
    typeof body.password !== "string" ||
    !(await verifyPassword(body.password, admin.password_hash))
  )
    return response({ error: "invalid_credentials" }, 401);
  const token = randomToken(32);
  await database
    .prepare(
      "INSERT INTO admin_sessions(id,admin_id,token_hash,expires_at) VALUES(?,?,?,datetime('now', '+8 hours'))",
    )
    .bind(crypto.randomUUID(), admin.id, await sha256(token))
    .run();
  return response({ ok: true }, 200, {
    "set-cookie": `mdc_admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`,
  });
}

export async function authorizeAdminSession(request: Request, rawEnv: unknown) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === "mdc_admin_session")?.[1];
  if (!token) return false;
  const session = await db(rawEnv as Env)
    .prepare(
      "SELECT s.id FROM admin_sessions s JOIN admin_accounts a ON a.id = s.admin_id WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > datetime('now') AND a.role = 'admin'",
    )
    .bind(await sha256(token))
    .first();
  return Boolean(session);
}
