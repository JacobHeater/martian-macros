# Findings: product (Product & requirements) — MM-242, EULA as an early app guard

## Scope and traceability

- **Role:** product (`agents/roles/product.md`), a review lens, not a legal or clinical credential. Nobody on the panel is a lawyer; nothing here is legal advice.
- **Reviewer/session:** Claude (claude-opus-5-5), read-only subagent of the chair, 2026-10-12.
- **Branch / commit:** `feature/mm237-storybook-material` at `40c8d1b` (as given by the chair; I cannot run git).
- **Input SHA-256 hashes:** not computed. I have no shell; the chair must hash the inputs when saving.
- **Requirement IDs inspected:** MM-9, MM-11, MM-13, MM-29, MM-62, MM-80, MM-87, MM-89, MM-94, MM-95, MM-96, MM-112, MM-165, MM-184. MM-242 does not exist yet (`requirements/HANDOFF.md:45` names it as the next ID).
- **Config read first:** `AGENTS.md`, `agents/roles/product.md`, `agents/panel-protocol.md`, `agents/review-contract.md`. All present.

## Existing facts versus proposals

### Repository facts (source inspection only)

1. **No EULA, terms or licence acceptance exists anywhere.** A case-insensitive search of the repository for `EULA`, "end user licen", "terms of use/service", "licence agreement" and "disclaimer" matched only MM-51, MM-57 (food-data licences) and MM-96.
2. **Guard order** in `apps/mobile/src/app/AppRoot.tsx`:
   - setup loading/failure (27-38) and theme loading/failure with a retry (39-51);
   - theme chooser when there is no setup and the theme is `unselected` (53);
   - onboarding when there is no setup (54);
   - adults-only when the policy is blocked (55-56);
   - resume, then welcome back (57-58);
   - health re-check (59-61);
   - home shell (62).
3. **Preferences live in one row** of `user_preferences` (`apps/mobile/src/data/SqlPreferencesRepository.ts:24-30`). The interface says it "exists before onboarding" and is "not health data" (`apps/mobile/src/domain/repositories/PreferencesRepository.ts:14-17`).
4. **"Erase all data" empties every table, including `user_preferences`** (`apps/mobile/src/data/SqlDataEraser.ts:16-20`; `apps/mobile/src/data/schema.ts:15-37`). The eraser contract expects the theme to be `unselected` afterwards (`apps/mobile/test/contracts/dataEraserContract.ts:93`). So after an erase the app shows the theme chooser, then onboarding.
5. **The app has never been released.** `schema.ts:2-6` says so and `currentSchemaVersion` is 1 (`schema.ts:12`). "Existing installations" today are developer, demo and emulator installs only.
6. **"Not medical advice" appears in one place in the app:** `apps/mobile/src/onboarding/HealthStep.tsx:79`. It is not in `SettingsScreen.tsx`; the About group (174-183) holds only "How this works". There is no legal or terms row.
7. **A new screen without a story fails the tests** (`AGENTS.md:53-58`; `apps/mobile/test/gallery/stories.test.tsx:58-66`). First-run stories are in `apps/mobile/src/gallery/screens/FirstRun.stories.tsx`.

### Approved requirements that bear on this

- **MM-184 (done), "First launch"** (lines 28-35): the chooser is shown "before onboarding", and on Continue "the selected theme is saved and onboarding opens".
- **MM-184 (done), "Existing installation"** (37-42): existing installations never see the chooser.
- **MM-62 (done), "Confirming"** (23-26): after an erase "onboarding is shown".
- **MM-165 (done), "Erase"** (35-38): after an erase "the preference is System".
- **MM-96 (proposed), "The disclaimer is findable"** (33-34): "not medical advice" appears in onboarding, in Settings and in the store listing.
- **MM-13 (done), Notes** (39): age is self-declared, with no verification planned.
- **MM-94 (proposed)** (17-24, 32-33): lists the gates before submission. No legal terms gate is among them, and a "support contact" is noted as unticketed.
- **MM-95 (proposed)**: the privacy policy must match what the app does.
- **MM-87 (proposed)** (24-25): the purchase survives an erase because it belongs to the store account.
- **`docs/non-goals.md:159-165`**: no diagnosis or medication advice. No non-goal mentions legal terms.

### Proposals

Everything under "Proposed scope", "Guard order" and "Proposed acceptance criteria" below is my recommendation. None of it is approved behavior.

## Audit coverage

- **Audit mode:** change (planning), with a targeted audit of the existing guard, preference, erase and disclaimer behavior.
- **Absent implementation:** no terms screen, acceptance record, terms text or Settings row exists (search scope in fact 1).
- **Method:** source inspection only. Nothing was run, rendered or reproduced.

**Inspected**
- `C:\Users\jacob\dev\martian-macros\AGENTS.md`
- `C:\Users\jacob\dev\martian-macros\agents\roles\product.md`, `agents\panel-protocol.md`, `agents\review-contract.md`
- `C:\Users\jacob\dev\martian-macros\apps\mobile\src\app\AppRoot.tsx`, `AdultsOnlyScreen.tsx`
- `C:\Users\jacob\dev\martian-macros\apps\mobile\src\domain\repositories\PreferencesRepository.ts`
- `C:\Users\jacob\dev\martian-macros\apps\mobile\src\data\SqlPreferencesRepository.ts`, `SqlDataEraser.ts`, `schema.ts` (lines 1-40 and the `user_preferences` table start)
- `C:\Users\jacob\dev\martian-macros\apps\mobile\src\settings\SettingsScreen.tsx`
- `C:\Users\jacob\dev\martian-macros\apps\mobile\src\gallery\screens\FirstRun.stories.tsx`, `newInstallScenario.ts`
- `C:\Users\jacob\dev\martian-macros\apps\mobile\test\contracts\dataEraserContract.ts` (lines 90-96) and `test\gallery\stories.test.tsx` (lines 58-66)
- `C:\Users\jacob\dev\martian-macros\requirements\README.md`, `HANDOFF.md`
- Tickets: MM-9, MM-11, MM-13, MM-29, MM-62, MM-80, MM-87, MM-89, MM-94, MM-95, MM-96, MM-112, MM-165, MM-184
- `C:\Users\jacob\dev\martian-macros\docs\non-goals.md`
- `C:\Users\jacob\dev\martian-macros\roadmap\README.md`, `ws-13-commercial-and-release-readiness.md`, `roadmap.json` (WS-03 and WS-05 headers only)

**Not inspected**
- `docs/architecture.md`, `docs/evidence.md`
- `apps/mobile/test/voice.test.ts` (the banned-word test, which may scan legal text)
- `ThemeChooserScreen.tsx`, `OnboardingScreen.tsx`, `HowThisWorksScreen.tsx`, `WelcomeBackScreen.tsx`, `HealthRecheckScreen.tsx`
- `apps/mobile/src/state/*`, `openAppServices.ts`, `fixtures/InMemoryPreferencesRepository`, `InMemoryDataEraser.ts`, `DemoSeed.ts`
- `walkOnboarding.ts`, `screenStory.tsx`, and the rest of `stories.test.tsx`
- The Android shell
- MM-90, MM-91, MM-92, MM-93, MM-158, MM-83, MM-110 and the other safeguards tickets, MM-57, MM-85, MM-86, MM-88, MM-185, MM-186
- The rest of `roadmap.json` and the other workstream files

**Cross-domain referrals**
- **research-safety / health-domain roles:** what the health terms should say (the owner's "panel guidance on legal language for health apps").
- **privacy:** the acceptance record and what an erase does to it.
- **react-capacitor:** repository shape, the schema lane, and whether the shell can exit the app.
- **ux / product-designer:** reading long legal text on a phone, the form of the accept action, enlarged text.
- **qa:** tests and the story walk.

## Novice mobile experience

Not assigned. One product note for UX: the guard adds a decision before the first-run flow that MM-9 wants finished "in under three minutes" (MM-9 line 28). Reading time for the terms should be explicitly excluded from, or included in, that target.

## Proposed scope for MM-242

**Must cover**
1. First acceptance on a new installation, by an explicit action, never pre-selected.
2. An installation that already has a setup and has never accepted: the same guard, before anything else, with no data changed.
3. A changed terms version. The text ships inside the app, so terms only change with an app update. The app stores the accepted version and asks again when the bundled version differs.
4. Declining or not accepting: nothing is recorded and no part of the app behind the guard is reachable. Exit-or-stay is an owner decision.
5. Reading the terms again from Settings (About group) at any time, with the version and effective date. Read-only, with no way to withdraw.
6. "Erase all data": state explicitly what happens to the acceptance. My recommended default: it is erased with everything else and the terms are shown again.
7. A failure to load or save the acceptance fails closed: the app is not entered and nothing claims acceptance was saved. This is the same class of defect as MM-186 for the theme.
8. Stories for the terms screen (first acceptance and changed version) and for the Settings reading view.
9. A statement that the shipped text is a draft by non-lawyers until a qualified person has reviewed it, with name and date. MM-57 line 41 and MM-29 use the same pattern.

**Must not grow into**
- Accounts, sign-in or identity.
- A server, remotely fetched or remotely updated terms, or a link that needs the network to read the terms.
- Any transmission or telemetry of acceptance.
- Age or identity verification (MM-13 line 39).
- A replacement for in-context safety text: the MM-11 health check, the cautions, and MM-96's disclaimer stay where they are.
- The privacy policy (MM-95), open-data attribution (MM-57) or purchase terms (MM-87).
- Localization or non-US terms.
- A consent-management screen with per-item toggles.
- iOS store setup (no iOS project exists).

## Guard order

**Recommendation: the terms guard is the first guard.** It runs after the loading and failure states, before the theme chooser, on every installation state. In `AppRoot.tsx` terms that is between line 51 and line 53.

Reasons:
- **It precedes all data collection.** Onboarding collects sex, date of birth, weight and health conditions; terms that govern that use should be accepted first. The theme chooser collects no health data (MM-184 line 19), so placing terms before or after it are both defensible on this point.
- **One position serves every installation.** After the chooser would mean a new installation sees the terms second and an installation with a setup sees them first: two rules, two sets of tests.
- **It precedes adults-only.** The terms carry the 18-and-over statement, and a blocked profile is still a user of the software.
- **It precedes welcome back and the health re-check.** Those act on stored data under the terms. The re-check still fires afterwards unchanged, so no safeguard is weakened or skipped.
- It matches the owner's words: "one of the first app guards".

Cost of this position: the terms are read in the default Martian theme before a theme is chosen. MM-184 says Martian meets the contrast thresholds; UX should confirm for long text.

**Alternative for the owner:** after the theme chooser and before onboarding. The user reads in their chosen theme, but it needs two positions and directly contradicts MM-184's "onboarding opens".

**Conflicts with existing acceptance criteria**

| Ticket | Criterion | Terms first | Terms after chooser |
|---|---|---|---|
| MM-184 "First launch" | chooser "before onboarding"; Continue → "onboarding opens" | Holds literally; the chooser is no longer the first thing shown. Add a note. | Contradicted; amend. |
| MM-184 "Existing installation" | never sees the chooser | Holds; add that it does see the terms. | Same. |
| MM-62 "Confirming" | after erase "onboarding is shown" | Already inexact (see P-2); terms add another screen. Amend. | Same. |
| MM-112 "Second skip requires an answer on the next launch" | re-check on next launch | No conflict; terms precede, re-check follows. | Same. |
| MM-13 | under-18 blocked | No conflict. | Same. |
| MM-9 narrative | first launch to Today in under three minutes | At risk with reading time; clarify. | Same. |

## Findings

### P-1. No ticket or gate covers legal terms
- **Domain:** product. **Class:** documentation or requirement gap. **Severity:** high for release, none for current users (unreleased). **Confidence:** high (search scope in fact 1).
- **Evidence:** MM-94 lines 17-24 list the pre-submission reviews; none is a terms review. No terms text or acceptance exists in `apps/mobile/src`.
- **Expected:** an owner-requested guard has a ticket and a release gate.
- **Remediation:** write MM-242 as scoped above; add its legal review to MM-94's list.
- **Verification:** source inspection.

### P-2. Existing erase criteria disagree with the built behavior, and MM-242 widens the gap
- **Domain:** product (refer to qa). **Class:** documentation or requirement gap; a contradiction between done tickets. **Severity:** low. **Confidence:** high.
- **Evidence:**
  - MM-165 lines 35-38 say an erase resets the theme to System.
  - `dataEraserContract.ts:93` expects `unselected`; MM-184 Progress (62-63) says "full data erasure await choice".
  - MM-62 lines 23-26 say "onboarding is shown"; `AppRoot.tsx:53` shows the theme chooser first.
- **Expected vs observed:** the tickets say System and onboarding; the code gives `unselected` and the chooser.
- **Remediation:** amend MM-62 and MM-165 in the MM-242 pull request so they describe erase → terms → chooser → onboarding. Whether this needs a BUG ticket is the chair's call; the code follows the later decision in MM-184, so I read it as stale wording, not a defect.
- **Verification:** source inspection; not run.

### P-3. MM-96's "disclaimer is findable" is unmet in Settings and overlaps MM-242
- **Domain:** product. **Class:** documentation or requirement gap. **Severity:** medium. **Confidence:** high for the absence; medium that the terms should be the fix.
- **Evidence:** MM-96 line 34; `SettingsScreen.tsx:174-183` has no such text; `HealthStep.tsx:79` is the only occurrence in the app.
- **Risk:** MM-242's Settings entry could be taken as satisfying MM-96. A disclaimer inside a legal document a user opens once is not "where a user would look" (MM-96 line 21).
- **Remediation:** link MM-242 and MM-96 both ways. State in MM-242 that the terms do not satisfy MM-96's Settings clause by themselves; the owner decides whether a plain sentence in About does.
- **Verification:** MM-96 is `proposed`, so this is not a violation.

### P-4. The terms' statements about the app can drift from the app
- **Domain:** product (refer to privacy and health roles). **Class:** documentation or requirement gap. **Severity:** medium. **Confidence:** medium.
- **Basis:** MM-95 requires its policy to match observed behavior. Terms that say "no data leaves the device", "adults only" or "not for use if pregnant" make claims the app must match. On pregnancy the app does not exclude; it holds to maintenance (MM-11 table).
- **Remediation:** an acceptance criterion that each factual statement about the app in the terms is traced to a ticket, and that MM-96's claims list includes the terms.

### P-5. With no account and no server, acceptance cannot be evidenced beyond the device
- **Domain:** product. **Class:** unverified hypothesis requiring investigation; its legal weight is for a lawyer. **Severity:** medium. **Confidence:** low on consequence, high on fact.
- **Fact:** the record would be a local row that an erase or uninstall removes.
- **Remediation:** list it as an owner decision the legal reviewer should see. Do not solve it with telemetry.

### P-6. A user who declines updated terms still has health data on the phone
- **Domain:** product (refer to privacy). **Class:** design/usability improvement. **Severity:** medium. **Confidence:** medium.
- **Basis:** MM-62 line 11 says an app holding health data must let the user remove it. A guard that blocks everything also blocks Settings → Erase.
- **Remediation:** offer "Erase all data" from the guard when a setup exists. Add export once backup exists (MM-63, not inspected).

### P-7. Roadmap placement is undefined and the roadmap predates the tickets involved
- **Domain:** product. **Class:** documentation or requirement gap. **Severity:** low. **Confidence:** medium.
- **Evidence:** `roadmap.json` has no entry for MM-184. WS-03 `primaryOwnership` still names Dart paths (`roadmap.json:855-862`).
- **Recommendation:** code ownership decides (roadmap README, "When a ticket is added"). The guard lives in the app shell, so MM-242 belongs to **WS-03**. The legal review and store terms are a gate in **WS-13** step 6 / MM-94, milestone M3. Add MM-242 to exactly one workstream (WS-03) and reference it from MM-94. I did not read the whole graph, so the edge details are for the chair.

## Proposed acceptance criteria (proposed only; none approved)

```gherkin
Scenario: First launch
  Given a new installation
  Then the terms are shown before the theme chooser and before onboarding
  And nothing is preselected as accepted
  When the user accepts
  Then the accepted version and the date are stored on the device
  And the theme chooser opens

Scenario: Accepted once
  Given the current terms version has been accepted
  When the app is opened again
  Then the terms are not shown

Scenario: An installation that has never accepted
  Given an installation with a setup and no stored acceptance
  When the app opens
  Then the terms are shown before any other screen
  And no stored data is changed
  When the user accepts
  Then the app continues to the screen it would otherwise have shown

Scenario: The terms changed
  Given version 1 was accepted
  And the installed app carries version 2
  When the app opens
  Then the terms are shown, saying they have changed since the user accepted
  And the app is not entered until version 2 is accepted

Scenario: Not accepting
  Given the terms are shown
  When the user does not accept
  Then no acceptance is stored
  And onboarding, the home shell and Settings cannot be reached
  # What "Decline" does (exit, or remain) is an open owner decision.

Scenario: Declining with data on the phone
  Given an installation with a setup and terms awaiting acceptance
  Then the user can erase all data from the terms screen without accepting

Scenario: Reading the terms later
  Given the terms have been accepted
  When the user opens the terms from Settings
  Then the full text, its version and its effective date are shown
  And nothing on that screen changes the acceptance

Scenario: Erasing data
  Given the terms have been accepted
  When all data is erased
  Then no acceptance remains
  And the terms are shown before the theme chooser

Scenario: Offline
  Given the phone has no network
  Then the terms can be read and accepted, and read again from Settings
  And the app makes no network request to do so

Scenario: Acceptance stays on the device
  Then accepting the terms sends nothing anywhere
  And the acceptance is not written outside the app's own storage

Scenario: Storage failures
  Given the acceptance fails to load or to save
  Then an explicit failure with a retry is shown
  And the app is not entered and does not claim the terms were accepted

Scenario: The order of guards
  Given accepted terms and a profile under 18
  Then the adults-only screen is shown as before
  Given accepted terms and a health check that is due
  Then the health check is shown as before

Scenario: Safety text is not moved into the terms
  Then the health check's "not medical advice" sentence and every caution remain where they were

Scenario: The terms match the app
  Then each statement in the terms about what the app does or stores names the ticket that makes it true
  And MM-96's claims list includes the terms

Scenario: Reviewed before release
  Given the terms text has not been reviewed by a qualified lawyer
  Then this ticket says so and MM-94 lists the review as outstanding
  When it is reviewed
  Then this ticket records the reviewer's name, the date and the version reviewed

Scenario: Substitutable storage
  Then the SQL and the in-memory implementations pass the same contract tests for the acceptance

Scenario: Stories
  Then the terms screen (first acceptance and changed version) and the Settings reading view each have a Storybook story
```

**Edge cases to settle in the ticket**
- A downgrade: the stored version is newer than the bundled one.
- Acceptance date and the day rollover (store the calendar day, as other preferences do).
- Enlarged text and long scrolling.
- The demo seed and every existing story start from stores with no acceptance, so `walkOnboarding` and the screen stories will meet the guard (refer to qa and react-capacitor).
- The schema change takes version 2 and the single schema lane (`AGENTS.md:145-147`).

## Research

- **Status:** performed, directly, with this session's WebFetch. No search queries were issued; known official URLs were retrieved. No repository code or personal data was sent.
- **Question:** do the stores require, default to or constrain a developer EULA, and do they impose health-disclaimer wording that the terms must agree with?
- **Trigger:** a current platform-policy fact that affects owner decision 7 (store-listing terms).
- **Limits:**
  - Page content was summarized by the tool's small model. Quotes below are as returned, not independently re-read.
  - The Apple review guidelines page was read only to character 100,000 of 112,273.
  - Apple's "Instructions for Minimum Terms of Developer's End-User License Agreement" was not retrieved.
- **Not researched:** what a health-app EULA should contain legally (governing law, arbitration, warranty wording). That is the owner's "panel guidance" plus a lawyer, and belongs to the health/safety roles and the chair. From this role, mark it open.

## Sources and evidence (all accessed 2026-10-12)

| URL | Title | Date on page | Claim supported |
|---|---|---|---|
| https://play.google/developer-distribution-agreement.html (redirected from play.google.com/about/developer-distribution-agreement.html) | Google Play Developer Distribution Agreement | Effective September 15, 2025 | Section 5.3: the developer grants the user a licence by default; "If You choose, You may include a separate end user license agreement"; on conflict "this Agreement will supersede the EULA"; the EULA is between developer and user only. |
| https://support.google.com/googleplay/android-developer/answer/16679511 | Health Content and Services - Play Console Help | null (© 2026 only) | Non-device health apps "must include a clear disclaimer in their app description" that the app is "not a medical device and does not diagnose, treat, cure, or prevent any medical condition"; apps "must also remind users to consult a healthcare professional"; a privacy policy link in Play Console and "a privacy policy link or text within the app itself". |
| https://www.apple.com/legal/internet-services/itunes/dev/stdeula/ | Licensed Application End User License Agreement | null (© 2026) | Apple has a standard EULA: scope of licence, consent to use of data, termination, external services, no warranty, limitation of liability, governing law. |
| https://developer.apple.com/help/app-store-connect/manage-app-information/provide-a-custom-license-agreement/ | Provide a custom license agreement | null | "If you don't provide a custom EULA, the standard EULA is applied to your app"; a custom EULA is entered in App Store Connect per country or region; the page links to minimum terms. |
| https://developer.apple.com/app-store/review/guidelines/ (first 100,000 characters) | App Review Guidelines | null | 1.4.1: "Apps should remind users to check with a doctor in addition to using the app and before making medical decisions." No EULA requirement was found in the portion read. |

**Interpretation (mine, not the sources')**
- Neither store, in what was retrieved, requires an in-app EULA guard. The guard is the owner's choice.
- On Google Play a custom EULA is optional and cannot override the Distribution Agreement.
- On Apple, saying nothing means Apple's standard EULA applies; a custom one must be entered in App Store Connect to be the store's terms.
- Google's health policy puts the disclaimer in the listing description and a reminder in the app. That supports keeping MM-96 separate from MM-242, and it adds a requirement MM-95 does not state (privacy policy link or text inside the app).

**Freshness:** store policies change. Revalidate before submission (MM-94).
**Conflicting evidence:** none found.

## Confidence and limitations

- **High:** repository facts 1-7 (direct reads).
- **Medium:** the guard-order recommendation. It is a product judgement with a stated alternative.
- **Medium:** store facts (tool-summarized pages).
- **Low:** anything about legal sufficiency, which is outside this role and this panel.
- No render of the built screens was used. No tests were run. Hashes are missing.
- The roadmap graph was read only in part.

## Dependencies

- **research-safety / nutrition / training roles:** what the health terms should say. They challenge P-4.
- **privacy:** the acceptance record, the erase behavior and P-5/P-6. It challenges my erase default.
- **react-capacitor:** a narrow reader/writer interface behind `PreferencesRepository`, with fixture and contract; schema version 2; fail-closed loading; whether an "exit" needs a native plugin (if so, a release-build check per `AGENTS.md:104`); the banned-word test against legal text.
- **ux / product-designer:** the accept control, long-text reading, placement relative to theme choice, the "terms changed" presentation, and the Settings row.
- **qa:** the story walk past the guard, the eraser contract change, and the AppRoot order test.
- **Tickets:** MM-184, MM-62, MM-165 (amend or note); MM-96, MM-95, MM-94, MM-13, MM-80 (link).
- **Blocking decisions:** owner items 1-9 below block the text and release. They do not block building the mechanism against a clearly marked draft (`AGENTS.md:164-166`, principle 4).

## Safety concerns

- A EULA must not become the place safety lives, or an excuse to thin screening and cautions (P-3; proposed scenario "Safety text is not moved").
- The guard must not suppress or reorder the health re-check or the adults-only block.
- Disclaimers written by non-lawyers can be over-broad or false about the app (P-4), which is misleading certainty in the other direction.
- An acceptance guard can read as accusatory at first launch for users with eating-disorder history. Tone is for the behavior and UX roles.
- Privacy: P-5 and P-6.
- None of this is legal or clinical clearance.

## Unresolved product decisions (authority: the product owner; a lawyer for items 1-5)

1. **Licensor.** The legal name of the person or entity granting the licence. It affects every clause and the store developer name.
2. **Governing law and venue.** Which US state, and which courts.
3. **Arbitration and class-action waiver.** Wanted or not. With no account there is no channel for a notice or an opt-out other than item 4.
4. **Contact address.** Postal and/or email for legal notices. MM-94 line 33 already lists a support contact as unticketed.
5. **Effective date and version numbering.** The scheme (integer or date), and whether every text change re-prompts or only material ones.
6. **Declining.** Close the app, or stay on the screen with an explanation. Closing may need native shell work; staying needs none.
7. **Store terms.** Whether the same text is supplied to the stores as a custom EULA (optional on Play; on Apple it replaces the standard EULA and must meet Apple's minimum terms), or the stores' defaults stand and the in-app text is additional. Whether the two must match version for version.
8. **Erase.** Does "Erase all data" remove the acceptance (my default, consistent with MM-62 and MM-165) or keep it, as MM-87 keeps the purchase?
9. **Guard position.** First of all (recommended) or after the theme chooser.
10. **Legal review as a gate.** Is a qualified lawyer's review a release gate in MM-94, and may the guard ship in non-release builds with draft text?
11. **MM-96's Settings clause.** Is it met by a plain sentence in About, by the terms row, or by both?
12. **Evidence of acceptance.** Is a device-only record that an erase or uninstall removes acceptable (P-5)?
13. **Privacy policy inside the app.** Google's policy asks for a link or text within the app. Is that MM-242's Settings area, or MM-95's own work?

## Verification

- **Tests run:** none; the role is read-only.
- **Tests inspected:** `dataEraserContract.ts:90-96`; `stories.test.tsx:58-66`.
- **Requested of the edit owner / qa:**
  - Confirm at runtime that an erase leads to the theme chooser (P-2).
  - Run `mm req` after MM-242 and the amendments.
  - Run the stories test once the screens exist.
- **Evidence labels:** all repository claims are source inspection; all store claims are retrieved documents summarized by tool; there is no runtime reproduction.

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
