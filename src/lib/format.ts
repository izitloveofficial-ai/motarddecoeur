/** Âge en années révolues à partir d'une date de naissance (ISO). */
export function ageFromBirthDate(value: string, now: Date = new Date()): number {
  const birth = new Date(value);
  let years = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) years--;
  return years;
}

/** Date au format français (jj/mm/aaaa). */
export function formatDateFr(value: string | number | Date): string {
  return new Date(value).toLocaleDateString("fr-FR");
}
