import { describe, expect, test } from "bun:test";
import { mergeMessages } from "./message-sync";

type TestMessage = {
  id: string;
  created_at: string;
  content: string;
  read_at: string | null;
};

const message = (
  id: string,
  createdAt: string,
  content = id,
  readAt: string | null = null,
): TestMessage => ({ id, created_at: createdAt, content, read_at: readAt });

describe("mergeMessages", () => {
  test("keeps messages chronological when Realtime events arrive out of order", () => {
    const result = mergeMessages(
      [message("later", "2026-09-24T10:00:02.000Z")],
      [message("earlier", "2026-09-24T10:00:01.000Z")],
    );

    expect(result.map(({ id }) => id)).toEqual(["earlier", "later"]);
  });

  test("deduplicates a message returned by both history and Realtime", () => {
    const result = mergeMessages(
      [message("same", "2026-09-24T10:00:00.000Z")],
      [message("same", "2026-09-24T10:00:00.000Z")],
    );

    expect(result).toHaveLength(1);
  });

  test("applies the latest version of an updated message", () => {
    const result = mergeMessages(
      [message("same", "2026-09-24T10:00:00.000Z")],
      [message("same", "2026-09-24T10:00:00.000Z", "same", "2026-09-24T10:00:03.000Z")],
    );

    expect(result[0]?.read_at).toBe("2026-09-24T10:00:03.000Z");
  });

  test("uses the id as a stable tie-breaker", () => {
    const timestamp = "2026-09-24T10:00:00.000Z";
    const result = mergeMessages([message("b", timestamp)], [message("a", timestamp)]);

    expect(result.map(({ id }) => id)).toEqual(["a", "b"]);
  });
});
