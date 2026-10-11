# Build & Release Guide — RKT Connect (Expo / EAS)

How to build the Android app and ship OTA (over-the-air) updates for this project.
Run every command from the project root: `D:\RKT_ESS\rough 2 og`.

> `npx eas-cli@latest` runs EAS without a global install. If you install it globally
> (`npm i -g eas-cli`), drop the `npx ... @latest` prefix and just use `eas`.

---

## Project facts

| Item | Value |
|---|---|
| App name | RKT Connect |
| Expo account / project | `sudhir-tbk9` / `essp202` |
| Android package | `com.sudhirtbk9.essp202` |
| Expo SDK | 54 |
| Current app version | `1.0.3` (`app.json` → `expo.version`) |
| Runtime version policy | `appVersion` → runtime = the app version (e.g. `1.0.3`) |
| Update channel | `production` (profile `production` in `eas.json`) |
| Android versionCode | Managed remotely by EAS, auto-incremented on every production build |
| Build output | `.aab` (convert to APK with bundletool) |

---

## 1. Should I make a build or an OTA update?

| What changed | Ship it with |
|---|---|
| JS / TSX code, styles, screens, text | **OTA update** |
| Images / Lottie files used by the JS code | **OTA update** |
| App icon, splash screen, app name | **New build** |
| `app.json` native config (permissions, plugins, `googleServicesFile`, build properties) | **New build** |
| Adding/removing/upgrading a package with native code (`expo-*`, `react-native-*`) | **New build** + new app version |
| Expo SDK upgrade | **New build** + new app version |

**Rule of thumb:** if it only touches JavaScript or assets, use an OTA update. If it touches anything native, make a new build.

---

## 2. Production build (Android)

```bash
npx eas-cli@latest build -p android --profile production
```

- versionCode increments automatically (remote `autoIncrement`).
- Signed with the existing keystore stored on Expo's servers (the same signature as earlier releases, so installs update in place).
- When it finishes, the CLI prints a link to download the `.aab`.
- The build only includes the CPU types real phones use (`armeabi-v7a,arm64-v8a`, set in `eas.json` → `production.env`), which keeps the app small.

Start a build without waiting for it to finish:

```bash
npx eas-cli@latest build -p android --profile production --non-interactive --no-wait
```

Check on builds:

```bash
npx eas-cli@latest build:list --platform android --limit 5
npx eas-cli@latest build:view <BUILD_ID>
```

### Convert `.aab` → `.apk` (bundletool)

Working folder: `C:\Users\sudhir.yadav\Documents\aabTOapkessp202` (contains `bundletool-all-1.17.2.jar` and the keystore backup).

1. Download the `.aab` from the build page into that folder.
2. Run (Windows, one line). Replace the `.aab` file name with the build you downloaded:

```bat
java -jar "C:\Users\sudhir.yadav\Documents\aabTOapkessp202\bundletool-all-1.17.2.jar" build-apks "--bundle=C:\Users\sudhir.yadav\Documents\aabTOapkessp202\application-<BUILD_ID>.aab" "--output=C:\Users\sudhir.yadav\Documents\aabTOapkessp202\RKT-connect.apks" "--ks=C:\Users\sudhir.yadav\Documents\aabTOapkessp202\@sudhir-tbk9__essp202-keystore.bak.jks" "--ks-key-alias=30217163bcc443ed56cb71f62d34f572" "--ks-pass=pass:<KEYSTORE_PASSWORD>" "--key-pass=pass:<KEY_PASSWORD>" "--mode=universal" "--overwrite"
```

3. The `.apks` file is a zip. Extract the installable APK from it:

```bat
cd /d C:\Users\sudhir.yadav\Documents\aabTOapkessp202
tar -xf RKT-connect.apks universal.apk
ren universal.apk RKT-connect.apk
```

- **Passwords:** keep them out of git. They're in the local script `scripts/aab-to-apk.local.cmd` (gitignored), and you can always see them with `npx eas-cli@latest credentials -p android` → *Keystore* → show credentials.
- **One-step shortcut:** `scripts\aab-to-apk.local.cmd application-<BUILD_ID>.aab` runs steps 2–3 and leaves `RKT-connect.apk` in the working folder.
- `--mode=universal` makes one APK for every phone (32-bit and 64-bit ARM). For a smaller 64-bit-only APK, replace it with `--device-spec=spec.json`, where `spec.json` is `{"supportedAbis":["arm64-v8a"],"sdkVersion":34,"screenDensity":480}`.
- The keystore must be this project's upload key (the one EAS signs with). Otherwise phones refuse to install the APK as an update over the existing app.

---

## 3. OTA update (production)

```bash
npx eas-cli@latest update --channel production --platform android --message "Describe the change"
```

- Only phones whose **runtime version matches the current `app.json` version** receive it. For example, with `"version": "1.0.3"`, only installs built as 1.0.3 get the update.
- Users get it in the background. The app shows an **"Update ready – Restart?"** popup (`src/hooks/useOTAUpdate.ts`); if they tap *Later*, it applies on the next app launch.
- Add `--non-interactive` to skip prompts (e.g. in scripts).

### ⚠️ Version rules (important)

- **Don't change `"version"` in `app.json` just to publish an OTA update.** Changing it changes the runtime, and the update would no longer reach existing installs.
- **Do bump the version** (e.g. `1.0.3` → `1.0.4`) when you change native code or dependencies. Then make a new build. Older installs keep receiving updates published for their own runtime only.
- To ship a fix to an **older** runtime (e.g. 1.0.2 phones), temporarily set `"version"` back to that runtime, publish, then set it back. Only do this with JS that is compatible with that build's native code.

### See / roll back updates

```bash
# List recent updates on the production branch
npx eas-cli@latest update:list --branch production --limit 10

# Re-publish an older, known-good update group (effectively a rollback)
npx eas-cli@latest update:republish --group <UPDATE_GROUP_ID>
```

---

## 4. Typical release flow

```bash
# 1. Check the JS bundle compiles (catches import / syntax errors)
npx expo export --platform android --output-dir %TEMP%\rkt-export

# 2. Health-check dependencies
npx expo-doctor@latest

# 3a. Native change → build
npx eas-cli@latest build -p android --profile production

# 3b. JS-only change → OTA
npx eas-cli@latest update --channel production --platform android --message "..."
```

Commit to git before building/publishing, so the code matches what users are running.

---

## 5. Local development

```bash
npm run dev                 # expo start (scan the QR with Expo Go)
npx expo start -c           # same, with Metro cache cleared
npx expo install --check    # list packages that don't match SDK 54
npx expo install --fix      # align them to SDK 54 versions
npx expo install <package>  # always install Expo/RN packages this way
```

Behaviour in Expo Go vs. a real build differs:
- **Expo Go doesn't run OTA updates** (`useOTAUpdate` is disabled in `__DEV__`).
- **Push notifications don't work in Expo Go on Android** (SDK 53+). Test them on a production/dev build.
- Expo Go includes native modules your app might be missing (e.g. `react-native-svg` was missing once and only crashed in the real build). Always run `npx expo-doctor@latest` before building.

---

## 6. Push notifications (Expo Push)

How it works: the app registers its Expo push token with the backend on every start (`src/hooks/usePushNotifications.ts` → `POST /api/v1/push-tokens`). The backend cron sends the timesheet reminder **Mon–Sat 17:30 IST** to every registered device, logged in or not.

Requirements (already set up):
- `google-services.json` in the project root (Firebase project `androidessp202`). `app.json` → `android.googleServicesFile`.
- FCM V1 service account key uploaded at **expo.dev → essp202 → Credentials → Android**.
- iOS: the APNs key is set up by EAS during the first iOS build (`eas credentials -p ios`).

Send a test push (backend admin key needed):

```bash
curl -X POST https://ess.rishikirti.com/api/v1/push-tokens/test \
  -H "x-push-admin-key: <PUSH_ADMIN_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"employeeCode":"<EMPLOYEE_CODE>"}'
```

The Android notification channel is `timesheet-reminders`; the backend must send with that `channelId`.

---

## 7. Credentials

```bash
npx eas-cli@latest whoami                 # who you're logged in as
npx eas-cli@latest login                  # log in
npx eas-cli@latest credentials -p android # view/manage keystore & FCM key
```

Never commit the keystore, the FCM service-account JSON, or `.env` files.

---

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| OTA update not arriving | Check `app.json` version = the installed build's runtime; check the channel is `production`; fully close and reopen the app (twice if needed). |
| App stuck on "getting things ready" | The icon-font load failed. `Drawer.tsx` now always continues, but check `Font.loadAsync` keys match `@expo/vector-icons` (`...Ionicons.font`). |
| Icon clipped on round launchers | Keep the logo inside the center ~60% of `assets/adaptive-icon-foreground.png`. Icon changes need a **new build**. |
| Build fails on dependencies | `npx expo-doctor@latest`, then `npx expo install --fix`. |
| "Duplicate native module" warning | Check the `overrides` in `package.json`; delete `node_modules` and run `npm install`. |
| Upload to EAS is slow / large | Add unneeded folders to `.easignore` (it replaces `.gitignore` for EAS uploads). |
| Notifications missing after swiping the app away (Xiaomi/Oppo/Vivo) | Server push (Expo Push) handles this. For phone-level reliability: Settings → Apps → RKT Connect → Autostart **On**, Battery **No restrictions**. |
