# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-14, by Claude, Session 27.

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

**Next ticket ID.** `mm req next` is the authority (MM-320 at this writing).

**The register is complete (MM-237, done).** Every screen, sheet and step
has a story under `apps/mobile/src/gallery/screens/`: the whole app as
shipped over in-memory stores on a fixed day, in a phone's viewport, opened
at that screen (`screenStory({ covers, shows, open, walk })`). A new
`*Screen.tsx`, `*Sheet.tsx` or `*Step.tsx` with no story fails
`test/gallery/stories.test.tsx`, which also draws and walks every story.
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

**Waiting on the product owner.**
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

## Session 27: 2026-10-14, Claude (water, sodium and micronutrients: MM-305 built)

- The owner pasted new food tracker requirements: track water, track
  micronutrients, configure a sodium goal, and show micronutrients on the
  nutrition card as a third choice beside Grams and Split. **New working
  agreement: every question to the owner goes through the interactive
  question tool, never as a list in chat.**
- The owner answered sixteen questions, then four more after the panel
  (all recorded in MM-305 and each story): the micronutrient non-goal is
  **overruled** (MM-306); minerals and key vitamins plus the label's
  sugars, saturated fat and cholesterol; totals with a reference marker
  and coverage; **Micros on the Food screen only**; a sodium limit off by
  default, 2,300 mg suggested, **1,500 mg minimum**, with a coach line;
  water by glass, bottle or typed amount with an optional **goal** (the
  word kept; glossary amended), up to 6 L with a note above 4 L, plain
  water only; written to Health Connect later (MM-314, waits on MM-70).
- **Story, panel, build (MM-293).** Drawn in Storybook, reviewed by the
  product-designer, UX-accessibility, micronutrients, coaching and safety
  roles (`docs/agent-runs/mm305-water-micros/`, every finding's outcome in
  `decision.md`); the UX guard passed on a re-review of the new states.
  Blocking findings resolved: the long Micros card (owner: Food only) and
  the sodium insight reaching an eating-disorder history (now suppressed,
  MM-141). The owner caught the sized water buttons wrapping mid-unit
  after the review; redrawn and looked at in three palettes.
- **Built:** MM-306 to MM-313, bugs MM-315 ("share picture"), MM-316 (Micros
  said "today" on a past day), MM-317 (focus lost after another amount).
  Schema version 4 (micronutrient columns on entries and own foods, the
  goals and the day the limit was set, `water_entries`); pack format 2
  (reads format 1); `extract.sql` maps USDA ids and Open Food Facts
  (vitamin A and folate left unknown there); label reading of the
  mandatory lines; the sodium insight; eleven evidence-register rows.
- **Branch** `feature/water-sodium-micronutrients`, **stacked on #158**
  (green; merging it was refused by the session's permission classifier,
  so it waits for the owner).
- **Not verified:** the phone, TalkBack, 200% text; a real pack build (so
  the coverage MM-306 asked about and the pack's size are unmeasured).
- **The water section, corrected (MM-318, MM-319).** The owner on the
  Food screen: why is Water not an accordion like the others? It was a
  card of buttons the chair invented without opening `MealSection`. Now a
  section like the meals: "+" opens Add water, a drink opens Edit water,
  rows swipe away; reviewed against the meals (UX guard pass,
  `docs/agent-runs/mm318-water-section/`). Rule 9 written. MM-319: water
  added to a past day said today's time; it says "Added later".
- **Roadmap:** WS-08 step 10, WS-04 step 7 and WS-09 step 9 built; WS-11
  step 9 (MM-314) waits on MM-70.

## Session 26: 2026-10-14, Claude (the waist measured on the Dashboard; snacks above the bar)

- The owner, on his phone: the Dashboard's rows that are windows into a
  measurement should take it without another screen, the waist among
  them, and the confirmation should offer the other screen. Mid-session:
  "Toasts should always display above the nav bar."
- **Story, panel, build (MM-293).** The waist row drawn in
  `Screens/Today` (Not Weighed Today, a new Waist Due), reviewed by the
  product-designer, UX-accessibility and measurement roles; every
  finding's outcome is in `docs/agent-runs/mm301-waist-in-place/decision.md`.
- **Built.** MM-301: the waist row asks in place when no measurement in
  the last 7 days (the reminder's window), one reading through the shared
  `saveWaistReadings`, a secondary Save heard as "Save waist" (`MmButton
  name`, `NumberEntry saves`/`saveKind`), MM-155's conditions in the
  hint, values to the quarter inch, "Waist saved: 36 in" with "Open
  Progress" (the weigh-in's snack too). MM-302: the snack above the
  navigation bar, and Food's Add food above a snack. MM-303:
  "That value looks off" only for a refusal (`FormatError`).
- **Stories added:** Waist Due, Waist Typed, Waist Refused, Both Typed,
  Weigh In Saved, Waist Saved (Today) and Entry Removed (Food), each
  looked at in the three palettes at 412 by 915. Headless captures freeze
  the snack's rise animation half-way; stop animations in the capture
  frame to see it as shown.
- **Left:** MM-304 (proposed). Not looked at: the phone, TalkBack.
- **Roadmap:** WS-03 steps 13 (built) and 14 (MM-304) added; M2 moved by
  MM-301 to MM-303.

## Session 25: 2026-10-14, Claude (the owner's phone review: Split, the weigh-in in its card, Storybook first)

- The sitrep, then the owner's review of the Dashboard on his phone: the
  switch said "Share" where the word is "split"; on a morning before the
  weigh-in the field floated on the canvas with no padding and the waist
  card touched its hint; and Storybook had no story of that state, which
  he read, rightly, as the screen not being designed in Storybook. His
  rule, now MM-293 and in `AGENTS.md`: story, inspect, panel, then build.
- **In that order.** `Screens/Today/Not Weighed Today`
  (`notWeighedTodayScenario`) reproduced the phone's layout in Storybook
  first (MM-292). The proposal (the weigh-in as the first row of the
  Dashboard's list group, the slot the trend row takes once saved) was
  drawn in the same story and reviewed by the product-designer (approve
  with changes; two blocking documentation findings) and UX-accessibility
  (guard pass). Every finding's outcome is in
  `docs/agent-runs/mm291-weigh-in/decision.md`; `mm panel` validates it.
- **Built.** "Grams | Split" (MM-290), with equal segments in every
  `MmSegmented`; `MmListRow entry` (a row that holds a control, icon level
  with the title) and `WeighInRow` (MM-291); the streak row moved into the
  group as its last row; rule 1 and rule 4 of `design/screen-direction.md`
  amended; `hierarchyProblems` fails a bare field and checks Not Weighed
  Today with the destinations. From the UX guard: the save says "Saved
  181.4 lb for today" through the snack's status (MM-294); the hint is in
  the field's description (MM-295, `MmTextField describedBy`); Enter saves
  (MM-296, `MmTextField onSubmit`). MM-297 (the disabled primary in Light)
  is proposed, for Storybook and the panel first.
- **Tests.** Six new or changed tests, each failing on `main`'s source
  first: the switch, the row in the group, the saved status, the hint
  described, Enter saves, and the bare-field rule on the new story.
- **Looked at** from the static Storybook: Not Weighed Today in Martian,
  Light and Dark at 412 by 915 and Martian at 360 by 740 (the row starts
  under the fold there: an owner question); the demo Dashboard; Pause,
  Recovery check-in and Workout for the segment change. Not looked at:
  the phone, TalkBack, 200% text.
- **A slip, recovered:** a backup made with `tar` to a `C:` path failed
  silently (tar reads `C:` as a remote host) while seven source files were
  swapped to `main`'s to prove the tests fail first; the edits were
  re-applied from the session's scripts and the suite re-run. Copy files
  to back them up, never tar to a drive path in Git Bash.
- **The owner's answers, built the same session** (second panel run,
  `docs/agent-runs/mm298-trend-goal-themes/`, guard pass): small phones
  (360 by 740) are not designed for (rule 7 says so); the weight row says
  "Trend so far 189.6 lb" before the weigh-in and "Trend 184.1 lb" with
  "Today 183.9 lb · 7 days −0.6 lb" after it, the first weigh-in shown once
  (MM-298); the goal is the first section of Coach under the hero and its
  warnings, with "Change goal" (MM-299, story `Screens/Coach/Check In
  Due`); a disabled primary or secondary has no fill, an outline at 16% and
  a label at 38% of `--text` in every palette (MM-297), with Disabled cells
  in the States story and a token test holding the field border at 3:1.
- **Live reload (MM-300, PR #157):** `mm run --live` on the emulator, found
  and fixed on the way: Vite on "localhost" bound only `::1` (adb reverse
  got an empty response), and Capacitor's bare `gradlew` failed under the
  agent shell's `NoDefaultCurrentDirectoryInExePath`. WS-01 step 7 built.
- Moved the needle: **WS-03 step 12 built** (MM-290 to MM-299). Available
  next: WS-02 step 6 (MM-135), WS-03 step 11, WS-15.
