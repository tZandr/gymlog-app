// Sends a web push notification to one user's stored subscription(s).
// Phase 0 scope: proves the subscribe -> store -> send -> arrive pipeline works,
// manually triggered. Wiring this to real events (e.g. "coach updated your plan")
// happens once the coach-client relationship exists.
//
// Invoke with the project's secret key (server-to-server only, never from the
// frontend) and a JSON body: { "user_id": "...", "title": "...", "body": "..." }
//
// Required secrets (supabase secrets set ...):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (e.g. "mailto:you@example.com")

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import webpush from "npm:web-push@3";

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT")!,
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

export default {
  fetch: withSupabase({ auth: ["secret"] }, async (req, ctx) => {
    const { user_id, title, body } = await req.json();
    if (!user_id) {
      return Response.json({ error: "user_id is required" }, { status: 400 });
    }

    const { data: subscriptions, error } = await ctx.supabaseAdmin
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", user_id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const payload = JSON.stringify({ title: title ?? "GymLog", body: body ?? "Test notification" });

    const results = await Promise.allSettled(
      (subscriptions ?? []).map((row) => webpush.sendNotification(row.subscription, payload)),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    return Response.json({ sent: results.length - failed, failed });
  }),
};
