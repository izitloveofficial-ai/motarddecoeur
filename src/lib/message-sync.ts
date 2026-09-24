export type ChronologicalMessage = {
  id: string;
  created_at: string;
};

/**
 * Merge the initial history, optimistic inserts and Realtime events without
 * duplicates. Realtime may deliver an INSERT while the history request is in
 * flight, or redeliver it after a reconnect, so every merge is idempotent and
 * chronological.
 */
export function mergeMessages<T extends ChronologicalMessage>(
  current: readonly T[],
  incoming: readonly T[],
): T[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);

  return [...byId.values()].sort((first, second) => {
    const chronological =
      new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
    return chronological || first.id.localeCompare(second.id);
  });
}
