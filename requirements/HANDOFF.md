# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-19, by Claude, Session 37.

**The conversion out of the Flutter ecosystem is complete (MM-228/MM-232).**
The app is the React one in `apps/mobile/`, inside a thin Capacitor shell with
the app's own Kotlin plugins; the Flutter app, the Dart packages and the
Dart task runner are removed (git history keeps them). `mm` is TypeScript
run by Node itself. Read Session 21 below before anything else.

**Delivery.** PRs #120 to #130 are merged: every screen in React with its
tests carried over (suite ~1,880), the phone's own storage (`MmDb` over
bundled SQLite with FTS5, `MmPacks` for pack files and the one HTTP fetch),
the camera (`MmScanner`), reminders (`MmReminders`), Health Connect
(`MmHealth`, read-only) and the hardware back button. All verified on the
emulator: onboarding survives `am force-stop`; the real manifest lists two
packs; Common foods downloads, checks, unpacks, commits and answers a
search; a weigh-in reminder puts alarms in `dumpsys alarm`; Health Connect
grants weight and syncs. The switch itself (this session's PR) replaces the
task runner, re-points `coverage.json` at `apps/mobile/src` (150 surfaces),
records the Flutter theme in `apps/mobile/test/support/flutterTheme.json` for
the tokens test, and rewrites CI to Node + a debug Android build.

**Standing rules (owner, 2026-10-12).** Screen and design verification is
done in a browser; **Storybook is the design register** (MM-237,
`mm storybook`), where design decisions are tracked on tickets (`## UI/UX`
story links) and where the owner opines without running the app. The old
HTML register (`requirements/ui-ux-assets/`) is deleted, by the owner's call,
with every ticket's `## UI/UX Assets` section; never add HTML drawings of
screens. The panel's implementation role is `react-capacitor` (MM-241);
there is no `flutter` role.
Icons are Material's Outlined set behind `MmIcon` (MM-236); no hand-drawn
glyphs. Device and emulator screenshots verify native behavior only, never
the design. The app folder is `apps/mobile` (renamed from `apps/web` the
same day): a mobile application built on web technologies.

**Storybook first, then the panel, then the build (owner's rule,
2026-10-14; MM-293, in `AGENTS.md`).** Every design is drawn in a story in
every state the screen can be in, looked at in the three palettes, reviewed
by the product-designer and UX-accessibility roles (reports and outcomes
under `docs/agent-runs/`), and built only once the UX guard has no open
blocking finding. A phone state with no story is a defect (MM-292). Words
are the domain's own: the macro switch is "Grams | Split" (MM-290). Nothing
that holds a control sits bare on the canvas (rule 1 amended,
`hierarchyProblems` checks it, MM-291). Brief the reviewers with the
findings template and create the run folder first (the lesson of
`docs/agent-runs/mm291-weigh-in/`).

**The roadmap is current and checked (MM-245, owner's rule 2026-10-13).**
`roadmap/roadmap.json` is where you choose what to build; keep it that way.
A ticket you create goes into a workstream and a step in the same pull
request; a ticket you finish moves to built; `mm req` (so `mm check` and
CI) fails when the roadmap and the tickets disagree; `mm roadmap`
regenerates the progress page. Before you finish, say in this file which
step or milestone your session advanced, or that none did. The "What is
available right now" table in `roadmap/README.md` is current as of
2026-10-13.

**Terms of use (MM-242, in progress).** The first guard on every
installation is the terms of use (`apps/mobile/src/terms/`): a short
account, the full text, "I agree" and "Not now". The agreement (version
and day) is in `user_preferences`, schema version 2. A test or a story
has agreed already unless it says otherwise (`renderApp`'s `terms`
option, `screenStory`'s `terms`). **The text is a draft by non-lawyers
and blocks release** until an attorney reviews it and the owner settles
what MM-242 lists as still to be decided. The expert panel's reports,
sources and the chair's decisions are in `docs/agent-runs/mm242-eula/`.
Change what the app does with data and the terms together: they say
only what the code does, and never "nothing is uploaded" (MM-244).

**Live reload on a device (MM-300).** `mm run --live [-d DEVICE] [--port N]`
serves the app from the Vite dev server on `127.0.0.1` and runs Capacitor's
live reload through adb reverse: save a file and the emulator updates
without a build. Ctrl+C ends it; `mm run` puts the bundled app back. Do
not launch it with PowerShell redirection (`*>`, `2>&1`): PowerShell 5.1
turns Vite's stderr into an error and kills the runner.

**Database.** The React app's schema is `apps/mobile/src/data/currentSchemaVersion.ts`,
`currentSchema.ts` and `migrationSteps.ts`, with their tests (version 5
since MM-325). Only one schema change at a time. **A version's shape never
changes once any build of it has run** (MM-325: version 4 gained a column
after the owner's phone had it, and the sodium limit stopped switching on
there); `test/data/schemaFingerprint.test.ts` fails when the schema changes
without a new version.

**The engineering rules are checked (MM-246, MM-261, MM-278).**
`test/architecture.test.ts` fails the suite on a file with two declarations
or the wrong name, a library imported outside the folders it lists, a raw
control in a screen, a native date, time or select control anywhere, a
`<button>` outside its homes, a composite that writes a control, a
component prop named `color`, `className` or `style`, or a screen that
draws a row's chevron; `MmPressable` is the component for content pressed
as a whole.

**Next ticket ID.** `mm req next` is the authority (MM-326 at this writing).

**The register is complete (MM-237, done).** Every screen, sheet and step
has a story under `apps/mobile/src/gallery/screens/`: the whole app as
shipped over in-memory stores on a fixed day, in a phone's viewport, opened
at that screen (`screenStory({ covers, shows, open, walk })`). A new
`*Screen.tsx`, `*Sheet.tsx` or `*Step.tsx` with no story fails
`test/gallery/stories.test.tsx`, which also draws and walks every story.
**And every part of a screen is drawn (MM-321).** `npm run unseen`, part
of `mm check`, draws the stories under coverage and fails on markup no
story reaches unless `apps/mobile/test/gallery/unseen.json` names it with
a reason; a place a story now draws fails until it leaves the register.
A state that needs the phone (a health platform, a camera) is brought
with `screenStory`'s `device` (`healthPlatform`). Settings' Health
Connect rows went unseen and unreviewed for months because the stories'
platform was empty (MM-320).
Two rules came out of the owner's phone review the same day: a stylesheet
rule that removes an outline must name `:focus-visible` (MM-239, a focused
field drew two rings), and a slider inside a list group is an
`MmSliderRow`, never a bare `MmSlider` (MM-240). Do not start a second
`storybook dev` while one is running: they share a dependency cache and
the first one starts answering 504 until it is restarted.

**Rows that are windows into a measurement take it in place (owner,
2026-10-14, MM-301).** The Dashboard's weigh-in and waist rows hold their
field when the measurement is due; the confirmation snack offers the
destination ("Open Progress"). **Snacks always stand above the
navigation bar** (owner, same day, MM-302): the bar publishes
`--mm-navigation-bar-height`, and a floating action rises above a snack
(`--mm-snack-clearance`). Don't position bottom overlays without them.

**What to build next** (the roadmap's "What is available right now", in
order; `mm roadmap` draws it).
- WS-03 step 14: MM-304, what the waist panel left (focus after an
  in-place save, Open Progress landing on the waist, correcting today's
  waist) and three owner calls listed in it.
- WS-02 step 6: MM-135, the diet break the owner decided (offered at 12
  weeks and on failing recovery signals, forced at 20); an engine change.
- WS-03 step 12 is built (MM-290 to MM-299). Open from its panel runs:
  whether the trend above the weigh-in field anchors the entry
  (measurement), whether a first-section "Change goal" invites switching
  (safety), and the goal as one row instead of a section (PD-4, owner).
- WS-03 step 11: MM-286 (destinations keep their state across tabs),
  MM-287 (Progress with one figure and lift rows), MM-289 (a demo seed
  that shows every mark); MM-288 is the owner's decision on Ember text.
- WS-15 steps 1 and 2: MM-250 (the nightly sleep record), MM-251 (sleep
  disorders in the health check).
- WS-11 step 2 (MM-71), WS-13 step 1 (MM-95, MM-247, MM-244), WS-09 step 4
  (MM-248), WS-04 step 1 (MM-51, waiting on a pantry).
- MM-214 and MM-215 remain skipped in the web suite, each waiting on its fix.
- Blocked: phase planning (MM-36) needs body-fat estimates (MM-34).

**Decided by the product owner on 2026-10-13** (each recorded in its
ticket): the hold-a-reduction stays as built (MM-138 closed; M1 is
complete); the diet break is offered at 12 weeks and on failing recovery
signals, forced only at 20 (MM-135, engine change to do); onboarding's
grouped screens stay grouped (MM-103 closed); the purchase plugin is our
own over StoreKit 2 and Billing 9 (MM-84); the terms guard stays first, the
legal blanks stay blank for the attorney, the four flagged behaviours stay
and are listed for review, the stores get the same text from one public
page on GitHub Pages (MM-242, MM-247); the privacy policy is drafted now
with the terms (MM-95); exact alarms are requested (MM-248); the rest timer
stays vibration only (MM-191); no helpline until a clinician reviews one
(MM-114); MM-51's pantry checks stay open (no online source of barcodes).

**Sleep is a first-class signal (owner's rule, 2026-10-13; MM-249).**
The owner overruled the panel's "emerging" grade of short sleep's effect
on fat loss, with reason: MM-116 graded it on one trial and that trial
(Nedeltcheva 2010: 55% less of the loss as fat, 60% more lean mass lost,
less fat oxidised, at 5.5 against 8.5 hours) was not alone (Tasali 2022;
Shechter 2016 on sleep apnea). WS-15 holds the work: a nightly record from
the health platform or by hand (MM-250), sleep disorders in the health
check, refer-only (MM-251), and a coach that reads it (MM-252) after a
panel pass in grading mode with the sources pre-listed. Lesson for the
panel protocol, not yet written into it: an "emerging" grade on one trial
is not a grade; the research gate should require a search before any
evidence is graded below "moderate".

**Hierarchy and wayfinding (owner's rule, 2026-10-13; MM-253).** The owner's
diagnosis: monolithic views, no iconography, cognitive overload; the app
needs more graphics, natural segmenting and view hierarchies. Looked at in
the register, it holds: every screen is a column of same-weight cards,
facts repeat, explanations sit inline, lists have no shape, icons only in
the nav bar, primary actions compete. Decided: Material icons everywhere now
(custom art after MM-109), both macro pictures behind a switch, one
direction across all destinations built in stages. MM-253 writes the
direction and runs the product-designer and UX roles on the built stories;
MM-254 to MM-259 rebuild each destination with before and after stories.
**All of it was built the same day** (Session 24): read the direction at
the top of `design/screen-direction.md` before touching a screen, and
`MmSection`, `MmRhythmStrip` and `NumberEntry` in `src/ui/` before adding
a tier. The panel's reports and the chair's outcomes are in
`docs/agent-runs/mm253-hierarchy/`; what it left for later is WS-03 step
11 (MM-286 to MM-289).

**Nothing native shows (owner's rule, 2026-10-13; MM-262, built).** After
the date dialog took three prompts to become a component, the owner ruled:
"make everything custom and beautiful for Martian Macros. I want to own the
full visual experience." No native picker, list, glyph, thumb, highlight or
focus ring; the design system draws every control and every state, judged
in the register in three palettes. The panel's product-designer,
UX-accessibility and React-Capacitor roles walked every file of `src/ui/`
(`docs/agent-runs/mm253-components/`, 74 findings), the findings became
MM-263 to MM-282, and **all of it was built the same day** (Session 23):
the calendar (`MmDatePicker`), the drums (`MmTimePicker`), the select that
opens the options list (`MmDropdown`), the checkbox and slider drawn in
`ui.css`, a pressed family with `.mm-pressed` twins, menus through the
overlay host (`overlays.menu`), inert app root and focus trap in every
overlay, a snack with Undo that waits, the States and Overlays stories,
motion tokens, inset focus rings, the quiet destructive kind, 48 dp chips,
and `design/design-system-implementation.md` rewritten for the React
library. Read that document before adding a component. Also decided: the
Ember switch stays. Not yet looked at on the phone: the drums' scroll feel
and the calendar swipe (the Pixel was disconnected); the Storybook stories
were looked at in a headless browser in three palettes.

**Build a new part like its siblings (owner's rule, 2026-10-14, MM-318;
rule 9 of `design/screen-direction.md`, in `AGENTS.md`).** Before drawing
a new section, row or control, open the component of the nearest one on
that screen and reuse it; name it in the ticket; inspect the whole screen;
ask the panel to compare. The water section was invented beside the meal
sections, shipped twice, and the owner had to point at the meals. His
words: if it happens again, there are consequences.

**Questions to the owner go through the interactive question tool (owner,
2026-10-14).** Never as a numbered list in a chat reply: batches of up to
four, concrete options, the recommendation first.

**Water, sodium and micronutrients (MM-305, built 2026-10-14).** Micros is
a choice of the nutrition card on the Food screen only (`CalorieHero
microsOffered`), at Full detail. Every micronutrient total is the known
amount with its coverage, never treating missing as zero; references are
withheld in pregnancy, breastfeeding, kidney disease, after bariatric
surgery and under 19. Insight rules about intake other than protein and
logging are flagged `otherIntake` and suppressed for an eating-disorder
history (MM-141).

**Coaching insights inline (MM-361), built 2026-10-18.** The framework
(MM-362, MM-363, MM-364), the snooze (MM-378), the kinds the panel has
checked (food: portion check, light on protein, mostly fat, MM-365; training:
volume jump, MM-366; body: waist no clear change, and water logged on few
days, MM-367) and the food grades (MM-369, MM-370, MM-371) are on main. A
kind joins `engine/itemInsightKinds.ts` only after its domain roles check it
(`docs/agent-runs/mm365-food-rules/`, `mm366-workout-rules/`,
`mm367-body-water-rules/`), with its evidence rows; the words test forbids
the panel's lists. The framework's safeguards carry the under-eating
finding and the policy's cautions beside the eating-disorder history.
`InsightPreview` is a story override only; `draftInsightKinds.ts` holds
sleep's drafts (MM-368 waits for MM-250). **The weigh-in time line was
dropped** (no weigh-in time is stored). **Grades are the app's own method
since Session 35** (MM-380, MM-382, `docs/food-grades.md`): what a food
gives per calorie, with calories, the macros, fiber and sodium required and
sugars, saturated fat and ten vitamins and minerals counted when stated, so
about nine in ten common foods and five in six barcode foods grade today
and the popover says what was not counted; the published tables of MM-369
are withdrawn. **MM-377** (strength
on fat loss) is built on the measurement and nutrition roles' terms
(`docs/agent-runs/mm377-strength-on-fat-loss/`): fat-loss weeks as of the
workout, held within 2.5% of the smoothed start, up at 5%, no story (the
demo's data does not reach it).

**Food packs and downloads (Session 35, MM-383, MM-384).** A third generic
source, USDA FNDDS 2021-2023, is wired into the pipeline (not yet built: no
DuckDB here); the app's own reliability score (`foodCatalog/SourceReliabilityRule`)
orders search results and decides a shared barcode at build time
(`ReliabilityPolicy`, the default); generic foods with one name keep one
record; the build fails when a configured source gives nothing and
`coverage.txt` counts per pack and per source. Any number of packs download
at once (`state/PackDownloadsController`, one cell per pack), each behind a
download icon, with a card and a strip line per download.
`docs/food-packs-data.md` holds the owner's commands.

**Waiting on the product owner.**
- Coaching insights: no paywall for any of MM-361 to MM-371 (not behind
  MM-85). Open, each recorded as "say if any is wrong" in its ticket:
  "mostly fat" keeps the total-fat trigger so the peanut-butter example
  fires (nutrition's saturated-fat alternative would drop nuts, nut butters,
  oils and avocado, MM-365); the waist line is hidden with an eating-disorder
  history (MM-367); a per-entry "Right as logged" for the portion check and
  empty-state words for the Snoozed list were declined (MM-365, MM-378);
  hide "strength on fat loss" under the low-body-weight caution (MM-377)?
- Grades (MM-380, "say if any is wrong"): the per-calorie floor on the
  against side only; the sugars waiver's ramps; energy density to five
  points; no per-100 g sodium backstop (chips and butter pay little); the
  fortified-sweetened-cereal cap; protein's weight of 8; no unsaturated-fat
  positive (walnuts beside chips, olive oil beside cola); recipes ungraded;
  pack foods graded now without sugars (a cola reads C until the rebuild);
  and whether showing grades with an eating-disorder history (MM-370) still
  stands now that every A+ is a vegetable. The Nutri-Score items are gone
  with the method.
- Food packs (MM-381, MM-383, `docs/food-packs-data.md`): install DuckDB,
  run `mm food fetch`, list the FNDDS zip, `mm food build` (fails if a source
  gives nothing; read `report.txt` and `coverage.txt`), spot-check three
  FNDDS foods, `mm food package` and publish the release; the fifty-package
  hand check (MM-51) that would settle freshness against provenance. "Say
  if any is wrong": the reliability bases (95/90/80/65/40), the build's
  conflict policy now the score (USDA Branded over Open Food Facts), one
  name one food with the grade's floor first, FNDDS names as the source
  states them, the fetch cache keyed by address (MM-388).
- Downloads (MM-384): both packs started together on a release build with
  the WebView's memory watched (MM-387 open); MM-386 (the catalog re-open
  leak) open; whether a finished notice should also clear on leaving the
  screen.
- Warmer Martian (MM-375): the owner approved the royal 90s violet and
  kept lime. Open: Martian's ion and protein are the same aqua, so the
  coach's insight lines share protein's colour (panel P-3/UX-4); whether
  categorical grade fills read as judging food (coaching/safety, MM-370).
- **Phone checklist, to hand the owner when it is long enough** (they will do
  all physical-device testing at the end, 2026-10-16: keep adding, do not ask):
  a real barcode on packaging (MM-43); a pack download over mobile data
  (MM-56); the pause and reminder screens on the device (MM-148, MM-146);
  Health Connect import (MM-68); Martian at low brightness, whether cards and
  the navigation bar still stand off the canvas (MM-375, UX-6); a volume jump
  line under a lift, opened, and its Settings switch (MM-366, MM-364); a food
  line, snoozed for a week and undone, and the Snoozed list in Settings >
  Coach > Food (MM-378); the Food screen at 320 px with a grade and a line
  under a long food name (MM-370); a grade's popover and a "?" popover,
  including one that says what was not counted (MM-382); both food packs
  started together from their icons, one cancelled from the strip while the
  other runs, both installed with matching checksums, the WebView's memory
  watched (MM-384, MM-387); with gesture navigation, no blank band between
  the two strip lines nor between the tab bar and the strip (the designer's
  PD-5); TalkBack on while both packs download and a food is logged, to
  hear progress spoken at ten-percent steps and a swipe after pressing a
  pack's icon land on a control (the UX guard's F1, F2); a grade's popover
  at 200% text on a food missing sugars and most vitamins, to see "Got it"
  reachable (F3); a search for "oats" after the rebuilt packs install, to
  see the order by source (MM-383); with TalkBack on, let a pack finish and
  note whether "… is on your phone." is spoken (the guard's F4 caveat);
  the empty Food screen in the three palettes with no line under the hero
  and no fold arrows on empty meals, then TalkBack on Food to hear the
  calorie figure once and "Yesterday" as the heading on a past day
  (MM-389, MM-390); a food logged as several servings and light on
  protein, to see both coach lines under it, and the three-line case
  (MM-393); Settings > Health Connect after steps are read: the Steps row
  names the app (or only counts the readings) and wraps inside the card,
  never a package id (MM-395); with Net carbs on (the default), a food with
  fiber and sugar alcohols shows net in the bars, the Split and its row, and
  switched off in Settings > Today's setup shows the total (MM-396); a label
  with "Sugar Alcohol" read into a saved food (MM-397); Settings opening
  closed, each section opening in place, and "Correct date of birth" landing
  on "You" (MM-398); TalkBack's heading navigation through Settings and the
  Food screen's meals (MM-399); every tab scrolled to its end with the app
  bar and the navigation bar staying put (MM-400); the spacing around "More
  about this week" and between Settings' headers (MM-402).
- The attorney (MM-242, MM-95) and the clinician (MM-29); the licensor's
  legal name and a contact address when they exist.
- Fifty pantry barcodes and the hand check of fifty products (MM-51).
- The merge of MM-247's workflow pull request, when it is opened.
- Unlocking the Pixel to look at the seeded demo app, and plugging it in,
  so the new pickers can be felt on glass (`mm run --env phone`, then
  Settings → Profile → Date of birth, and a reminder's time).

**iOS (MM-403, 2026-10-19).** The app builds and runs in an iOS shell
(`apps/mobile/ios`, Capacitor with Swift Package Manager, the DEMO
identity) with Swift twins of the five Kotlin plugins, verified on the
iPhone 17 Pro Max simulator: the native database written and read
(MM-404), the shell launched by `mm run --ios`. **Not verified anywhere:**
a physical iPhone (needs the owner's team in Xcode, `docs/ios-signing.md`),
Apple Health readings on a device (MM-69), the camera (MM-406), a reminder
at its time (MM-405), a pack download over the network on iOS. CI builds
no iOS app yet (the owner's call). Phone checks listed above.

## Session 37: 2026-10-19, Claude (the iOS shell: five plugins in Swift, on the owner's Mac)

- The owner's 2016 MacBook Pro was brought to macOS Sequoia 15.8 and Xcode
  26.3 (the newest that runs on it; 26.4+ needs macOS 26), and the owner
  asked for iOS: all five plugins in one effort, the DEMO identity (on iOS
  `com.martianmacros.martian-macros.demo`: Apple refused the underscore
  when the owner chose a team in Xcode), no iOS
  job in CI yet, the simulator first and the phone once a team is chosen
  in Xcode (`docs/ios-signing.md`, written for the owner).
- **Built (MM-403, MM-404, MM-405, MM-406, MM-69 in progress):**
  `apps/mobile/ios/` (`npx cap add ios --packagemanager SPM`; CapApp-SPM's
  `Package.swift` is `cap sync`'s, never hand-edited); `MainViewController`
  registers `MmDb` (system SQLite, FTS5 in it), `MmPacks` (URLSession
  streamed as `packHttpChunk` events, gzip through Compression, SHA-256
  through CryptoKit, files under Library/Application Support excluded from
  backup), `MmReminders` (UNUserNotificationCenter, the plan as exactly
  what is pending), `MmScanner` (AVFoundation live scan with Cancel, Vision
  on a photo kept in memory) and `MmHealth` (HealthKit; the anchored
  query's anchor is the change token; "permitted" is the set of kinds asked
  for, since HealthKit never reports a read refusal). `Info.plist` carries
  the camera and Health purpose strings; portrait, iPhone only;
  `App.entitlements` declares HealthKit.
- **The app knows its platform** through `AppServices.platform`
  (`runningOn`, Capacitor's `getPlatform`); fixtures say `android`, a
  story says `onIos(...)`. The three places that differ: the terms declined
  on iOS (no "Close the app": "go back to the Home Screen; the app will ask
  again when you open it"), `HealthPlatformSection` (the Health Connect
  section renamed, "Apple Health" on iOS, "Not asked yet" rows, the route
  Settings, Health, Data Access & Devices in one form, the check only for a
  kind that was read), and the terms' four paragraphs by platform
  (`termsOfUse.sectionsOn`, no ML Kit on iOS; still the attorney's draft).
- **Storybook first, then the panel (MM-293):** seven `AppleHealth*`
  stories and `TermsNotNowOnIos`; the product designer and the UX guard
  reviewed from source (no browser capture possible in the session):
  `docs/agent-runs/mm403-ios-shell`. UX guard: pass. Accepted: the route
  Apple documents, the caption shortened, "asked for" never "allowed" on
  iOS, "phone" not "device", the Home Screen sentence, two more stories.
  **MM-407** (bug, done): the rewrite had dropped the section's fold
  (`useSettingsSection`); back, with the section in the accordion test.
  Owner questions in the run's `handoff.md`: a row that opens Settings
  instead of a path in words; Android's declined page saying the app asks
  again.
- **The tool:** `mm build ios [--release]` (simulator, no signing),
  `mm run --ios [-d UDID]`, `mm simulator [name | udid | list]`,
  `mm screenshot -d UDID` through simctl, `mm clean` removes the iOS
  build; `MM_SIMULATOR` names the default. Tests in `tool/test/simulators.test.ts`.
- **Verified:** the shell builds and launches on the iPhone 17 Pro Max
  simulator (iOS 26.3.1); a demo-seeded build wrote the whole seed through
  `MmDb` (schema version 9, 281 food entries, 71 weigh-ins, integrity ok)
  into `Library/Application Support/databases/martian_macros_demo`, marked
  excluded from backup, and a plain build opened the same file. `mm check`:
  all checks passed (2,869 web tests). **Not verified:** anything on a
  phone; a pack download on iOS; a reminder at its time; the camera (the
  simulator has none, so only the refusal path runs); a Health reading
  imported (the simulator's Health app cannot be driven from the command
  line); the stories in a browser, in any palette, which the owner's
  `mm storybook` look covers.
- **Roadmap:** WS-03 step 20 (MM-403, MM-407 built), WS-14 step 5
  (MM-404), WS-09 step 13 (MM-405), WS-08 step 13 (MM-406) added; WS-11
  step 7 (MM-69) started. Each plugin ticket stays in progress until its
  phone check; the hotspot `HS-ios-shell` serializes edits to the Xcode
  project.
- Housekeeping on the Mac, outside the repository: Node 22 (nvm), Temurin
  JDK 21, the Android SDK for API 36 and the `Pixel_8_API_36` emulator,
  DuckDB, all user-level; Homebrew's `/usr/local/Cellar` still belongs to
  another account on that Mac, so `brew install` fails there.

## Session 36: 2026-10-18, Claude (anti-cruft: lines that narrate the layout)

- The owner, on the empty Food screen: "Nothing logged yet. Start with
  breakfast." is cruft that fills white space, AI slop; have the UX and
  Product roles inspect the app. The line was prescribed by
  `design/screen-direction.md`, now corrected; the anti-cruft doc gains a
  "No narration" limit.
- **Panel run:** `docs/agent-runs/mm389-anti-cruft/` (product and UX audits
  of the whole app; the product designer PASS and the UX guard PASS after
  its one blocking finding on a test was fixed).
- **Built:** MM-389 (seventeen narrating lines cut or rewritten, folds over
  empty sections gone, a stale fold forgotten, the arc no longer spoken twice),
  MM-390 (a past day heard as today in three places). Opened: MM-391 (one
  route to the check-in on Coach) and MM-392 (the unmarked day's subtitle,
  pending the coaching and safety roles).
- **Say if any is wrong:** Train keeps its one reason line; Progress says
  "No trend yet."; "Encrypted backup is coming" removed from Settings.
- Incident: a scratch worktree linked to `apps/mobile/node_modules` was
  removed with git, which deleted part of the real install through the
  link; `npm ci` restored it. Nothing in the repository was affected.
- Roadmap: WS-03 step 18 added (MM-389 to MM-392).
- **Then, by message:** the owner logged biscuits and saw only the portion
  check, not the protein line that also held: "It should show multiple."
  MM-362's "one insight per item" (a choice recorded for the owner to
  overrule) is gone. MM-393: every rule that holds on an item shows its own
  line, the higher priority first, under foods, lifts and the Dashboard's
  rows. Reviewed in `docs/agent-runs/mm393-several-insights/`, where both roles
  passed it. WS-09 step 12.
- **Found while verifying:** three workout stories failed `npm run unseen`
  (the covered story run in `mm check`) on main itself on this machine: their
  walks waited the default second. MM-394 sets five seconds for every walk
  in the story suite, as `pressNamed` already did. WS-03 step 19.
- **Then, from a phone screenshot:** the Steps row read "28 readings from
  com.android.healthconnect.phone.j0716…" and ran out of the card. MM-395: the
  plugin names a source by its app label; no name is counted, never shown
  as the package; list rows wrap long words. WS-11 step 11.
- **Then, on branch `feat/net-carbs`, by message, all on one branch at the
  owner's word:** net carbs, on by default and everywhere carbs show, net =
  total − fiber − sugar alcohols (MM-396); sugar alcohols carried through
  pack format 3, the label reader, saved foods and the phone's store
  (schema 9), with an EU label's carbohydrate made a US total at build time
  (MM-397); Settings as an accordion, closed by default (MM-398); a folding
  section's heading moved outside its button (MM-399); the page that
  scrolled the frame away, found by measuring a story at 2,500 px on a
  915 px screen (MM-400); "Your own amount." and a filler guard in the
  voice test (MM-401); one spacing rhythm around folding groups (MM-402).
  Reviewed in `docs/agent-runs/mm396-net-carbs/`. The first pack build in
  format 3 is the owner's; format 3 packs must not be published before the
  app that reads them (an older app now skips them). WS-08 step 13, WS-03
  step 20.

## Session 35: 2026-10-18, Claude (the grade of the app's own; a third source, the reliability score, concurrent downloads)

- The owner withdrew the published grading tables ("not what I asked you to
  build") and chose, through the question tool: nutrient density per calorie
  with the vitamins and minerals; calories, macros, fiber and sodium
  required; the grade unnamed; run end to end. Then by message, no questions:
  add a food data source with the panel, derive a reliability score and
  order search by it (the scan ranking the author's), enable concurrent
  pack downloads, make the download button an icon.
- **Panel runs:** `docs/agent-runs/mm380-proprietary-grade/` (nutrition,
  micronutrients, measurement, integrations on the draft method and the
  pack question; all "build with the listed changes") and
  `mm383-sources-and-downloads/` (integrations, product, react-capacitor on
  the source, the score and the downloads; product designer and UX guard on
  the renders). Every reconciliation is in each run's `decision.md`.
- **Built:** MM-380 (the method, `docs/food-grades.md`, 61-food calibration
  set, 23 register rows), MM-382 (the engine, the popover's "not counted"
  sentences), MM-381 (`docs/food-packs-data.md`), MM-383 (FNDDS wired, the
  reliability score, search order, the build-time conflict policy, one name
  one food, the build gate, coverage per source, CC0 terms), MM-384
  (concurrent downloads, the icon, a card and a strip line per download),
  MM-385 and MM-388 (bugs found by the panel, fixed with failing-first
  tests), MM-386 and MM-387 opened (the catalog re-open leak; streaming to
  the file natively).
- **Measured** on the published packs with node:sqlite: 89.9% of common
  foods and 82.8% of barcode foods grade today on the new method.
- **Not done:** a real pack build (DuckDB not installed; sources not
  downloaded), so FNDDS and the coverage shares are unmeasured until the
  owner runs the commands; paging in search (MM-42) as FNDDS enlarges the
  generic block; an added-sugars column (format 3) that would retire most of
  the sugars waiver.
- Roadmap: WS-08 step 12 added (MM-380 to MM-388).
