export type DailyPoint = { date: string; label: string; count: number };

function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Nombre d'éléments créés chaque jour sur les `days` derniers jours (jour courant inclus). */
export function buildDailySeries(
  dates: readonly string[],
  days: number,
  now: Date = new Date(),
): DailyPoint[] {
  const counts = new Map<string, number>();
  const points: DailyPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const key = dayKey(day);
    counts.set(key, 0);
    points.push({
      date: key,
      label: `${String(day.getDate()).padStart(2, "0")}/${String(day.getMonth() + 1).padStart(2, "0")}`,
      count: 0,
    });
  }
  for (const value of dates) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) continue;
    const key = dayKey(parsed);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return points.map((point) => ({ ...point, count: counts.get(point.date) ?? 0 }));
}

/** Variation en pourcentage entre deux périodes ; null si la période précédente est vide. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
