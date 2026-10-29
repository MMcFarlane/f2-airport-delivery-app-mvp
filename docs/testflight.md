# TestFlight release routine

How to get a new iOS build to testers. Bundle ID: `com.f2delivers.wingsnack`. App name in App Store Connect: **Airport Delivery**.

## Once per project (done)

1. `npx eas-cli@latest login`, then `npx eas-cli@latest init`.
2. Put the keys in EAS. Cloud builds can't see `.env.local`.
   ```bash
   npx eas-cli@latest env:set --name GOOGLE_MAPS_API_KEY --value <key> --environment production --visibility sensitive
   npx eas-cli@latest env:set --name SKYLINK_API_KEY --value <key> --environment production --visibility sensitive
   npx eas-cli@latest env:set --name GOOGLE_PLACES_CLIENT_KEY --value <key> --environment production --visibility sensitive
   npx eas-cli@latest env:set --name CATALOG_SOURCE --value places --environment production --visibility plaintext
   ```
   `CATALOG_SOURCE` was `fixtures` until October 28, 2026. It is `places` from Phase 11 on, so builds show real ATL restaurants and their photos.
   `GOOGLE_PLACES_API_KEY` stays local. Only `scripts/seed-places.ts` reads it.
3. During the first build, answer **Yes** to the certificate, provisioning profile and App Store Connect API key prompts. The API key role is **App Manager**. Answer **No** to push notifications.

## Every release

1. **Build and upload.**
   ```bash
   npx eas-cli@latest build --platform ios --profile production --auto-submit
   ```
   The Apple ID it asks for is your **email address**, not the Team ID. The build number goes up automatically.
2. **Wait** about 5 to 10 minutes for Apple's "processing complete" email.
3. **App Store Connect:** open **Airport Delivery**, then **TestFlight**, then the external group, then **Add Builds**.
4. **Update "What to Test"** and click **Submit for Review**. That review usually takes about a day, and later builds of the same version are often quicker.
5. **Approved:** testers get the update in the TestFlight app.

## Build status meanings

| Status | Meaning |
| --- | --- |
| Processing | Apple is still working on the upload. |
| Ready to Submit | Processed and waiting for you to submit it for Beta App Review. |
| Waiting for Review / In Review | Apple is reviewing it. |
| Ready to Test / Testing | Testers can install it. |

## Remember

- Builds expire after **90 days**.
- If you change a key, run `eas env:set` again and rebuild.
- When you raise `version` in `app.json` (for example to 1.1.0), the first build of that version gets a full review again.
- `SKYLINK_API_KEY` is built into the binary. That's acceptable for the stakeholder beta. Change the key after testing, and add a proxy before any wider release.
