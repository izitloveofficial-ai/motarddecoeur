#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable requise absente: ${name}`);
  return value;
};

const sourceUrl = required("SOURCE_SUPABASE_URL").replace(/\/$/, "");
const sourceKey = required("SOURCE_SUPABASE_SERVICE_ROLE_KEY");
const exportPath = process.env.PREINSCRIPTIONS_EXPORT_PATH ?? "preinscriptions-export.json";
const expectedCount = Number(process.env.SOURCE_EXPECTED_COUNT ?? "5");

async function exportSource() {
  const response = await fetch(
    `${sourceUrl}/rest/v1/preinscriptions?select=*&order=created_at.asc`,
    {
      headers: { apikey: sourceKey, authorization: `Bearer ${sourceKey}` },
    },
  );
  if (!response.ok)
    throw new Error(`Export Supabase refusé (${response.status}): ${await response.text()}`);
  const rows = await response.json();
  if (rows.length !== expectedCount)
    throw new Error(`Export interrompu: ${rows.length} ligne(s), ${expectedCount} attendue(s).`);
  await writeFile(exportPath, `${JSON.stringify(rows, null, 2)}\n`, { mode: 0o600 });
  return rows;
}

async function importTarget(rows) {
  const account = required("CLOUDFLARE_ACCOUNT_ID");
  const database = required("CLOUDFLARE_D1_DATABASE_ID");
  const token = required("CLOUDFLARE_API_TOKEN");
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`;
  const sql = `INSERT INTO preinscriptions
    (id, first_name, email, location, city, age, sex, bike_type, rider_profile, favorite_bike,
     primary_interest, message, consent_rgpd, status, invitation_sent_at, converted_at, user_id, created_at)
    VALUES (?, ?, lower(trim(?)), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET first_name=excluded.first_name, email=excluded.email,
      location=excluded.location, city=excluded.city, age=excluded.age, sex=excluded.sex,
      bike_type=excluded.bike_type, rider_profile=excluded.rider_profile,
      favorite_bike=excluded.favorite_bike, primary_interest=excluded.primary_interest,
      message=excluded.message, consent_rgpd=excluded.consent_rgpd, status=excluded.status,
      invitation_sent_at=excluded.invitation_sent_at, converted_at=excluded.converted_at,
      user_id=excluded.user_id, created_at=excluded.created_at`;
  for (const row of rows) {
    const params = [
      row.id,
      row.first_name,
      row.email,
      row.location ?? row.city,
      row.city,
      row.age,
      row.sex,
      row.bike_type,
      row.rider_profile,
      row.favorite_bike,
      row.primary_interest,
      row.message,
      row.consent_rgpd ? 1 : 0,
      row.status ?? "pending",
      row.invitation_sent_at,
      row.converted_at,
      row.user_id,
      row.created_at,
    ];
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ sql, params }),
    });
    if (!response.ok)
      throw new Error(`Import D1 refusé (${response.status}): ${await response.text()}`);
  }
  const check = await fetch(endpoint, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ sql: "SELECT id, email FROM preinscriptions ORDER BY created_at" }),
  });
  if (!check.ok) throw new Error(`Contrôle D1 refusé (${check.status}): ${await check.text()}`);
  const payload = await check.json();
  const imported = payload.result?.[0]?.results ?? [];
  for (const row of rows)
    if (!imported.some((item) => item.id === row.id && item.email === row.email.toLowerCase()))
      throw new Error(`Contrôle échoué pour la préinscription ${row.id}`);
  return imported.length;
}

const mode = process.argv[2] ?? "all";
let rows;
if (mode === "export" || mode === "all") rows = await exportSource();
else rows = JSON.parse(await readFile(exportPath, "utf8"));
if (mode === "import" || mode === "all") {
  const total = await importTarget(rows);
  console.log(
    `Migration vérifiée: ${rows.length} ligne(s) importée(s), ${total} ligne(s) au total.`,
  );
} else console.log(`Export vérifié: ${rows.length} ligne(s) dans ${exportPath}.`);
