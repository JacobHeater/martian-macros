# Privacy & security review — MM-242 (EULA / first-run terms guard)

## Scope and traceability

- **Role:** privacy-security (canonical: `C:\Users\jacob\dev\martian-macros\agents\roles\privacy-security.md`). A review lens, not a credential. **I am not a lawyer; nothing below is legal advice.**
- **Reviewer:** read-only subagent of the chair, session of 2026-10-12. No edits, no commands, no delegation.
- **Branch / commit:** `feature/mm237-storybook-material` @ `40c8d1b` (as given by the chair; I could not run git).
- **Requirement:** MM-242 has no ticket file yet (`requirements/HANDOFF.md:45` names MM-242 only as the next free ID). Related tickets inspected: MM-95, MM-57, MM-56, MM-62, MM-68, MM-13, MM-58 (header only).
- **Input SHA-256 hashes:** not recorded. I have no shell or hashing tool; the chair must compute them for the files listed under Audit coverage.
- **Config files read in full before work:** `AGENTS.md`, `agents/roles/privacy-security.md`, `agents/panel-protocol.md`, `agents/review-contract.md`.

## Headline

1. **An EULA alone does not meet the platform's requirements.** Google Play requires a separate, publicly hosted privacy policy for every app, linked in Play Console and inside the app. Health Connect also expects the app's rationale screen to show that same policy. None of this exists today (PS-2).
2. **The terms cannot safely say "nothing is uploaded" yet.** The app bundles two Google ML Kit libraries, and Google's own disclosure says ML Kit sends diagnostics and usage data to Google. The app's current "nothing is uploaded / the only thing this app ever fetches" statements are unverified against that (PS-1). Either verify with a network monitor on a release build, or word the terms narrowly.
3. **Recommended acceptance record:** terms version plus acceptance time, kept in the local database only, and removed by "Erase all data" so the guard shows again.

## Existing facts versus proposals

### Verified in the repository (source inspection only, no runtime)

| Fact | Evidence |
|---|---|
| No EULA, terms or privacy-policy screen or text exists | Case-insensitive grep for `MM-242\|EULA\|terms of use\|licence agreement\|license agreement` over `requirements/`, `docs/`, `roadmap/`, `apps/mobile/src/` found only MM-57, MM-51 and `HANDOFF.md:45` |
| First-run routing is setup → theme chooser → onboarding → adults-only block → home; there is no terms gate | `apps/mobile/src/app/AppRoot.tsx:52-62` |
| Health data lives in one SQLite database in app-private storage | `MmDbPlugin.kt:49` (`context.getDatabasePath(name)`), 21 tables in `apps/mobile/src/data/schema.ts:15-37` |
| The database is not encrypted by the app | `MmDbPlugin.kt:39,57` (plain `BundledSQLiteDriver`, no key); `apps/mobile/android/app/build.gradle:41` |
| Stored data includes sensitive screening answers: pregnancy, breastfeeding, eating-disorder history, kidney disease, androgen use, PCOS, menopause, thyroid, insulin, bariatric surgery, medication | `schema.ts:56-67` |
| Stored data also includes birth date, sex, height, weights, waist, food log, recovery check-ins (hunger, mood, sleep), workouts and imported Health Connect samples | `schema.ts:42-268` |
| The app's own JS makes no network calls outside the pack download | Grep for `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `localStorage`, `indexedDB` in `apps/mobile/src` matched only `PackDownload.ts:83,94` (its own method). Grep for `https?://` in `src` matched only a comment at `PackManifest.ts:46` |
| No analytics or crash library in the JS dependencies | `apps/mobile/package.json:17-28` |
| One native HTTP fetch: no body, no cookies set, follows redirects, started only by a button | `MmPacksPlugin.kt:234-285` (`instanceFollowRedirects = true` at 244); `FoodDatabaseScreen.tsx:72-76`; `AvailablePackCard.tsx:31` |
| The download host is GitHub | `config/prod.json:3` and `config/dev.json:3` (`https://github.com/JacobHeater/martian-macros-food-data/releases/latest/download/manifest.json`); wired in `apps/mobile/vite.config.ts:10-19` |
| Pack URLs must be https and are checked against a SHA-256 | `PackManifest.ts:25-27` |
| Health Connect is read-only, with seven read permissions and no write permission | `AndroidManifest.xml:87-93`; `MmHealthPlugin.kt:43-51,67-68` |
| Health Connect types: weight, body fat, lean body mass, height, exercise sessions, menstruation flow, steps | `MmHealthPlugin.kt:43-51` |
| Each type is granted separately; menstruation is offered only to female profiles | `HealthConnectSection.tsx:54-71` |
| Imported readings are kept after permission is withdrawn, until erase | `HealthConnectSection.tsx:105-108` |
| Camera: barcodes are read live on the device; the label photo goes to the app cache, is read by ML Kit, then deleted | `ScanActivity.kt:38-47,93-113`; `MmScannerPlugin.kt:84-115` |
| Reminders are local alarms with no push service; their schedule is kept in app preferences outside the database | `MmRemindersPlugin.kt:23-29` |
| Cloud backup is disabled | `AndroidManifest.xml:5` (`allowBackup="false"`) |
| No backup or export feature exists; Settings says "Encrypted backup is coming" | `SettingsScreen.tsx:194-197`; MM-63 exists only as a requirement |
| Erase deletes every row of every table in one transaction | `apps/mobile/src/data/SqlDataEraser.ts:16-20` |
| Erase leaves deleted data in free pages of the database file | `requirements/persistence/STORY.erase-all-data.MM-62.md:36` (stated by the ticket) |
| Adults-only is a self-declared date of birth with no verification | `requirements/onboarding/STORY.adults-only.MM-13.md:39`; `AppRoot.tsx:55-56` |
| No `google-services.json` in the app module, so the Firebase plugin is not applied | Glob returned nothing; `build.gradle:67-74` |
| Target SDK 36, minimum SDK 26 | `apps/mobile/android/variables.gradle:3-5` |
| App identity is still the demo one | `capacitor.config.ts:6-7` ("Martian Macros DEMO"); `build.gradle:8` |

### Not verified, or contradicted

- **"US-only"** is not enforced in code that I found. It is a Play Console distribution setting and a food-data scope (`docs/architecture.md:162`).
- **"Nothing is uploaded"** is contradicted by Google's ML Kit disclosure (PS-1).
- **The live Open Food Facts lookup (MM-58)** is `proposed` and no code for it was found. The terms must not mention it as existing.

## Audit coverage

- **Audit mode:** change (planning), with a targeted audit of existing data flows that the agreement would describe.
- **Inspected in full:**
  - `apps/mobile/src/settings/SettingsScreen.tsx`
  - `apps/mobile/src/settings/HealthConnectSection.tsx`
  - `apps/mobile/src/app/AppRoot.tsx`
  - `apps/mobile/src/foodPacks/FoodDatabaseScreen.tsx`
  - `apps/mobile/src/foodPacks/AvailablePackCard.tsx`
  - `apps/mobile/src/foodCatalog/download/PackManifest.ts`
  - `apps/mobile/src/data/SqlDataEraser.ts`
  - `apps/mobile/src/data/schema.ts`
  - `apps/mobile/vite.config.ts`, `apps/mobile/package.json`, `apps/mobile/capacitor.config.ts`, `apps/mobile/index.html`
  - `apps/mobile/scripts/check-offline.mjs`
  - `apps/mobile/android/app/src/main/AndroidManifest.xml`
  - `apps/mobile/android/app/build.gradle`, `apps/mobile/android/variables.gradle`
  - `apps/mobile/android/app/src/main/res/xml/file_paths.xml`
  - Kotlin under `apps/mobile/android/app/src/main/java/com/martianmacros/martian_macros/demo/`: `MmDbPlugin.kt`, `MmHealthPlugin.kt`, `MmPacksPlugin.kt`, `MmScannerPlugin.kt`, `ScanActivity.kt`
  - Requirements: MM-95, MM-57, MM-56, MM-62, MM-68, MM-13
- **Inspected in part:**
  - `docs/architecture.md` lines 130-189
  - `MmRemindersPlugin.kt` lines 1-60
  - MM-58 lines 1-12
  - `config/*.json` by grep only
- **Not inspected:**
  - `ReminderReceiver.kt`, `ReminderBootReceiver.kt`, the `Reminders` object
  - `apps/mobile/android/build.gradle`, `capacitor.build.gradle`, `proguard-rules.pro`
  - `PackDownload.ts`, `NativePackHttp.ts`, `openAppServices.ts`, `AppState.ts`
  - Onboarding screens and their health-screening text
  - `docs/non-goals.md`; `requirements/HANDOFF.md` beyond one grep hit
  - MM-63, MM-64, MM-65, MM-11
  - `node_modules`, the lock file, the resolved Gradle dependency graph and merged manifest
  - All tests; the published food-data repository; the built APK
- **Absent implementation:** no terms screen, privacy notice, acceptance record, open-source notices screen or data-sources screen exists in the searched scope.
- **Evidence method:** source inspection and external document retrieval only. No runtime reproduction, no network capture, no tests run.
- **Referrals:**
  - **safety:** the "not a medical device" and "consult a professional" wording (S-2 below).
  - **react-capacitor:** where the gate goes, the schema bump, a possible CSP, the rationale screen.
  - **qa:** the network-monitor run and erase behavior.
  - **integrations:** ML Kit telemetry, GitHub redirect hosts.
  - **product-designer:** the guard-screen layout.

## Findings

### PS-1 — "Nothing is uploaded" is not supported while ML Kit is bundled
- **Class:** evidence-supported domain concern. **Severity:** high (a blocker for any absolute claim in the terms). **Confidence:** medium. Google's disclosure is explicit, but I observed no traffic.
- **Observed:**
  - The app bundles `com.google.mlkit:barcode-scanning:17.3.0` and `com.google.mlkit:text-recognition:16.0.1` (`build.gradle:46-47`).
  - It tells the user "Nothing is uploaded." (`SettingsScreen.tsx:196`) and "The only thing this app ever fetches." (`SettingsScreen.tsx:189`).
  - The same claim appears in code comments: `AndroidManifest.xml:74-75`, `MmPacksPlugin.kt:24`, `MmScannerPlugin.kt:25-26`.
  - `check-offline.mjs:18-28` inspects only built HTML and CSS, so it cannot see native SDK traffic.
- **External evidence:** Google's ML Kit data disclosure says that, "in all features", the SDK collects device information, application information, per-installation identifiers, performance metrics, API configuration, input/output size, event type and error codes, "used for diagnostics and usage analytics", sent over HTTPS.
  - The page lists no image content.
  - It does not name text recognition specifically.
  - It does not say the collection can be turned off.
- **Impact:**
  - Camera frames and health data are not indicated as leaving the device.
  - An absolute "nothing leaves this phone" in a legal document would be a false statement about data practices (FTC deception exposure, Play User Data policy).
  - Play's Data safety guidance counts SDK transmissions as the app's "collection", so the Data safety form may not be able to say "no data collected".
- **Remediation:** the owner chooses one before the terms are final.
  - **(a)** Run MM-95's "checked by observation" scenario: a release build, network monitor attached, scanning both a barcode and a label. Record what is seen.
  - **(b)** Replace or remove the telemetry-bearing libraries.
  - **(c)** Keep them and disclose: "The barcode and label reader is a Google component that sends Google technical diagnostics about itself (device model, app version, performance and error codes). It does not send your photos, what you scan, or anything from your records."
- **Proposed acceptance criterion:** the terms and policy list every destination seen in the monitored run and none that was not seen.
- **Verification status:** not reproduced. Needs the edit owner or QA.

### PS-2 — No privacy policy exists; the platform requires one separately from an EULA
- **Class:** documentation or requirement gap (MM-95 is `proposed`). **Severity:** high for release. **Confidence:** high.
- **Observed:**
  - No policy text or screen exists.
  - The Health Connect rationale intents open `MainActivity` (`AndroidManifest.xml:25-43`). MM-68 acknowledges this (lines 86-87).
- **Expected, per sources (see Research):**
  - Play requires a privacy policy link in Play Console and a link or text in the app, for all apps.
  - The Health Connect rationale activity should display that same policy.
- **Remediation:** MM-242 depends on MM-95, or MM-242 delivers a privacy notice alongside the agreement.
  - The guard screen links both documents.
  - The same notice is reachable from Settings and from the Health Connect rationale intent.
  - One hosted public URL (non-PDF, non-geofenced) carries the same text.

### PS-3 — The terms must not claim encryption the app does not perform
- **Class:** evidence-supported domain concern. **Severity:** medium. **Confidence:** high on the code, low on how Google applies its policy.
- **Observed:**
  - The database is plain SQLite (`MmDbPlugin.kt:39,57`).
  - Protection comes only from Android's app sandbox and whatever device encryption the phone has.
  - "Encrypted backup is coming" (`SettingsScreen.tsx:196`) is a forward-looking promise.
- **External evidence:** Google's Health Connect policy page requires security measures including, "at minimum, data encryption both at rest and in transit".
- **Inference:** whether device-level file encryption satisfies that sentence is not stated by the source. This is for the attorney and the Play review.
- **Remediation:**
  - The terms describe protection truthfully (see wording item 9 below).
  - The terms do not mention a future backup at all.
  - Consider removing "Encrypted backup is coming" from Settings until MM-63 ships. That is an owner decision.

### PS-4 — "Erase" wording must match what erase does
- **Class:** documentation or requirement gap. **Severity:** medium. **Confidence:** high for the first three points below, low for the reminder point.
- **Observed:**
  - Rows are deleted; the file is not overwritten (`SqlDataEraser.ts:16-20`; MM-62 line 36).
  - Downloaded food packs stay. They are not personal data.
  - Health Connect permissions stay granted.
  - The confirmation names only "profile, food log, weigh-ins, and targets" (`SettingsScreen.tsx:51-53`). Workouts, health-screening answers, imported readings, custom foods and check-ins also go.
  - **Unverified hypothesis:** the reminder schedule kept in app preferences outside the database (`MmRemindersPlugin.kt:26-28`) may survive an erase. I did not trace it; referral to react-capacitor and QA.
- **Remediation:** the terms say "deletes your records from the app" and never "securely" or "irrecoverably wiped". They also say that uninstalling the app removes the files.

### PS-5 — "Stays on this device" has a device-transfer caveat
- **Class:** evidence-supported domain concern. **Severity:** medium. **Confidence:** medium.
- **Observed:** `allowBackup="false"` with no `dataExtractionRules` (`AndroidManifest.xml:5`); target SDK 36.
- **External evidence:** Android's Auto Backup page says that for apps targeting API 31 and above, on some manufacturers' devices `allowBackup="false"` disables cloud backup "but doesn't disable device-to-device transfers".
- **Impact, both ways:**
  - The terms should not promise that data can never be copied off the phone by the phone's own transfer tool.
  - The terms should not promise that data will move to a new phone either.
- **Remediation:** an owner decision on whether to add a `dataExtractionRules` file, then wording to match. Verify on a device.

### PS-6 — "The photo is deleted" is not unconditional
- **Class:** unverified hypothesis requiring investigation (by inspection). **Severity:** low. **Confidence:** medium.
- **Observed:**
  - `MmScannerPlugin.kt:94` returns when `call == null`, before any `file.delete()`. If Android recreates the app during capture, `label.jpg` can remain in the app cache until the next capture.
  - The photo is taken by the phone's own camera app (`ACTION_IMAGE_CAPTURE`, line 88). That app is outside this app's control.
  - `file_paths.xml:3` exposes all of external storage to the FileProvider. That is broader than the one cache file needs, though the provider is not exported.
- **Remediation:** wording "deleted as soon as it has been read". Route a bug ticket and regression test for the null-call path if the owner or QA confirms it.

### PS-7 — The download discloses slightly more than "an IP address and nothing else"
- **Class:** evidence-supported domain concern. **Severity:** low. **Confidence:** medium (inference, not captured).
- **Observed:**
  - The UI says the manifest fetch "reveals your IP address and nothing else" (`FoodDatabaseScreen.tsx:78`).
  - The pack card says the host learns the IP "and which file you asked for" (`AvailablePackCard.tsx:28-29`).
  - The request follows redirects (`MmPacksPlugin.kt:244`). No User-Agent is set, so the platform default is sent.
- **Inference from general knowledge, not retrieved or captured:**
  - Android's default User-Agent normally includes the Android version and device model.
  - GitHub release downloads redirect to a second GitHub-operated host.
- **Remediation:**
  - Name the operator ("GitHub, a Microsoft company") rather than only a hostname.
  - Say the request reveals "your IP address, the file requested, the time, and basic technical details your phone sends with any download (such as its model and Android version)".
  - Verify in the PS-1 monitored run.

### PS-8 — The offline boundary is a convention, not an enforced control
- **Class:** design improvement. **Severity:** low. **Confidence:** high.
- **Observed:** `index.html:3-8` has no Content-Security-Policy, and `httpGet` accepts any URL from the web layer (`MmPacksPlugin.kt:236-243`).
- **Impact:** the terms' accuracy over time depends on review discipline (the MM-95 "new library" scenario).
- **Remediation:** referral to react-capacitor on a `connect-src` restriction.

### PS-9 — The release identity is not settled
- **Class:** documentation or requirement gap. **Severity:** medium for drafting. **Confidence:** high.
- **Observed:** the app ID and name are the demo ones (`capacitor.config.ts:6-7`).
- **Impact:** an agreement needs the licensor's legal name, a contact address and the product name as shipped. Play's policy also requires a privacy point of contact.

## Remit 1 — What the agreement and privacy notice must say

Each item gives recommended plain wording and what the code supports today. Put the data statements in the privacy notice; have the agreement incorporate it by reference and repeat only the loss and security disclaimers.

**1. What is stored and where.**
- *Wording:* "Everything you enter (your profile, date of birth, health-screening answers, weigh-ins, measurements, food log, workouts and check-ins) and anything you let the app read from Health Connect is kept in a database inside this app on this phone."
- *Support:* yes (`schema.ts:42-268`, `MmDbPlugin.kt:49`).

**2. No account, no server.**
- *Wording:* "There is no account. We run no server that receives your records, so we cannot see, recover, correct or delete them for you."
- *Support:* yes for the app's own code (`package.json:17-28`, the grep results above).

**3. Nothing is uploaded.**
- *Wording (only after PS-1 is resolved):* "The app does not send your records anywhere."
- *Support:* **not as an absolute.** The records claim is supported by source. "The app sends nothing at all" is not, because of ML Kit telemetry (PS-1). Use option (c) from PS-1 unless the monitored run shows otherwise.

**4. The one download.**
- *Wording:* "If you choose to download the food database, your phone contacts GitHub to fetch a file. GitHub sees your IP address, which file was requested, when, and basic technical details your phone sends with any download. Nothing about you or your records is sent. Nothing is downloaded unless you tap Download."
- *Support:* user-initiated only, yes (`FoodDatabaseScreen.tsx:72-76`, `AvailablePackCard.tsx:31`); host, yes (`config/prod.json:3`); "nothing else" needs the PS-7 correction. GitHub's own privacy statement governs what it does with the request; link it.

**5. Health Connect.**
- *Wording:* "Health Connect is optional. If you allow it, the app reads only the kinds you allow: weight, body fat, lean body mass, height, exercise sessions, menstruation and steps. It never writes to Health Connect. What it reads is copied into the app's database on this phone and stays there until you erase it, even if you later take the permission away."
- *Support:* yes (`MmHealthPlugin.kt:43-51`, `AndroidManifest.xml:87-93`, `HealthConnectSection.tsx:105-108`).
- *Caveat:* what was read is used only on the device for the features described. That matches Google's limited-use terms, provided nothing else changes.

**6. Camera.**
- *Wording:* "The camera is used only when you scan a barcode or photograph a nutrition label. Barcodes are read on the phone. A label photo is taken with your phone's camera app, read on the phone, and deleted as soon as it has been read. No picture is kept or sent."
- *Support:* yes, with the PS-6 caveat and the PS-1 telemetry sentence.

**7. Notifications.**
- *Wording:* "Reminders you turn on are scheduled by the phone itself. No message service is involved."
- *Support:* yes (`MmRemindersPlugin.kt:23-29`).

**8. No backup, and loss of data.**
- *Wording:* "The app makes no backup. If you lose, break, reset or replace the phone, uninstall the app, or erase its data, your records are gone and we cannot restore them. You accept that risk. We do not promise that your records will be preserved."
- *Support:* yes (no backup code; `AndroidManifest.xml:5`), with the PS-5 caveat. Do not mention a coming backup.

**9. Device security.**
- *Wording:* "Your records are as private as your phone. The app does not add its own password or encryption. Anyone who can unlock your phone can open the app. Keep a screen lock on and keep the phone up to date. A phone that has been rooted or infected may expose the data."
- *Support:* yes (`MmDbPlugin.kt:39,57`; no app lock found in the inspected scope).

**10. Erasing.**
- *Wording:* "Settings → Erase all data deletes every record in the app and returns it to first use. Uninstalling the app also removes them. Erasing does not remove the food database you downloaded and does not change permissions you granted; you can withdraw those in the phone's settings."
- *Support:* yes (`SqlDataEraser.ts:16-20`), with the PS-4 caveats.

**11. Adults, United States.**
- *Wording:* "The app is for people aged 18 or over in the United States. We rely on the date of birth you enter."
- *Support:* age yes (MM-13); US not enforced in code.

**12. Changes.**
- *Wording:* "If these terms change in a way that matters, the app will show them again and ask you to accept before you continue."
- *Support:* not built. It requires the versioned record under Remit 3.

**Statements the documents must not make today:**
- "encrypted"
- "securely deleted"
- "backed up" or "backup is coming"
- "we never collect anything" as an absolute
- "your data can never leave the device"
- Any HIPAA claim
- Any reference to the Open Food Facts live lookup

## Remit 2 — Is a separate privacy policy required?

**Research status: performed** (see Research for surface and limits). What the sources say is separated from my inference.

### Google Play, User Data policy
- **Source says:**
  - "All apps must post a privacy policy link in the designated field within Play Console" and "a privacy policy link or text within the app itself."
  - "Apps that do not access any personal and sensitive user data must still submit a privacy policy."
  - The policy must include developer information and a privacy point of contact, the data accessed, collected, used and shared, and the retention and deletion policy.
  - Personal and sensitive data includes health data, Health Connect data and camera.
  - A prominent disclosure, where required, must be in-app, shown in normal use, and "cannot only be placed in a privacy policy or terms of service".
  - The page does not mention EULAs.
- **Inference:**
  - Yes, a privacy policy separate from the EULA is required.
  - An EULA is not a Play requirement; it is the owner's choice.
  - The EULA guard does not replace point-of-use permission disclosure. Do not fold Health Connect or camera consent into the "I agree" button. The per-type purpose lines in `HealthConnectSection.tsx:83` already do that job.

### Google Play, Data safety
- **Source says:**
  - "Collection" means "transmitting data from your app off a user's device", including by "libraries and/or SDKs used in your app".
  - Data processed only on the device is out of scope.
  - Every developer completes the form and provides a privacy policy link even if nothing is collected.
- **Inference:** the app's own data is "not collected", but ML Kit's telemetry may have to be declared (PS-1).

### Google Play, Health Connect policy
- **Source says:**
  - "Maintain a comprehensive and accurate privacy policy, easily accessible from your app and Play Store listing."
  - Request the minimum data types, with a justification for each permission at submission.
  - No ads use, sale or transfer of health data.
  - Security "at minimum, data encryption both at rest and in transit".
  - Reproductive-health types get heightened scrutiny.
- **Android developer documentation says:** the manifest needs an activity "that displays your app's privacy policy", and it "must display the same privacy policy you provide for your app in the Google Play Console".
- **Inference:** `READ_MENSTRUATION` will need a specific justification. The rationale intent must open the notice, not the home screen (PS-2).

### Google Play, Health Content and Services
- **Source says:**
  - Complete the Health apps declaration form.
  - The privacy policy must be on a "publicly accessible and non-geofenced URL (no PDFs)" and non-editable.
  - Apps that are not regulated medical devices must carry the disclaimer "not a medical device and does not diagnose, treat, cure, or prevent any medical condition".
  - Apps must remind users to "consult a healthcare professional for medical advice, diagnosis, or treatment".
- **Inference:**
  - A hosted web page is needed even though the app is offline. In-app text alone does not satisfy the Play Console field.
  - The disclaimer belongs on the guard screen (referral to safety).

### FTC Health Breach Notification Rule (16 CFR 318, 2024 amendments)
- **Source says:**
  - A personal health record is an electronic record of identifiable health information "that has the technical capacity to draw information from multiple sources" and is "managed, shared, and controlled by or primarily for the individual".
  - A vendor is an entity "that offers or maintains a personal health record".
  - "Health care services or supplies" includes a mobile application that tracks fitness, diet, bodily functions and similar.
  - A breach is "acquisition of such information without the authorization of the individual". FTC guidance says this includes "a company's disclosure of covered information without a person's authorization".
  - FTC guidance says a fitness app that can sync with a tracker is "probably a vendor of personal health records".
  - Neither retrieved page addresses data stored only on the user's device.
- **Inference:**
  - The app plausibly falls within the definition of a product covered by the rule: user input plus Health Connect is "multiple sources", and the word is "offers", not only "maintains".
  - A reportable breach by the developer is hard to construct while the developer holds and discloses no records. The duties attach to a breach, not to publishing a policy.
  - That changes the day any record leaves the device, for example through cloud backup providers or crash reports.
  - Whether loss or theft of a user's own phone could ever be a "breach" attributable to the developer is a question for counsel.
  - This is not settled by any source I retrieved.

### Washington My Health My Data Act (RCW 19.373)
- **Source says:**
  - "Collect" means "to buy, rent, access, retain, receive, acquire, infer, derive, or otherwise process consumer health data".
  - A regulated entity conducts business in or targets Washington consumers and "determines the purpose and means of collecting, processing, sharing, or selling".
  - Consumer health data is personal information "linked or reasonably linkable to a consumer" that identifies health status.
  - A regulated entity or small business must publish a consumer health data privacy policy, with a link on its homepage.
  - The Attorney General's FAQ says that link must be "separate and distinct" and the policy "may not contain additional information not required" by the Act.
  - Violations are per se Consumer Protection Act violations, "enforced by the Attorney General as well as through private action".
  - The FAQ does not address on-device-only processing.
- **Inference:**
  - Applicability is genuinely uncertain.
  - Against: the developer never accesses, receives or retains anything, and nothing is linkable to a person by the developer.
  - For: the definition includes "infer, derive, or otherwise process", and the developer's software does that by the developer's design.
  - The data kinds here are squarely health data: weight, reproductive and menstruation data, eating-disorder history, medication.
  - Because of the private right of action, this is the item I would least want decided without a lawyer.
  - If counsel says it applies, a second, separately linked "Consumer Health Data Privacy Policy" is needed. An app that cannot tell Washington residents apart must treat everyone that way.

### Nevada SB 370 (NRS 603A.400–.550)
- **Source says:**
  - Near-identical definitions of "collect" and "regulated entity".
  - A "consumer" is a natural person "who has requested a product or service from a regulated entity".
  - A privacy policy is required under NRS 603A.495, posted on the main website or otherwise provided.
  - Violations are deceptive trade practices; the sections "do not create a private right of action".
  - The retrieved page did not name the enacting bill; the chair's "SB 370" label is unconfirmed by this source.
- **Inference:** same uncertainty as Washington, with lower exposure.

### Conclusion for this remit
- A separate privacy policy is **required by the platform**, whatever the state-law answers.
- Whether a further consumer-health-data policy is required is **an attorney question**.
- Draft the privacy notice so each statement maps to a category those statutes ask for (what, why, sources, sharing: none, how to delete). Counsel can then split it if needed.

## Remit 3 — Record of acceptance

**Recommendation (a proposal, not existing behavior):**

- **Minimum stored:** the terms version identifier accepted, and the acceptance timestamp in UTC. Nothing else: no name, no device identifier, no IP address, no signature.
- **If privacy notice and agreement are versioned separately:** store both versions.
- **Where:** the local SQLite database only (a new column or table, a schema version bump and a migration, per AGENTS.md). Never transmitted. The developer therefore holds no proof of acceptance.
  - Counsel must be told this plainly. It is the price of the offline design and affects how much the developer can rely on the agreement.
  - Do not add a network call to "register" acceptance.
- **Gate position:** before onboarding collects any health data, ahead of `OnboardingScreen` at `AppRoot.tsx:54`.
  - Before or after the theme chooser is a design question.
  - The database is already open at that point (`AppRoot.tsx:27`), so storing there is feasible.
- **Erase all data: remove the record.**
  - MM-62 says "every row in every table", and the erase confirmation says "everything".
  - A record that silently survives would contradict the erase promise.
  - Erase returns to first use, where a new person may be holding the phone.
  - Consequence: the guard shows again after erase. If the record lives in a table listed in `schema.ts:15-37`, `SqlDataEraser` does this with no extra code.
- **Re-prompt:** when the bundled terms version is newer than the stored one, show the guard again before the home shell. Existing data is untouched until the person accepts.
- **Declining:** the app does nothing further and stores nothing. No record of a refusal.
- **Proposed acceptance criteria:**
  1. First launch shows the terms before any profile field.
  2. Nothing is written to the database before acceptance other than what already is (theme).
  3. Accepting stores exactly version and time.
  4. Erase removes it and the guard returns.
  5. A newer bundled version re-prompts.
  6. The full text is readable offline and reachable later from Settings.
  7. No network request is made by the guard.
  8. The screen has a Storybook story (AGENTS.md).
- **Edge cases:**
  - Clock set wrong: store the time as given, do not validate.
  - Process killed mid-accept: no record means ask again.
  - App update with existing data and no record: ask.
  - Health Connect rationale intent arriving before acceptance: show the privacy notice, not the app.

## Remit 4 — Third-party terms to pass through or acknowledge

### Food data (MM-57, still `proposed` and unreviewed)
- The current credit is one paragraph at `FoodDatabaseScreen.tsx:108-112`.
- The data-sources screen with licence links that MM-57 asks for is not built (MM-57 line 48).
- The agreement should:
  - Name Open Food Facts (Open Database License; contents under the Database Contents License) and USDA FoodData Central.
  - State that the food database is licensed to the user under ODbL, not under the app's own licence. The agreement must not restrict rights the ODbL grants.
  - Say the data comes from volunteers and public sources, may be wrong, and carries no warranty.
- Do not restate licence conclusions as settled. MM-57 line 49 lists them as open.

### Open-source components
The licences below are from my general knowledge. They are **not verified** against the lock file or the Gradle graph.

- **Web layer, believed MIT:** React, React DOM, MUI, Emotion, Capacitor.
- **Web layer, believed Apache-2.0:** `@sqlite.org/sqlite-wasm`.
- **Native, believed Apache-2.0:** AndroidX (appcompat, camera, health-connect client, sqlite-bundled, lifecycle), kotlinx-coroutines.
- **Fonts and icons:** not checked.

Both licence families require reproducing notices. The app has no notices screen in the searched scope. The agreement should say these components are under their own licences, which prevail for those components, and point to an in-app notices list. That list must be generated from the real dependency tree by the edit owner.

### Other third-party terms
- **Google ML Kit:** it is not open source. It is used under Google's ML Kit and Google APIs terms, which typically carry their own requirements on what the app tells its users. Counsel should read them.
- **Health Connect:** Google's Health Connect policy (limited use).
- **Google Play:** Play's terms govern distribution. If the app is ever sold, Play's own end-user terms interact with a custom EULA.
- **GitHub:** GitHub's terms and privacy statement apply to the download request.

## Remit 5 — What a licensed attorney must review before release

1. The whole agreement: enforceability of a click-through with no developer-held acceptance record; governing law and venue; arbitration or class waiver if wanted; severability; termination.
2. Warranty disclaimer and limitation of liability for a health and nutrition app, including data loss, and state limits on such disclaimers. This includes the interaction with consumer-protection law when the app serves people who disclose pregnancy, eating-disorder history, kidney disease or insulin use.
3. Health disclaimers ("not a medical device", "not medical advice") and whether any feature creates FDA software-as-a-medical-device or state professional-practice exposure. Referral to the safety role for content; to counsel for the legal effect.
4. FTC Health Breach Notification Rule: whether the developer is a "vendor of personal health records" while holding no data, and what changes when backup or any export ships.
5. Washington My Health My Data Act and Nevada NRS 603A.400–.550: applicability to on-device-only processing; whether a separate consumer health data privacy policy and consent flow are required; other states with similar laws that I did not research (for example Connecticut's consumer-health provisions and state comprehensive privacy laws treating health data as sensitive).
6. The privacy policy text against FTC Act section 5: every factual statement, especially "nothing is uploaded", the ML Kit telemetry carve-out, erase wording and the absence of encryption.
7. Google Play compliance: User Data, Data safety, Health Connect and Health Content and Services declarations, including whether device-level encryption satisfies "encryption at rest".
8. Age: an adults-only statement with a self-declared birth date; COPPA exposure if a child uses it anyway; menstruation and reproductive data handling.
9. MM-57 in full: ODbL share-alike and attribution form; the Database Contents License; whether the app is a "produced work"; the Hugging Face AGPL tag; USDA public-domain status; and that the EULA does not conflict with ODbL.
10. Open-source notice compliance, and Google's ML Kit, Google APIs, Health Connect and Play terms for clauses that must be passed to end users.
11. The licensor's legal identity, contact address, and whether an entity should exist before publishing; trade-name use of "Martian Macros".
12. The change-of-terms mechanism and whether re-acceptance on an update is sufficient.
13. Accessibility and plain-language adequacy of the guard screen as a matter of contract formation (conspicuousness, scroll-to-accept or not).

## Research

- **Status:** performed.
- **Trigger:** the chair's explicit request, and current platform policy and legal applicability not answered by repository evidence.
- **Execution surface:** this subagent's own WebSearch (discovery, one query) and WebFetch (retrieval), used directly. Only public, generalized queries; no repository code or data was sent.
- **Limits:**
  - WebFetch returns a small model's extraction of each page, not the raw text. The quotes above are as that tool returned them and should be re-read at the source before anyone relies on them.
  - eCFR was not retrievable (redirected to an unblock page). I used Cornell LII for 16 CFR 318.2; it did not show the amendment citation.
  - The Washington statute page was read to 100,000 of 117,709 characters.
  - Not researched: other states' laws, GitHub's privacy statement, ML Kit and Google APIs terms, the ODbL text, the 2024 HBNR Federal Register preamble, COPPA.
  - No part was fully blocked, so I do not report `PANEL_RESEARCH_BLOCKED`. The eCFR primary text is a **partial block**; the chair may wish to retrieve it.

### Sources consulted (accessed 2026-10-12)

| URL | Title | Date on page | Supports |
|---|---|---|---|
| https://support.google.com/googleplay/android-developer/answer/10144311?hl=en | Google Play — User Data | none (©2026) | Privacy policy required for all apps, in Console and in-app; contents; prominent disclosure rules; health, Health Connect and camera as sensitive data |
| https://support.google.com/googleplay/android-developer/answer/10787469?hl=en | Google Play — Data safety form guidance | none | "Collection" means off-device transmission, including by SDKs; on-device data out of scope; form and policy mandatory |
| https://support.google.com/googleplay/android-developer/answer/12991134?hl=en | Google Play — Health Connect / health permissions policy | none (©2026) | Privacy policy accessible from app and listing; minimum scope; per-permission justification; limited use; encryption at rest and in transit |
| https://support.google.com/googleplay/android-developer/answer/16555673 | Google Play — Health Content and Services | none (©2026) | Health apps declaration; public non-geofenced non-PDF policy URL; "not a medical device" disclaimer; consult-a-professional reminder |
| https://developer.android.com/health-and-fitness/guides/health-connect/develop/get-started | Android — Get started with Health Connect | 2026-09-08 | Rationale activity must display the same privacy policy as in Play Console |
| https://developers.google.com/ml-kit/android-data-disclosure | ML Kit — Android data disclosure | updated 2026-07-15; modified 2025-05-14 | ML Kit collects device and app info, per-installation identifiers, metrics and configuration for diagnostics and analytics, over HTTPS |
| https://developer.android.com/identity/data/autobackup | Android — Auto Backup | 2026-02-26 | `allowBackup="false"` may not disable device-to-device transfer for apps targeting API 31+ |
| https://www.law.cornell.edu/cfr/text/16/318.2 | 16 CFR 318.2 Definitions (LII) | not shown | PHR, vendor, breach, health care services or supplies definitions |
| https://www.ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0 | FTC — Complying with the Health Breach Notification Rule | refers to July 2024 amendments; January 2025 edit | Fitness and diet app examples; a breach includes unauthorized disclosure; silent on on-device-only storage |
| https://app.leg.wa.gov/RCW/default.aspx?cite=19.373&full=true | RCW 19.373 (My Health My Data Act) | not shown | Definitions of collect, regulated entity, consumer health data; privacy policy; consent |
| https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy | Washington AG — MHMDA FAQ | not shown | Separate and distinct link; private action through the CPA; silent on on-device |
| https://www.leg.state.nv.us/NRS/NRS-603A.html | NRS 603A | not shown | Definitions; policy at 603A.495; no private right of action (603A.550) |

- **Discovery only:** one WebSearch query. It surfaced the 12991134 and 16555673 URLs; nothing from its summary is relied on.
- **Attempted, not retrieved:** https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-318 (redirect).
- **Conflicting or missing evidence:**
  - No source addresses on-device-only apps under the HBNR or the state laws.
  - Google's policy pages carry no effective dates.
- **Freshness:** re-validate all Play pages at submission time. Re-validate everything if backup, the live lookup, analytics or a new SDK is added.

## Confidence and limitations

- **High:** what the app's own code stores, reads and requests.
- **Medium:** the ML Kit telemetry concern (documented by Google, not observed here) and the User-Agent and redirect details (general knowledge, not captured).
- **Low:** every statement about how a statute applies. Those are a non-lawyer's reading of tool-extracted text.
- No runtime, no APK, no merged manifest; transitive SDK permissions or network components are unknown.
- Independence: this report was written without seeing other reviewers' findings.

## Dependencies

- **MM-95** (privacy policy and store declarations): MM-242 should depend on it or absorb the notice.
- **MM-57** (licensing review): the third-party clause cannot be final before it.
- **MM-62:** erase wording.
- **MM-63, MM-64:** if backup ships, the terms, policy and HBNR analysis all change.
- **MM-68:** the rationale screen.
- **Roles that should challenge:**
  - **safety:** health disclaimers; whether a terms wall weakens safety messages.
  - **react-capacitor:** schema, gate placement, CSP, the notices list.
  - **integrations:** ML Kit, GitHub.
  - **qa:** the monitored run, erase tests.
  - **product-designer:** the guard screen and its story.

## Safety concerns

- **S-1:** a click-through that overstates privacy is itself a harm for people who entered eating-disorder history, pregnancy or medication data on the strength of it.
- **S-2:** the Play-required "not a medical device" and "consult a healthcare professional" statements must not be the only place safety information lives, and must not be worded to disclaim the app's own screening safeguards. Referral to safety.
- **S-3:** on a shared or unlocked phone, the app exposes sensitive answers with no app lock. The terms should say so rather than imply protection.
- "None found" elsewhere is not a clearance of any kind.

## Unresolved product decisions (authority: product owner, with counsel where noted)

1. **ML Kit telemetry.** Verify and disclose, replace, or accept and reword "Nothing is uploaded". This blocks the final wording.
2. **Privacy notice scope.** Does MM-242 include the notice and its hosted URL, or wait on MM-95? A public web page is required by Play even for an offline app.
3. **Settings backup line.** Keep or remove "Encrypted backup is coming" until it exists.
4. **Device-to-device transfer.** Add a `dataExtractionRules` file to block it, or disclose it.
5. **Acceptance record on erase.** Confirm it is erased (my recommendation) rather than preserved.
6. **Licensor identity.** Legal name and contact address, and the release app name and ID (PS-9).
7. **Engaging an attorney,** and whether release waits for that review (my recommendation: yes for items 2, 4, 5, 6 and 9 of Remit 5).
8. **Consumer-health-data policy.** A second document only if counsel says Washington or Nevada applies.

## Verification

- **Tests inspected or run:** none. Read-only role; no commands executed.
- **Requested of the edit owner or QA (recommendations, not executions):**
  1. A release build under a network monitor through first run, a barcode scan, a label read, a manifest check and a pack download. Record every host and the request headers.
  2. A merged-manifest and dependency report, for permissions or services added by ML Kit and CameraX.
  3. Confirm whether erase clears the reminder store and scheduled alarms.
  4. Confirm the `call == null` path in `MmScannerPlugin.photographed` leaves `label.jpg` behind.
  5. A device-to-device transfer test on at least one phone.
  6. A generated third-party licence list from `package-lock.json` and Gradle.
  7. SHA-256 of the inputs listed under Audit coverage.

---

_Added by the chair when saving. The reviewer wrote everything above; the sections below are the shared template's headings that the report did not use by name._

## Novice mobile experience (when UX/product design is assigned)
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Sources and evidence
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Acceptance criteria and edge cases
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Unresolved product decisions
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".

## Targeted challenges
Not returned under this heading. See the report above, where the reviewer covered it under its own headings, or read it as "none".
