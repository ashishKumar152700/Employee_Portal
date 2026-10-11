I need you to add Expo push notifications to this backend: a daily "fill your timesheet" reminder sent Monday–Saturday at 17:30 India time to every phone that has our mobile app (RKT Connect, Expo SDK 54) installed, whether the user is logged in or not.

The mobile app side is already done. Implement the backend side exactly to the contract below, following this project's existing conventions (Express routers/controllers, Prisma, node-cron, axios, error handling, logging style). Don't add new npm dependencies unless necessary; axios and node-cron are already installed.

## 0. First, verify
- Confirm this repo is the code actually deployed at https://ess.rishikirti.com (check the git branch, remote and latest commits, and look for the existing `/api/v1/auth/login` route). If it looks stale or there's a newer branch, stop and tell me before changing anything.
- Find how the server runs in production (Dockerfile, PM2, cluster mode, number of instances). If more than one instance runs, the cron must only fire once (see section 3).
- Check how this project applies schema changes (prisma migrate vs db push) and follow that.

## 1. Database: push token table
Add a Prisma model in the project's naming style, e.g. `rkt_ess_push_tokens`:
- `id` (autoincrement PK)
- `token` (string, UNIQUE): an Expo push token like `ExponentPushToken[xxxx]`
- `platform` (string: "android" | "ios")
- `employee_code` (string, nullable): set when the user is logged in, null otherwise
- `app_version` (string, nullable)
- `created_at`, `updated_at` (`updated_at` acts as "last seen")

## 2. Endpoint the app calls (already implemented in the app)
`POST /api/v1/push-tokens`
- PUBLIC, no auth (the app registers on start, before login). Do not put it behind the auth middleware.
- JSON body: `{ "token": string, "platform": "android"|"ios", "employeeCode": string|null, "appVersion": string|null }`
- Validate `token` against `^Expo(nent)?PushToken\[.+\]$`. Reject anything else with 400. Cap string lengths.
- UPSERT by `token`: update `platform`, `employee_code` (may become null after logout), `app_version` and `updated_at`.
- Respond `200 { success: true }`.
- The app re-sends at most once a day per device, or when the token or employee code changes.

## 3. Scheduled reminder (cron)
- Use node-cron like `src/cron/leaveCron.ts`: `cron.schedule("30 17 * * 1-6", fn, { timezone: "Asia/Kolkata" })`. Start it from app startup the same way `startLeaveCron` is started. No Sundays.
- If the app runs as multiple instances, make sure it only sends once: run it only on one instance (e.g. an env flag like `RUN_CRONS=true`), or use a DB lock.
- Send to ALL rows in the push token table (logged-in and logged-out devices).
- Send through Expo's push API: `POST https://exp.host/--/api/v2/push/send`
  - headers: `Content-Type: application/json`, `Accept: application/json`, `Accept-Encoding: gzip, deflate`; if env `EXPO_ACCESS_TOKEN` is set, add `Authorization: Bearer <it>`
  - body: an array of messages, MAX 100 per request (chunk the tokens):
    ```json
    {
      "to": "<token>",
      "title": "Timesheet reminder ⏰",
      "body": "Don't forget to fill in today's timesheet before you wrap up.",
      "sound": "default",
      "priority": "high",
      "channelId": "timesheet-reminders",
      "data": { "type": "timesheet_reminder" }
    }
    ```
    `channelId` must be exactly `timesheet-reminders` (the app creates that Android channel).
- The response has `data: [ticket...]` in the same order as the messages. For any ticket with `status: "error"` and `details.error === "DeviceNotRegistered"`, delete that token from the table. Log other errors.
- Receipts: about 15 minutes later (setTimeout, or a second cron at 17:45 Mon–Sat), call `POST https://exp.host/--/api/v2/push/getReceipts` with `{ "ids": [...] }` (max 1000 ids per request) for the ticket ids from that run. Delete tokens whose receipt error is `DeviceNotRegistered`, and log the rest.
- One failing chunk must not stop the others. Log a summary per run: devices targeted, sent OK, errors, tokens removed.

## 4. Manual test endpoint (so we can test without waiting for 17:30)
`POST /api/v1/push-tokens/test`
- Protected: require header `x-push-admin-key` equal to env `PUSH_ADMIN_KEY` (return 401 otherwise, and 503 if the env var isn't set).
- Optional body `{ "employeeCode"?: string, "token"?: string, "title"?: string, "body"?: string }`. If `token` or `employeeCode` is given, send only to those devices; otherwise send to all. Reuse the same sending function as the cron.
- Return the tickets / summary in the response.

## 5. Finish
- Add the new env vars (`PUSH_ADMIN_KEY`, optional `EXPO_ACCESS_TOKEN`, and the cron-instance flag if you added one) to whatever env example/docs the project has.
- Make sure it compiles (`npm run build`) and nothing existing breaks.
- Give me: the files changed, the migration/schema steps to run on the production DB, the deploy steps, and a ready-to-run curl command for the test endpoint, e.g.
  `curl -X POST https://ess.rishikirti.com/api/v1/push-tokens/test -H "x-push-admin-key: <key>" -H "Content-Type: application/json" -d '{"employeeCode":"<code>"}'`
- Don't deploy or run migrations on production yourself. Tell me the steps and I'll do them.
