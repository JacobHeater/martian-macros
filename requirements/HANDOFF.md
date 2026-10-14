# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-14, by Claude, Session 25.

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

**Database.** The React app's schema is `apps/mobile/src/data/currentSchemaVersion.ts`,
`currentSchema.ts` and `migrationSteps.ts`, with their tests (version 3
since MM-254: `macro_picture`). Only one schema change at a time.

**The engineering rules are checked (MM-246, MM-261, MM-278).**
`test/architecture.test.ts` fails the suite on a file with two declarations
or the wrong name, a library imported outside the folders it lists, a raw
control in a screen, a native date, time or select control anywhere, a
`<button>` outside its homes, a composite that writes a control, a
component prop named `color`, `className` or `style`, or a screen that
draws a row's chevron; `MmPressable` is the component for content pressed
as a whole.

**Next ticket ID.** `mm req next` is the authority (MM-298 at this writing).

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

**What to build next** (the roadmap's "What is available right now", in
order; `mm roadmap` draws it).
- WS-02 step 6: MM-135, the diet break the owner decided (offered at 12
  weeks and on failing recovery signals, forced at 20); an engine change.
- WS-03 step 12: MM-297 (the disabled primary reads as a field in Light;
  Storybook and the panel first), and the owner's two questions in
  `docs/agent-runs/mm291-weigh-in/decision.md` (the weigh-in below the fold
  at 360 by 740; the trend before and after the weigh-in).
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
- Moved the needle: **WS-03 step 12 placed and mostly built** (MM-290 to
  MM-296 done, MM-297 proposed). Available next: as before, plus MM-297.

## Session 24: 2026-10-13, Claude (the hierarchy rebuild with iconography: WS-03 step 9 built)

- The owner's instruction: "I want the hierarchy rebuild with iconography."
  MM-253 to MM-259 were built in one branch, with the panel pass first.
- **The panel pass (MM-253).** The product-designer and UX-accessibility
  roles graded the six destinations as built on `main` at `9fb8c79`
  (first-viewport renders in Martian and Light, source for the rest):
  28 and 25 findings, every one with an outcome in
  `docs/agent-runs/mm253-hierarchy/decision.md` and `state.json`
  (`mm panel` validates the run). Folded into the build: the confidence
  word labelled, never alone; a heading in the hero; the completeness
  control as a row after the last meal with the mark in the header; method
  icons beside their word; one sentence of uncertainty kept with the trend
  chart; the held or settling estimate said in the folded line; the
  safeguards above the hero and outside the one-thing rationing; the Save
  that waits for a change; dates in words; no default event type; a
  Dashboard named Dashboard; the star, not a trophy, for a record; both
  strips the rolling last seven days. Three bugs became tickets with
  regression tests (MM-283 the coach line, MM-284 the unit heard, MM-285
  event dates and default). Left for later as WS-03 step 11: MM-286
  (destinations keep their state; the Food primary first in focus order),
  MM-287 (one figure, lift rows), MM-288 (the Ember budget for text
  actions, the owner's call), MM-289 (a demo seed that shows every mark).
  Owner decisions still open, listed in `decision.md`: PD-2 Ember text,
  PD-9 whether the arc leaves Coach (MM-187 stands), UX-24 numeric
  settings as sheets, the meal glyph family.
- **The direction** is the first section of `design/screen-direction.md`:
  eight rules, what sits outside them, what "one tap down" means, the
  first-viewport budget per destination, empty states, and the
  before-and-after table. `test/gallery/hierarchy.test.tsx` makes rules 1,
  4 and 6 checkable on every destination story.
- **The design system.** `MmSection` (icon, heading, summary, trailing
  action; folds with `collapsible`, keeps state with `maintainState`, or
  opens a screen with `onPress`), `MmRhythmStrip` (seven named dots, full,
  half, empty, today ringed; buttons when `onSelect` is given, listed in
  `buttonHomes`), `NumberEntry` (the bare field; `NumberEntryCard` is
  gone), `MmSwitchRow leadingIcon`, `MmDropdown placeholder`,
  `MmTextField` describing its suffix, thirty-five meaning names in
  `MmIconName`, `.mm-section` and `.mm-rhythm` in `ui.css`. The macro
  picture is a preference (`MacroPicture`, `user_preferences.macro_picture`,
  schema version 3, in-memory and SQL repositories, the contract test).
- **The screens.** Dashboard: hero with the Grams/Share switch, the rhythm
  strip (`rhythmDays`), streak row, insight section, rows for weight,
  waist, next check-in and training, the weigh-in in place only on a day
  without one, the history behind "More about this week". Food: meals as
  sections with icons, method icons on rows, the completeness row and the
  header mark, "More about today". Coach: safeguards first, the hero with
  the check-in and the confidence word, `OneThingRow`, eleven sections
  (recovery and reports folded when quiet). Progress: one hero with the
  weigh-in and the trend, events as rows with icons and an add button in
  the header, Waist and Strength folded. Train: one primary, the strip
  (`trainedDays`), the volume section, `workoutGroups` by week and month
  with a star for a record. Settings: seven sections of rows with icons,
  choosers through the options dialog, erase last.
- **Tests.** The suite is 2,145 with the new ones (`hierarchy`, `section`,
  `rhythmDays`, `workoutGroups`, `weightEvents`, the unit, the coach line);
  `test/support/dashboardLoaded.ts` replaces the "Logging coverage"
  sentinel (the history is one tap down); `failsFirst` now fails until
  `recover()` is called, because the Dashboard's rows read the workouts
  before a later screen does.
- **Looked at** in a headless browser from the static Storybook: the six
  destinations at 412 by 915 in Martian, Light and Dark. Not looked at:
  below the first viewport (the frame is fixed to the phone's height, so a
  tall capture shows the same 915 px; the tails were walked by the tests),
  anything on the phone, 200% text, the donut legend's contrast on the hero
  (the chair's measurement is still owed, with the two from Session 23).
- Moved the needle: **WS-03 step 9 done** (seven tickets plus three bugs);
  **WS-03 step 11** placed (four tickets); M2 gained fourteen. Available
  next: WS-02 step 6, WS-03 step 11, WS-15.

## Session 23: 2026-10-13, Claude (the whole of MM-262 built: nothing native shows)

- The owner's instruction at the start: "You better aim higher than a
  couple components. I want the whole fucking thing... NOW!" So the
  eighteen tickets of WS-03 step 10 (and MM-278 in WS-14) were built in one
  branch, each with its regression test, and the epic MM-262 is closed.
- **The pickers.** `MmDatePicker` is a month grid (`role="grid"` of
  `MmCalendarDay` cells, a year list of `MmOption`, previous and next
  month, arrow keys across months, a swipe) inside `MmDateDialog`, which
  says the day back or the range. `MmDrum` is a snapping column that is a
  spinbutton to the keyboard (arrows, Page keys, typed digits);
  `MmTimePicker` has Hour and Minute drums, Second when asked, and AM or PM
  as a segmented control; `MmTimeOfDayDialog` takes a range and refuses a
  time before OK (the reminders screen's refusal after the fact is gone);
  `MmClockTimeDialog` is drums too, so nothing typed can be invalid.
  `MmPickerField` is now a field-shaped button with the value in words and
  our chevron (the onboarding birth-date step uses it). `MmDropdown`
  renders no `<select>`: it composes `MmPickerField` and opens
  `overlays.options`. `controlHomes` gives date, time and select no home.
- **Every control drawn.** `.mm-checkbox` and `.mm-slider` have
  `appearance: none`; the box, the tick, the track, the fill and the thumb
  are ours; `MmSlider` requires `label`. The pressed family at the foot of
  `ui.css`: every `cursor: pointer` selector has an `:active` rule and a
  `.mm-pressed` twin. Inset focus rings inside clipping containers. The
  add plate is `--selected` with an Ember plus; the chip's check is
  `MmIcon`. Chips 48 dp. Sheet on `--raised` with the sheet-top radius and
  the Light shadow; cards carry the Light shadow and the Dark highlight.
- **Overlays.** The app root is `inert` while an overlay is up; Tab is
  trapped; Escape closes from anywhere; the options dialog has Cancel; the
  sheet has Close and a handle that drags it away; `EditHeightSheet` says
  its range and has Cancel. A menu is `overlays.menu`, drawn at the
  trigger's anchor (`MmMenu` of `MmMenuItemRow`) so a row cannot clip it;
  Settings' daily activity and experience are `overlays.options` with the
  value marked Chosen. A confirmation draws the destructive action quiet
  (`kind="destructive"`) and Cancel secondary. A snack with an action waits.
- **The register.** Design system/States (every control at rest, pressed,
  disabled, selected, in error; focus by play) and Design system/Overlays
  (every overlay on its own). The stories test fails a component of
  `src/ui` that no gallery file imports. Settings/ChangeDailyActivity and
  Food/EntryMenu stories added.
- **Tokens and the checker.** `--motion-*` tokens, `--space-20`,
  `--radius-check` in `tokens.css`; `test/ui/stylesheetTokens.test.ts`
  fails a literal radius, duration, gap, undeclared property or hex colour
  in any sheet. The architecture test derives composites, lists
  `buttonHomes`, balances braces, and fails a `color`, `className` or
  `style` prop and a screen-drawn chevron; `MmListRow opens` draws it;
  `StatusRow` is gone; `MmProgressBar` takes `kind` and `weight`.
- **The written system.** `design/design-system-implementation.md` is the
  React library's document; `visual-language.md`'s icon sentence is the
  Outlined-only decision.
- Test helpers for the pickers: `test/support/pickers.ts` (`chooseDay`,
  `pickDate`, `turnDrum`, `turnClock`, `pickTime`); `time.ts` and
  `openSettings.ts` use them.
- Moved the needle: **WS-03 step 10 done** (17 tickets) and MM-278 in
  **WS-14 step 4**; M0 gained MM-278 (45 of 48); M2 gained the seventeen
  (MM-263 to MM-282). Available next: WS-02 step 6, WS-03 step 9, WS-15.
- Not done: the chair's two pending verifications from the component walk
  (200% text in segmented controls and menus; the light palette's field
  border contrast) are still owed; nothing was looked at on the phone.
