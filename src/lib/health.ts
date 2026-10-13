/** Point de contrôle pour la surveillance (uptime) : ne dépend d'aucun service externe. */
export function healthResponse(now: Date = new Date()): Response {
  return Response.json(
    { status: "ok", time: now.toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}
