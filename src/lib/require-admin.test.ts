import { describe, expect, test } from "bun:test";
import type { Session } from "@supabase/supabase-js";
import { hasAdminAccess } from "./require-admin";

function session(overrides: Partial<Session> = {}): Session {
  return {
    access_token: "current-token",
    refresh_token: "refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: { id: "admin-id" } as Session["user"],
    ...overrides,
  };
}

function client(options: {
  current?: Session | null;
  refreshed?: Session | null;
  sessionError?: object | null;
  refreshError?: object | null;
  admin?: boolean;
  rpcError?: object | null;
}) {
  const authorizationHeaders: string[] = [];
  let refreshCount = 0;
  const rpcResult = {
    setHeader(name: string, value: string) {
      if (name === "Authorization") authorizationHeaders.push(value);
      return Promise.resolve({ data: options.admin ?? true, error: options.rpcError ?? null });
    },
  };

  return {
    fake: {
      auth: {
        getSession: async () => ({
          data: { session: options.current ?? null },
          error: options.sessionError ?? null,
        }),
        refreshSession: async () => {
          refreshCount += 1;
          return {
            data: { session: options.refreshed ?? null },
            error: options.refreshError ?? null,
          };
        },
      },
      rpc: () => rpcResult,
    } as never,
    authorizationHeaders,
    getRefreshCount: () => refreshCount,
  };
}

describe("hasAdminAccess", () => {
  test("uses the current session token for the strict RPC check", async () => {
    const mock = client({ current: session(), admin: true });

    expect(await hasAdminAccess(mock.fake)).toBe(true);
    expect(mock.authorizationHeaders).toEqual(["Bearer current-token"]);
    expect(mock.getRefreshCount()).toBe(0);
  });

  test("refreshes an expiring token before checking the role", async () => {
    const mock = client({
      current: session({ expires_at: Math.floor(Date.now() / 1000) + 10 }),
      refreshed: session({ access_token: "fresh-token" }),
      admin: true,
    });

    expect(await hasAdminAccess(mock.fake)).toBe(true);
    expect(mock.authorizationHeaders).toEqual(["Bearer fresh-token"]);
    expect(mock.getRefreshCount()).toBe(1);
  });

  test("denies missing sessions, failed refreshes, non-admins, and RPC failures", async () => {
    expect(await hasAdminAccess(client({ current: null }).fake)).toBe(false);
    expect(
      await hasAdminAccess(
        client({
          current: session({ expires_at: 0 }),
          refreshError: {},
        }).fake,
      ),
    ).toBe(false);
    expect(await hasAdminAccess(client({ current: session(), admin: false }).fake)).toBe(false);
    expect(await hasAdminAccess(client({ current: session(), rpcError: {} }).fake)).toBe(false);
  });
});
