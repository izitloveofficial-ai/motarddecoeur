import { describe, expect, test } from "bun:test";
import type { Session } from "@supabase/supabase-js";
import { hasAdminAccess, hasAppAccess } from "./require-admin";

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
  authEvent?: Session | null;
  authEventDelay?: number;
  refreshed?: Session | null;
  sessionError?: object | null;
  refreshError?: object | null;
  admin?: boolean;
  tester?: boolean;
  rpcError?: object | null;
  testerRpcError?: object | null;
}) {
  const authorizationHeaders: string[] = [];
  let refreshCount = 0;
  let subscriptionCount = 0;
  let unsubscribeCount = 0;
  return {
    fake: {
      auth: {
        getSession: async () => ({
          data: { session: options.current ?? null },
          error: options.sessionError ?? null,
        }),
        onAuthStateChange: (
          callback: (event: "INITIAL_SESSION", session: Session | null) => void,
        ) => {
          subscriptionCount += 1;
          const timer = setTimeout(
            () => callback("INITIAL_SESSION", options.authEvent ?? null),
            options.authEventDelay ?? 0,
          );
          return {
            data: {
              subscription: {
                unsubscribe() {
                  unsubscribeCount += 1;
                  clearTimeout(timer);
                },
              },
            },
          };
        },
        refreshSession: async () => {
          refreshCount += 1;
          return {
            data: { session: options.refreshed ?? null },
            error: options.refreshError ?? null,
          };
        },
      },
      rpc: (functionName: string) => ({
        setHeader(name: string, value: string) {
          if (name === "Authorization") authorizationHeaders.push(value);
          const isTesterCheck = functionName === "is_beta_tester";
          return Promise.resolve({
            data: isTesterCheck ? (options.tester ?? false) : (options.admin ?? true),
            error: isTesterCheck ? (options.testerRpcError ?? null) : (options.rpcError ?? null),
          });
        },
      }),
    } as never,
    authorizationHeaders,
    getRefreshCount: () => refreshCount,
    getSubscriptionCount: () => subscriptionCount,
    getUnsubscribeCount: () => unsubscribeCount,
  };
}

describe("hasAdminAccess", () => {
  test("uses the current session token for the strict RPC check", async () => {
    const mock = client({ current: session(), admin: true });

    expect(await hasAdminAccess(mock.fake)).toBe(true);
    expect(mock.authorizationHeaders).toEqual(["Bearer current-token"]);
    expect(mock.getRefreshCount()).toBe(0);
    expect(mock.getSubscriptionCount()).toBe(0);
  });

  test("uses the initial auth event when browser session restoration is delayed", async () => {
    const mock = client({
      current: null,
      authEvent: session({ access_token: "restored-token" }),
      authEventDelay: 10,
    });

    expect(await hasAdminAccess(mock.fake)).toBe(true);
    expect(mock.authorizationHeaders).toEqual(["Bearer restored-token"]);
    expect(mock.getSubscriptionCount()).toBe(1);
    expect(mock.getUnsubscribeCount()).toBe(1);
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

describe("hasAppAccess", () => {
  test("allows admins and beta testers with the current session token", async () => {
    const admin = client({ current: session(), admin: true, tester: false });
    const tester = client({ current: session(), admin: false, tester: true });

    expect(await hasAppAccess(admin.fake)).toBe(true);
    expect(await hasAppAccess(tester.fake)).toBe(true);
    expect(admin.authorizationHeaders).toEqual(["Bearer current-token", "Bearer current-token"]);
    expect(tester.authorizationHeaders).toEqual(["Bearer current-token", "Bearer current-token"]);
  });

  test("denies users with neither role and ignores failed role checks", async () => {
    expect(
      await hasAppAccess(client({ current: session(), admin: false, tester: false }).fake),
    ).toBe(false);
    expect(
      await hasAppAccess(
        client({
          current: session(),
          admin: false,
          tester: true,
          testerRpcError: {},
        }).fake,
      ),
    ).toBe(false);
  });
});
