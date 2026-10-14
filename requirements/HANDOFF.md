# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-13, by Claude, Session 23.

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
`currentSchema.ts` and `migrationSteps.ts`, with their tests (version 2
since MM-242). Only one schema change at a time.

**The engineering rules are checked (MM-246, MM-261, MM-278).**
`test/architecture.test.ts` fails the suite on a file with two declarations
or the wrong name, a library imported outside the folders it lists, a raw
control in a screen, a native date, time or select control anywhere, a
`<button>` outside its homes, a composite that writes a control, a
component prop named `color`, `className` or `style`, or a screen that
draws a row's chevron; `MmPressable` is the component for content pressed
as a whole.

**Next ticket ID.** `mm req next` is the authority (MM-283 at this writing).

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
- WS-03 step 9: MM-253 (the hierarchy direction and the panel pass), then
  MM-254 to MM-259, each destination rebuilt with before and after stories.
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
Nothing is built yet.

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

## Session 23: 2026-10-13, Claude (the whole of MM-262 built: nothing native shows)

- The owner's instruction at the start: "You better aim higher than a
  couple components. I want the whole thing... NOW!" So the
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

## Session 22: 2026-10-13, Claude (the roadmap caught up and checked, MM-245)

- The owner asked how the roadmap looked. It was derived on 2026-10-09 and
  knew tickets only to MM-191: 79 tickets (the React conversion, Storybook,
  the expert panel, the terms of use) were in no workstream, seven done
  tickets were listed as remaining, its "start here" table pointed at MM-61
  and MM-160, and the file paths were the Dart packages'. The working
  agreements asked for the handoff to be kept, and said nothing about the
  roadmap.
- The owner's rule: agents keep the roadmap up to date, always, and at the
  end of a session check whether they moved the needle. It is now a working
  agreement in `AGENTS.md` and in the Completion section, and `mm req`
  checks the roadmap against the tickets (`tool/src/roadmapChecker.ts`,
  nine tests): placement, built/remaining by status, steps, edges,
  `dependsOn`/`unlocks`, cycles, milestone lists.
- The catch-up: every ticket placed (new steps: WS-01 5 and 6, WS-14 4,
  WS-03 7 and 8, WS-08 9, WS-10 8, WS-02 8), built/remaining and workstream
  states derived from status, milestone lists regenerated from the steps,
  paths translated to `apps/mobile/src`, the README's "available now" and
  "do not touch" rewritten for 2026-10-13, the progress page regenerated.
- Then the first item of that table, WS-14 step 4: the TypeScript
  architecture checker (MM-246, `test/architecture.test.ts`): one
  declaration per file named for it, libraries only in their adapter
  folders, no raw control in a screen. Twelve files were split to meet it
  (`schema.ts` is now `currentSchemaVersion.ts`, `currentSchema.ts`,
  `tables.ts` and `Table.ts`), `MmPressable` replaced the three raw buttons
  in `CalorieHero` and `MealSection`, and `columns.ts` is the one file on
  the baseline.
- Then the leftovers the table named: `mm run --env phone` installed and
  launched the demo app on the owner's Pixel (the normal app untouched;
  the phone was locked, so the screen was not seen), MM-175 and MM-229
  closed, MM-7 closed (CI green on every pull request since the switch),
  MM-245 closed. MM-229's screenshot tests are superseded by the stories
  test under the owner's Storybook rule.
- MM-181 (the flat floating action) closed: the React rebuild never had the
  glow; `test/ui/flatFab.test.ts` now guards it by reading the stylesheet.
- MM-177 closed: `mm demo --seed -d <id>` builds the shell with
  `MM_DEMO_SEED=1`, and `src/app/seedDemo.ts` replaces the demo app's data
  with `DemoSeed` on every launch of such a build, inside the shell only,
  then the DEMO strip shows. A normal build never carries the variable
  (`tool/test/webBuildEnv.test.ts`, `test/app/seedDemo.test.ts`).
- MM-88 (the store-trial spike, WS-13 step 1) answered from the stores'
  pages, read 2026-10-13: Apple's "XX-day Trial" zero-priced non-consumable
  is current guideline 3.1.1 with a three-part disclosure; Google Play has
  no trial for one-time products (buy, rent, pre-order and discount only),
  so Android times the trial on the device and a reinstall restarts it;
  the plugin is the owner's call (our own over StoreKit 2 and Billing 9 is
  the recommendation; Capgo's is the fallback). Nothing is built.
- MM-65 (the backup-rules spike, WS-12 step 1) answered from Apple's and
  Google's pages, read 2026-10-13: guideline 5.1.3(ii) has no encryption
  exception, so no iCloud (or Drive) provider; the database and packs are
  excluded from OS backups on both platforms (Android already is); the
  backup is one encrypted file the person places (MM-63, MM-64). Open:
  encryption at rest for the database, which Play's health guidance asks
  for and nothing provides.
- MM-139 closed: the confidence next step and data boundaries are now
  simulator-validated on a hundred users per logging habit
  (`test/engine/coachConfidenceBoundariesSimulation.test.ts`); nothing was
  tuned. M1 is 12 of 13; MM-138 (holding a reduction) waits on the owner.
- The owner answered every open decision in a wizard of questions (the
  list under "Decided by the product owner" above); MM-138 and MM-103
  closed on those answers, MM-135 moved to in-progress with its decision,
  and MM-247 and MM-248 were opened.
- The owner asked why sleep was not first class, and ruled that it is.
  Written as WS-15 with MM-249 (epic, with the evidence read today),
  MM-250, MM-251 and MM-252; placed in M2.
- The owner's diagnosis of the views' hierarchy, checked against the
  register and written as MM-253 (the direction and the panel pass) and
  MM-254 to MM-259 (each destination), WS-03 step 9, M2.
- MM-260, from the owner's screenshot of the Date of birth dialog: the
  phone's date control now follows the palette (`color-scheme`), its
  picker indicator has a margin, the dialog has an outline and a shadow,
  and the day is said back in words or the allowed range is. A story
  (Settings, DateOfBirth) and a test guard it. Every other dialog gains
  the outline and shadow with it. Seen again on the phone: Android's own
  date control ignores padding and the indicator pseudo-element, so
  `MmPickerField` now hides the platform's drawing entirely and carries
  the design system's box and chevron; the time dialog uses it too. The
  lesson, for every native control: the platform draws nothing.
- The three reviewers' reports came back (74 findings; saved under
  `docs/agent-runs/mm253-components/`), the owner answered the decisions
  they raised and ruled that nothing native shows, and the findings became
  MM-262 (epic) and eighteen tickets: three custom pickers, the checkbox
  and slider drawn by us, pressed states, menus, overlays, the snack,
  stories for every component and state, tokens, the focus ring, Ember
  tint and glyph, the sheet and cards, composites and the checker, field
  errors, the destructive kind, 48 dp, the written system. Nothing of it
  is built yet; WS-03 step 10 is the next code, pickers first.
- MM-261: why it took the owner three prompts to get a component. The
  architecture check exempted `src/ui/`, so a raw control could live in a
  dialog or the overlay host. Now each native control kind has one home
  (`controlHomes` in `test/architecture.test.ts`), composites write no
  control, and `MmOption` replaced the overlay host's inline option button.
  The panel's product-designer, UX-accessibility and React-Capacitor roles
  were put on the whole component register the same hour (MM-253's
  component walk); their findings become bug tickets with tests.
- Moved the needle: **M1 closed** (13 of 13: MM-138 was its last). M0 went
  from 39 of 47 to 44 of 48 (MM-108, MM-176, MM-179, MM-183 remain); M2
  gained MM-7, MM-175 and MM-177; M3 gained MM-88 and MM-65, and two new
  tickets (MM-247, MM-248).
- MM-103's leftover, one question per onboarding screen, is a design
  change the owner should call: measurements, training and the health
  check each hold several related fields on one screen today.
- Not done: the workstream files' prose still describes the plan as
  written in October's first week; only their sources and sequences carry
  the additions. The 58 in-progress tickets were not walked; many are built
  with a leftover and could close.

## Session 21: 2026-10-12, Claude (the switch out of Flutter, MM-232 step 5 and 6)

- Step 5 in two merged PRs (#129, #130): five Kotlin plugins in the shell
  (`MmDb`, `MmPacks`, `MmReminders`, `MmScanner`, `MmHealth`) behind the
  interfaces the app already had, TypeScript adapters in `sql/native/`,
  `foodCatalog/download/native/` and `platform/`, `openAppServices`
  branching once on the shell, the hardware back button, `minSdk` 26.
  The `SqlDatabase` contract runs against the native adapter over a fake
  bridge; `healthSourceContract` runs against `NativeHealthSource`; the
  Dart `health_connect_sample_test` is ported. Everything above was
  exercised on the emulator end to end.
- Step 6 (this PR): the Dart task runner is rewritten in TypeScript
  (`tool/`, run by Node 22.18+, zero dependencies), with `req`, `panel`,
  `ci`, `roadmap`, `food`, `run/demo/emulator/build/clean`, `check`; its
  Dart tests are ported to `node:test` (140 pass). `apps/mobile`,
  `packages/`, `.fvmrc` and the goldens workflow are deleted; CI runs on
  Node and assembles the debug APK; `coverage.json` lists the React
  sources; the evidence register and docs now name the TypeScript files.
- Late in the session the owner rejected the hand-drawn nav icons
  ("hammers tangled together") and ruled: standard Material icons
  (MM-236) and Storybook as the design register, replacing the HTML
  register entirely (MM-237). Both shipped the same day; screen stories
  remain MM-237's open step.
- The pack build keeps DuckDB extract + the TS pipeline
  (`mm food build` drives `apps/mobile/scripts/food-build.mjs` through vite).
