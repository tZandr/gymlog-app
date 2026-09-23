# send-push

One-time-pipeline-proving Edge Function (see Phase 0 plan). Sends a web push to a given user's stored `push_subscriptions` row(s). Callable only with the project's secret key (server-to-server), never from the frontend.

## Deploy

```
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT="mailto:you@example.com"
npx supabase functions deploy send-push
```

The VAPID keypair is the same one generated for `frontend/.env`'s `VITE_VAPID_PUBLIC_KEY` — only the private half goes here, never to the frontend.

## Test

```
curl -i --location --request POST 'https://<project-ref>.supabase.co/functions/v1/send-push' \
  --header 'Authorization: Bearer <service-role-key>' \
  --header 'Content-Type: application/json' \
  --data '{"user_id":"<owner-user-id>","title":"Test","body":"It works"}'
```

Requires the owner account to have already run "Enable notifications" from the app's Settings page at least once (so a row exists in `push_subscriptions`).
