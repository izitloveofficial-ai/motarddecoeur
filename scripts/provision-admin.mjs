#!/usr/bin/env node
const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable requise absente: ${name}`);
  return value;
};
const url = required("SUPABASE_URL").replace(/\/$/, "");
const key = required("SUPABASE_SERVICE_ROLE_KEY");
const email = required("ADMIN_EMAIL").toLowerCase();
const headers = { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" };
const usersResponse = await fetch(`${url}/auth/v1/admin/users?per_page=1000`, { headers });
if (!usersResponse.ok) throw new Error(`Lecture des comptes refusée (${usersResponse.status})`);
let user = (await usersResponse.json()).users.find(
  (candidate) => candidate.email?.toLowerCase() === email,
);
if (!user) {
  const password = required("ADMIN_PASSWORD");
  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!response.ok)
    throw new Error(`Création du compte refusée (${response.status}): ${await response.text()}`);
  user = await response.json();
}
const grant = await fetch(`${url}/rest/v1/admin_users`, {
  method: "POST",
  headers: { ...headers, prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify({ user_id: user.id }),
});
if (!grant.ok)
  throw new Error(`Attribution du rôle refusée (${grant.status}): ${await grant.text()}`);
console.log(`Rôle administrateur attribué au compte ${user.id}.`);
