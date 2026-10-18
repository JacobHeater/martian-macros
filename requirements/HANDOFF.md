# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-17, by Claude, Session 33.

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

**Coaching insights inline (MM-361).** The framework is built (MM-362, MM-363,
MM-364) with one kind, training's "volume jump" (MM-366). A drafted kind
joins `engine/itemInsightKinds.ts` only after its domain roles check it
(`docs/agent-runs/mm366-workout-rules/` is the pattern), with its evidence
rows. Next: the food catalog (MM-365) through nutrition, coaching and
safety; the grading spike (MM-369); MM-377 through measurement and
nutrition. `InsightPreview` is now only for what is not built (grades, and
the lines of unchecked kinds); `gallery/screens/draftInsightKinds.ts` holds
the drafts the Settings stories draw.

**Waiting on the product owner.**
- Coaching insights: no paywall for any of MM-361 to MM-371 (not behind
  MM-85). Open: hide "strength on fat loss" under the low-body-weight
  caution (MM-377, the panel's SA-6)?
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
  line under a lift, opened, and its Settings switch (MM-366, MM-364).
- The attorney (MM-242, MM-95) and the clinician (MM-29); the licensor's
  legal name and a contact address when they exist.
- Fifty pantry barcodes and the hand check of fifty products (MM-51).
- The merge of MM-247's workflow pull request, when it is opened.
- Unlocking the Pixel to look at the seeded demo app, and plugging it in,
  so the new pickers can be felt on glass (`mm run --env phone`, then
  Settings → Profile → Date of birth, and a reminder's time).

**Not verified anywhere.** iOS has never been built or run, and the shell
has no iOS project yet. Phone checks listed above. Tickets record
limitations.

## Session 33: 2026-10-17, Claude (coaching insights inline, built with the first kind)

- PR #179 (warmer Martian, grade fills, ion insights) was green and merged.
- The owner asked to start the build on the recommendation: the framework,
  Settings > Coach and the Coach tab list first, with the workout catalog
  checked by the panel. Branch `feat/inline-insights-framework`.
- **Panel on MM-366** (`docs/agent-runs/mm366-workout-rules/`): training,
  coaching and safety, all "build with the listed changes". "Holding steady"
  repeated or contradicted the progression suggestion and pushed on a cut;
  "strength on a cut" was undefined and praised the diet; the volume baseline
  did not exist. **Owner's rulings:** drop holding steady; a pattern line
  shows in its first week then rests 28 days; volume jump once a workout;
  strength on fat loss later (MM-377, new).
- **Built:** `ItemInsight`, `ItemInsightKind`, `itemInsightKinds`,
  `allowedItemInsights` (safeguards, switches, one per item); schema version
  7 (the switches in `user_preferences`, `inline_insight_log`); the
  repositories with contracts; AppState's `insightSwitches`,
  `insightSafeguards`, `itemInsights`, `inlineInsightLog`; Settings > Coach on
  stored switches (`InsightSwitchesDraft` gone; an area is listed once it has
  a kind); the Coach tab list from the log, a lift's entry opening its
  workout; `volumeJumpInsights` with `VolumeJumpRule` and `countHardSets`
  (weekly volume now counts with it); evidence rows and a test that a kind
  without one fails.
- Stories: the workout stories draw the line the app works out (the demo
  plus one chest day); CoachRecentInsightsLogged lists it from the log;
  CoachSettingsEveryArea draws every area with the drafts.
- **Food insights Q&A (2026-10-18), recorded in MM-365 and MM-378:** the first
  food set is mostly fat, light on protein and large portion (salty item out;
  low grade after grades); swap or add, never eat less; logged foods only;
  every qualifying line every time, with a **snooze** for one kind on one item
  (1 day, 1 week, 1 month, always), inside the opened line, Undo after, and a
  Snoozed list per area in Settings > Coach. The snooze applies to workouts
  too and replaces volume jump's automatic rest. Next: MM-378 drawn in
  Storybook for the designer and UX guard; MM-365's set to the nutrition,
  coaching and safety roles.
- WS-09 step 10: MM-362, MM-364 and MM-366 done; MM-363 in progress (a
  food's entry opening its day comes with MM-365); MM-377 added.

## Session 32: 2026-10-17, Claude (coaching insights inline, specified)

- The owner asked for a new feature, specified only (no code): **coaching
  insights inline** under the line item they are about, everywhere
  something is logged. The Coach tab stays. Asked in four rounds with the
  question tool; the epic is MM-361, with MM-362 to MM-371.
- **Owner's rulings (2026-10-17), all recorded in MM-361:** two bases, a
  pattern the item is part of or neutral single-item facts (the latter
  overrules MM-141's "never one day" for inline only). Every qualifying
  item shows its insight, not rationed. The Coach tab lists them too.
  Quieted only by switches under a new **Settings > Coach** page (master,
  area, rule). The existing safeguards apply. One line, expandable.
- **Foods graded A+ to D-** (MM-369 spike, MM-370 story): universal, per
  100 g, on entries, in search, and for each meal and day. A question mark
  with a popover when it can't be graded. **Shown with an eating-disorder
  history**: the owner chose this after the conflict with the food-insight
  safeguard was put to them, and food-composition *insights* stay off for
  that person. This overrules MM-144's grading non-goal and part of MM-108
  (MM-371, like MM-306).
- Rule catalogs in MM-365 to MM-368 are drafts with figures for the
  panel's nutrition, training, measurement and coaching roles; sleep
  (MM-368) waits for MM-250.
- Roadmap: WS-09 steps 10 and 11, WS-08's new last step (grades), all M4.
- **Then the designs** (owner: "do the designs now"), on
  `design/inline-insights-and-grades`, stacked on #177 (the merge of #177
  was refused by the permission check; left for the owner). Drawn on the
  **real screens** through a design seam, `coach/InsightPreview`: the
  screens read inline insights, grades, the Coach tab's list and Settings >
  Coach from a context the app never provides, so nothing shows in the app;
  screen stories hand in the design's figures (`screenStory`'s `preview`).
  When MM-362/MM-370 are built, `useInsightPreview` is replaced by engine
  output. New: `InlineInsight`, `RowWithInsight`, `FoodGrade` over
  `ui/MmGradeBadge`, `ui/MmPopover` (+ `Overlays.popover`), `FoodDayGradeRow`,
  `RecentInsightsSection`, `CoachSettingsSection`, `CoachSettingsScreen`,
  `CoachAreaScreen` (switches held in `InsightSwitchesDraft`, not stored).
  `screenStory` also takes `textScale` and `viewport` (`narrowPhone`, 320 px).
- Panel: product designer + UX guard, two passes; guard BLOCKED then PASS.
  Built from it: caption-size line, every badge explains itself, popover
  clamped (bug MM-372 + test), day grade out of the app bar into a row,
  workout line after "Last time", Recent insights folded, one word
  ("insights", "kinds"), "New best" dropped (Personal records already says
  it), "Large portion" off with an eating-disorder history. Older bugs the
  200% stories found: MM-373 (nav labels), MM-374 (Dashboard header, water
  row), tests skipped with their IDs.
- No step advanced: design only; MM-372 is done.
- **Then three owner asks** (branch `design/ion-insights-grade-fills-warm-martian`):
  the insight text and icon in `--ion`; grade badges filled per band
  (categorical: A mint, B sunflower, C periwinkle, D orchid; `--grade-*`
  tokens in every palette, an edge in light); and a **warmer Martian**
  (MM-375) researched by the product and product-designer roles
  (`docs/agent-runs/mm375-warm-martian/`). A plum was drawn and rejected
  ("maroon, not a 90's purple"); the approved neutrals are a royal violet
  with bigger steps, near-neutral secondary text, tangerine carbs, magenta
  fat, lime kept. `test/support/flutterTheme.json` updated knowingly for
  Martian. UX guard BLOCKED (pressed badge lost its letter: bug MM-376 +
  test) then PASS. The colour doc's contrast tests had never been carried
  over from Flutter; `tokens.test.ts` now holds text, ion, macro L* and
  grade letters in every palette.

## Session 31: 2026-10-16, Claude (the register's design defects through the panel)

- The owner: a load is said to a tenth, as a scale says a weight (MM-350, PR
  #169). They want the Storybook path continued: the design defects found by
  the register, and any backfill still needed.
- **Batch A, waiting, failed and empty states (MM-333, MM-334, MM-340), done.**
  Drawn, reviewed by the product designer and the UX guard, their changes
  built. One pattern for a failed read, `ReadFailedNotice` (screen-direction's
  Error state, now written there); waiting is `ScreenLoading`. MM-334 as
  written clashed with MM-183: a failed pause read keeps the day but withholds
  its targets, and the ticket now says so. The UX guard found Coach would spin
  for good when any record it works from failed; fixed with its test.
- **Batch B, sheets and Settings (MM-337, MM-338, MM-346, MM-347), done**, the
  same way. A notice on a sheet or dialog is a `sunken` well in every palette
  (the designer rejected a Light-only hairline); a failed change of the look
  is a snack with Try again; a pack at the listed version is not offered
  again. `storyPackHost` takes `listed` and `installed`. The panel's
  follow-ups are ticketed: MM-351 (a lookup's result is not announced), MM-352
  (the food database's rows have no icons).
- **MM-335, the Dashboard history, done.** "Days shown" then sections, each
  summary saying what the days add. Today, until marked complete, is an open
  dot off the line, left out of the averages and of the axis scale. A header
  that opens a tab is a button inside its heading, described by its summary
  and "Opens …" (`MmSection opens`). The owner chose a protein icon: a shaker
  bottle, drawn for the app (`ShakerBottleOutlined`, the one custom glyph).
  The recovery line outside its section was its own bug, MM-353, fixed.
- **MM-344 and MM-348, strength on Progress, done.** Each recent lift is a row
  ("Est. max 319.7 lb · +16.8 lb in 4 weeks") opening its history, where its
  chart lives; "Lift histories" is a list group with its own waiting and
  failure. A deleted exercise is "Deleted exercise · last logged Oct 11",
  never its id. MM-355 ("1 logged sessions") fixed on the way.
- **MM-354, the owner's split donut, done.** The split is always a centred
  donut, its figures beneath it; with nothing logged, a whole `--track` ring
  and "Log food with protein, carbs or fat to see the split.", as tall as the
  figures so the hero does not grow with the first food.
- **The owner saw "Entry Menu" without the water bar** (the demo person had no
  goal). Two decisions followed. Storybook gained a "Person" panel (MM-356,
  #175): each screen story's facts, read from its data. An audit of all 249
  screen stories with it is MM-357 (metric for no reason in 12, six goal
  amounts), still to fix. The water goal is now on by default (MM-358): a
  personal formula the owner chose from the panel's research (base by sex,
  + 7 mL per g of protein above 0.8 g/kg, + 500 mL x training days / 7,
  capped at 120 fl oz; withheld for kidney disease, bariatric surgery and a
  new health-check answer, "A clinician has told me to limit my fluids",
  MM-359). The coefficients are judgement, recorded in docs/evidence.md; a
  dietitian or clinician should review the bounds before release. Schema
  version 6.
- Still for the panel: MM-336, MM-342, MM-329, MM-351, MM-352.
  Not built: loading skeletons (the designer recorded the spinner as a known
  deviation, needing its own ticket).
