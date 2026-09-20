import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "./supabase";

let registrationStarted = false;

/** Registers the signed-in user's native device for push notifications. */
export async function registerForPushNotifications() {
  const client = supabase;
  if (registrationStarted || !Capacitor.isNativePlatform() || !client) return;
  const {
    data: { session },
  } = await client.auth.getSession();
  if (!session) return;
  registrationStarted = true;

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") return;

  await PushNotifications.addListener("registration", async ({ value: token }) => {
    await client.from("push_tokens").upsert(
      {
        profile_id: session.user.id,
        token,
        platform: Capacitor.getPlatform() === "ios" ? "ios" : "android",
      },
      { onConflict: "profile_id,token" },
    );
  });
  await PushNotifications.addListener("registrationError", (error) => {
    console.error("Erreur d'enregistrement aux notifications push :", error);
  });
  await PushNotifications.register();
}

/** Sends a best-effort push without blocking the associated user action. */
export async function sendPushNotification(profileId: string, title: string, body: string) {
  if (!supabase) return;
  try {
    await supabase.functions.invoke("send-push", {
      body: { profile_id: profileId, title, body },
    });
  } catch {
    // A notification failure must not fail the message or match itself.
  }
}
