# AERIAL-PLANNER-PRO (Drone weather)

## Push notification setup

### Frontend env values
Update `js/env.js` (or override `window.AERIAL_PLANNER_ENV` before `config.js` loads) with:

```js
window.AERIAL_PLANNER_ENV = {
  VAPID_PUBLIC_KEY: "<your-vapid-public-key>",
  SUPABASE_FUNCTIONS_URL: "https://<project-ref>.supabase.co/functions/v1",
};
```

The public VAPID key is safe to expose in the client. **Do not** place any service role key in the frontend.

### Deploy Supabase Edge Functions
From the repo root:

```bash
supabase functions deploy push-subscribe
supabase functions deploy rules-upsert
supabase functions deploy push-check
```

Secrets are already expected in Supabase:

- `SB_URL`
- `SB_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `CRON_SECRET`

## Manual test checklist

**Chrome Desktop**
1. Open the app, choose a date in the timeline, and click **“הפעל התראות לתאריך הנבחר”**.
2. Grant notification permission when prompted.
3. Confirm a success toast appears.
4. Trigger the `push-check` function with a valid `x-cron-secret` and verify a notification arrives.
5. Click **“כיבוי התראות לתאריך”** and confirm it shows a success toast.

**Android Chrome**
1. Open the app, choose a date, and enable notifications.
2. Accept the notification prompt (and add to home screen if required by Android).
3. Trigger `push-check` and confirm the notification is received.
4. Tap the notification and confirm it opens the app URL.
