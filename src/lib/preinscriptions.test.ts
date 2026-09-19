import { describe, expect, test } from "bun:test";
import { submitPreinscription, type PreinscriptionStore } from "./preinscriptions";

const valid = {
  first_name: "Alice",
  email: "Alice@Example.COM",
  location: "Lyon",
  rider_profile: "motarde",
  favorite_bike: "Honda CB500",
  primary_interest: "balades_moto",
  message: "Bonjour",
  consent_rgpd: true,
  website: "",
} as const;

function memoryStore() {
  const rows: unknown[] = [];
  const emails = new Set<string>();
  const store: PreinscriptionStore = {
    async create(input) {
      if (emails.has(input.email)) return "duplicate";
      emails.add(input.email);
      rows.push({ ...input, status: "pending" });
      return "created";
    },
  };
  return { rows, store };
}

describe("préinscriptions", () => {
  test("enregistre une saisie valide et normalise l'adresse", async () => {
    const db = memoryStore();
    const result = await submitPreinscription(valid, db.store);
    expect(result.status).toBe(201);
    expect(db.rows).toEqual([
      expect.objectContaining({ email: "alice@example.com", status: "pending" }),
    ]);
  });

  test.each([
    [{ ...valid, consent_rgpd: false }, "consentement faux"],
    [
      Object.fromEntries(Object.entries(valid).filter(([key]) => key !== "consent_rgpd")),
      "consentement absent",
    ],
    [{ ...valid, first_name: "" }, "prénom vide"],
    [{ ...valid, email: "pas-un-email" }, "e-mail invalide"],
    [{ ...valid, message: "x".repeat(1001) }, "champ trop long"],
    [{ ...valid, website: "spam.example" }, "honeypot rempli"],
  ])("refuse %s", async (input) => {
    const db = memoryStore();
    expect((await submitPreinscription(input, db.store)).status).toBe(400);
    expect(db.rows).toHaveLength(0);
  });

  test("un doublon ne crée pas de seconde ligne", async () => {
    const db = memoryStore();
    await submitPreinscription(valid, db.store);
    const duplicate = await submitPreinscription(
      { ...valid, email: "ALICE@example.com" },
      db.store,
    );
    expect(duplicate.body.duplicate).toBe(true);
    expect(db.rows).toHaveLength(1);
  });

  test("traite du contenu hostile comme une simple valeur", async () => {
    const db = memoryStore();
    const attack = "Robert'); DROP TABLE preinscriptions;--";
    expect((await submitPreinscription({ ...valid, first_name: attack }, db.store)).status).toBe(
      201,
    );
    expect(db.rows).toEqual([expect.objectContaining({ first_name: attack })]);
  });
});
