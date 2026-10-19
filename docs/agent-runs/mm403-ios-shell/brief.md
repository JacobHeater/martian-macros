# Brief: the app on an iPhone, where it differs (MM-403, MM-69)

## Question
The app is being built for iOS (MM-403). Almost nothing on a screen changes;
two places do, because the platforms differ in what they can do or what they
call things, and both are drawn in Storybook first (MM-293) for this review:

1. **The terms declined on iOS** (`TermsNotNowOnIos`). Android offers "Close
   the app" after "Not now" (it puts the app in the background). iOS has no
   such call and Apple refuses an app that quits itself, so on iOS the button
   is absent and the sentence ends ", or leave the app from the Home Screen."
2. **Apple Health in Settings** (`AppleHealthNotOnThisDevice`,
   `AppleHealthNoneAsked`, `AppleHealthSomeAsked`, `AppleHealthNothingFound`,
   `AppleHealthReadFailed`). The section is the Health Connect one with the
   platform's own name, and one difference of substance: HealthKit never
   tells an app that reading a kind was refused. So on iOS a kind asked for
   counts as connected; its row says what was read, or "Nothing found in
   Apple Health yet. If you expected readings, check Health, Sharing, Apps."
   The rows say "Not asked yet" rather than "Not allowed"; the check mark
   stands only for a kind that was read; the snack after asking says what
   was read or that nothing was found; the caption says what Apple Health
   cannot tell the app and where to stop sharing.

Does each look and behave like its Android sibling (rule 9 of
`design/screen-direction.md`), and if not, is the difference the platform's
and said in the domain's own words? Is the wording right for a novice who
has just been shown Apple's permission sheet and chose something the app
cannot see? Is any state missing? Anything a screen reader hears wrongly?

## Inputs
- Stories (the renders): `apps/mobile/src/gallery/screens/Settings.stories.tsx`
  (sha256 b918ae6eaa6a736b…), `apps/mobile/src/gallery/screens/FirstRun.stories.tsx`
  (1bf2c704ce8b749c…), `apps/mobile/src/gallery/screens/onIos.ts` (dab6daf8236bf694…).
- Components: `apps/mobile/src/settings/HealthPlatformSection.tsx`
  (0741a5e52508c856…), `apps/mobile/src/terms/TermsGuardScreen.tsx`
  (6b1af6466d4006cb…), `apps/mobile/src/terms/termsOfUse.ts` (e94066e6f8a52adc…).
- Tests that say what is meant: `apps/mobile/test/settings/appleHealth.test.tsx`,
  `apps/mobile/test/app/termsOfUse.test.tsx`, `apps/mobile/test/terms/termsText.test.ts`.
- Requirements: `requirements/app-shell/TASK.the-ios-shell.MM-403.md`,
  `requirements/health-sync/STORY.import-from-healthkit.MM-69.md` (the owner's
  decisions of 2026-10-19), `requirements/health-sync/STORY.import-from-health-connect.MM-68.md`,
  `requirements/app-shell/STORY.terms-of-use-before-anything-else.MM-242.md`.
- Direction: `design/screen-direction.md` (rule 9), `design/anti-cruft-and-anti-slop.md`.
- The Android siblings: the Android branch of the same component (the
  `HealthConnect*` stories in `Settings.stories.tsx`, reviewed in
  `docs/agent-runs/mm320-*` if present) and `TermsNotNow`.

## Audit mode, coverage, renders
- Mode: change. Baseline `main` at 08c11cf; the working tree of
  `feat/ios-shell`, uncommitted at review time (hashes above).
- **Depth targets**, counted from the source:
  1. Settings, Apple Health, a person asking for Weight and finding nothing
     (`AppleHealthNothingFound`, `AppleHealthSomeAsked`): seven rows each
     pressable once, one "Read from Apple Health now", two snacks, one
     caption; the decisions are which kind to ask for, what the sheet's
     outcome means, and what to do when nothing is found. Count: 7 + 1 + 2.
  2. The terms declined on iOS (`TermsNotNowOnIos`): three ways on ("Read
     the terms again", "Erase all data" with records, leaving from the Home
     Screen). Count: 3.
- **Render supplied**: the stories, read from source, each drawing the real
  component over fixture data (MM-237). **No browser capture**: this session
  has no browser automation on the owner's Mac, so the chair could not open
  Storybook; the reviewer walks the source of the story and the component.
  Say so in the walkthrough. The owner looks at the stories in `mm storybook`
  as the design check (the handoff asks for it).
- Surveyed only: the terms text's four iOS paragraphs (`sectionsOn('ios')`),
  the imported weigh-in's source name on Progress (`importedWeighInText`).
- Not reviewed: the Swift plugins, the `mm` tool, anything on Android, which
  is unchanged in wording (the tests assert it).

## Existing facts, non-goals, owner decisions
- Owner (2026-10-19): the DEMO identity; no "Close the app" on iOS; the
  platform named "Apple Health"; a kind asked for counts as connected and
  "not allowed" is never claimed (MM-69). These are not up for review; how
  they are said is.
- Non-goals: a neutral name for both platforms (declined); asking HealthKit
  again for a kind (iOS shows the sheet once).

## Acceptance criteria
- MM-403: "Not now on iOS", "Not now on Android, unchanged".
- MM-69: "No data, or no permission": with no samples the app says none
  were found and how to check Health permissions. Proposed, from this
  change: a row never says "allowed" of a kind nothing has been read from.

## Siblings (rule 9)
- The Apple Health section is the Health Connect section (`HealthPlatformSection`,
  Android branch), laid out as Reminders is (MM-320): the same rows, icons,
  "Read from … now" last, caption under the card.
- The declined page is `TermsNotNow`, one button fewer.

## Roles
- product-designer: hierarchy, the check mark's meaning on iOS, wording
  length in a row's subtitle, the caption's weight.
- ux-accessibility (the UX guard): the walkthrough of both depth targets;
  what a person is told after the sheet; the snack and caption for a
  screen reader; whether "Not asked yet" is understood as an action.
- chair: the parent session; scope, persistence, synthesis, the edits and their verification.
- training: omitted. No exercise, training or strength behavior changes: the iOS shell carries the same app.
- nutrition: omitted. No energy, macro or body-composition behavior changes.
- coaching: omitted. No coaching, adherence or reminder wording changes; reminders on iOS (MM-405) schedule the same plan.
- measurement: omitted. No estimation or adaptive behavior changes; an imported weigh-in is handled as before, only the platform's name differs.
- safety: omitted. No safety wording, limit or escalation changes; the terms differ only in the platform's and the reader's names.
- product: omitted. The scope is the owner's decisions of 2026-10-19, recorded in MM-403 and MM-69; the product-designer and UX guard review how they are said.
- architecture: omitted. The Swift plugins sit behind the existing interfaces (MmDbApi, MmPacksApi, MmRemindersApi, MmScannerApi, MmHealthApi); the one new seam, AppServices.platform, follows the pattern of environment. Reviewed by the chair against test/architecture.test.ts and test/layers.test.ts.
- react-capacitor: omitted. The chair built and ran the shell on the simulator (recorded in tests[]); a read-only review of the Swift is the handoff's to ask for when the owner's phone is signed.
- integrations: omitted. HealthKit's semantics (no refusal reported, anchored queries as the change token) are recorded as decisions in MM-69, made with the owner; the plugin is verified on the simulator and the device check is on the owner's checklist.
- privacy-security: omitted. Nothing new leaves the device: the same one HTTP fetch, read-only health access, files under Application Support excluded from backup, purpose strings in Info.plist. No new data flow to review.
- qa: omitted. Verification is the chair's and is recorded in tests[]; the acceptance criteria of MM-403 to MM-406 trace to the tests named in decision.md.

## Writer
The parent session (the chair) edits; reviewers return text only. Paths:
`apps/mobile/src/settings/HealthPlatformSection.tsx`, `apps/mobile/src/terms/`,
the two stories, the tests above, and the tickets MM-403 and MM-69.
