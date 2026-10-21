# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior; durable
rules live in the `AGENTS.md` files (root, `apps/mobile/`, `src/data/`,
`android/`, `ios/`), not here. Read only this section at the start of a
session.

## Where things stand

Last updated: 2026-10-20, by Claude, Session 40.

**How work is done now (owner, 2026-10-20; root `AGENTS.md`, "Usage").** No
local tests, checks or builds: CI validates. Small parallel branches, one PR
each. Subagents only when a role is required, five minutes in total per
session. This handoff is updated once per session, in its own small PR.

**Open PRs from Session 40**, each waiting on CI, then to be merged: #196
(MM-438, no Add food button; food is added from a meal's "+"), #197
(MM-439, recent foods as rows), #198 (MM-440, the iOS 15 build of the sleep
values), and this PR (the guide split and this handoff).

**What to build next** (the roadmap's "What is available right now", in
order; `mm roadmap` draws it). M2's buildable tickets are all done
(Session 39); what M2 still holds waits on people, listed there.
- The owner's to-dos for M2: a FoodData Central API key in
  `config/prod.local.json` (`MM_FDC_API_KEY`) so builds ask USDA as well as
  Open Food Facts; a pantry
  and fifty packages for MM-51's checks; a qualified reader for MM-57 and
  the terms (MM-242). Outside M2: the one-week break option (MM-432).
- Device passes owed: the native sleep readers (Kotlin, Swift), the online
  lookup through the shell's HTTP, TalkBack and VoiceOver
  (`design/accessibility-checklist.md` section 4), the largest system text.
- A pack rebuild (`mm food fetch`, `build`, `package`, then a release in
  martian-macros-food-data) puts MM-153's community tiers into the packs.
- WS-11 step 2 (MM-71), WS-13 step 1 (MM-95, MM-247, MM-244), WS-09 step 4
  (MM-248): the next milestone's work.
- MM-214 and MM-215 remain skipped in the web suite, each waiting on its fix.
- Blocked: phase planning (MM-36) needs body-fat estimates (MM-34).

**Decided by the product owner on 2026-10-13** (each recorded in its
ticket): the hold-a-reduction stays as built (MM-138 closed; M1 is
complete); the diet break is offered at 12 weeks and on failing recovery
signals, forced only at 20 (MM-135, built in Session 39); onboarding's
grouped screens stay grouped (MM-103 closed); the purchase plugin is our
own over StoreKit 2 and Billing 9 (MM-84); the terms guard stays first, the
legal blanks stay blank for the attorney, the four flagged behaviours stay
and are listed for review, the stores get the same text from one public
page on GitHub Pages (MM-242, MM-247); the privacy policy is drafted now
with the terms (MM-95); exact alarms are requested (MM-248); the rest timer
stays vibration only (MM-191); no helpline until a clinician reviews one
(MM-114); MM-51's pantry checks stay open (no online source of barcodes).

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

**Where the details are.** Coaching insights and grades:
`engine/itemInsightKinds.ts`, `docs/food-grades.md`, the panel runs under
`docs/agent-runs/`. Food packs and downloads: `docs/food-packs-data.md`.
Water, sodium and micronutrients: MM-305. Sleep as a signal: MM-249 (lesson
not yet in the panel protocol: an "emerging" grade on one trial is not a
grade; search before grading any evidence below "moderate"). Terms of use:
MM-242, a draft by non-lawyers that blocks release.

## Session 40: 2026-10-20, Claude (no Add food button, recent foods as rows, the iOS build, the usage rules)

- **The owner's words this session:** "Kill that button and food entry can only happen from the Food screen by clicking
  on the plus buttons next to the meals." Then, on usage: "You are not permitted to run tests. You write them, let CI run
  them on the PR." Subagent runs are capped at five minutes in total per session, and work goes in "small, rapid fire,
  short burst branches that all run in parallel in their own CI."
- **MM-438 (#196):** the Dashboard's bar action and Food's floating Add food button are removed. `MmFab` stays in the
  design system, unused by screens. The `openAddFood` test helper presses a meal's "+". MM-100 and MM-255 are marked
  superseded in part. The easy-to-miss chips stay (the owner's answer).
- **MM-439 (#197):** recent foods are `RecentFoodRow`s, five first and "More recent foods" for the rest, not a sideways
  chip scroller.
- **MM-440 (#198):** the iOS build failed on `asleepUnspecified` (iOS 16+) against the iOS 15.0 target. Fixed, and
  guarded by a test that reads the Swift source, since CI builds no iOS app.
- **The guide split (this PR):** a short root `AGENTS.md` with the usage rules, plus scoped `AGENTS.md` files (each with
  a `CLAUDE.md` importing it) for the app, the database and the two shells; this handoff is trimmed to state.
- **Not run:** nothing was run locally after the owner's rule. Before it, the iOS device build was checked once with
  `xcodebuild`, and the new food tests were run once to see them fail. CI validates all four PRs.
- **Roadmap:** WS-08 gained MM-438 and MM-439 as built; WS-15 gained MM-440. No milestone moved.
- **Follow-ups suggested to the owner:** `mm req add` to write and place a ticket in one step; CI that commits the
  regenerated progress page; auto-merge of green PRs (`gh pr merge --auto` needs the owner's permission rule).

## Session 39: 2026-10-20, Claude (M2 closed on feat/m2: food data online, sleep, the weight jump, the diet break, WS-03 and WS-08, history rewritten)

- **The owner's words this session:** "I do expect you to have a solution for the food data including additional
  sources. The present sources are in martian-macros-food-data. ... I expect this work to be done when I sign back on in
  the morning and the indication of done will be that we're back on main." Then, asked, "Yes, please rewrite the commit
  history, then continue on with other work."
- **History rewritten (owner's go-ahead):** two commits on `feat/m2` had carried `DEVELOPMENT_TEAM` in the Xcode project,
  the owner's local `.claude/settings.json` edit and a Vitest cache under a stray root `node_modules`. They were rebuilt
  without them (`535f71b`, `0ee0e75`) through a temporary index, and pushed with a lease. The root `/node_modules/` is now
  ignored. The old commits may stay reachable on GitHub by SHA until GitHub collects them; nothing references them.
  **Standing rule kept:** the team id and the settings edit stay unstaged in the working tree.
- **Food data, with additional sources (MM-58, MM-57, MM-51, MM-153):** an unknown barcode, or a search on request, is
  looked up online if the person allows it (ask, always, just for now, never; Settings, Data): Open Food Facts' API, and
  USDA FoodData Central's API in a build given `MM_FDC_API_KEY` (free from api.data.gov; set it in the environment or the
  git-ignored `config/prod.local.json`; **not set yet, the owner's to obtain**). Answers pass the pack's own nutrition
  checks and tiers and are kept on the phone (`online_foods`, schema 12). A Food data sources screen names each source and
  licence. Community records are now judged by MM-153's rule (label, or "Check this" with the reason), and "Fix this
  food" keeps a corrected copy. MenuStat, CNF, OpenNutrition were read and declined (MM-51). The food-data repository's
  README says the app can ask online (committed there locally, **not pushed**). The published packs of 2026-10-19 keep the
  old community tiers until the next `mm food build`.
- **Built by six lanes in worktrees (`/Users/jacobheater/dev/mm-wt/`), integrated by cherry-pick:** sleep (MM-250, 251,
  252, 414, 415; schema 13; Kotlin and Swift readers unbuilt and unverified on a device), the weight jump and the waist
  (MM-142, 155, 418), WS-03 (MM-91, 106, 286, 287, 288 option (a), 289, 304, 357, 422, 436, 437; the accessibility
  checklist), WS-08 (MM-42, 43, 49, 150, 151, 152, 167, 428, 429; schema 14, renumbered from the lane's 15), the diet
  break (MM-135, offered at 12 weeks and planned at 20, two weeks long; MM-31 superseded in part; merged with sleep's
  short-sleep signal), MM-55, MM-56, MM-417 (seven unseen places), MM-416 (Progress entries onto a surface), MM-435.
  Every design change went through the product-designer and UX-accessibility roles (`docs/agent-runs/`), blocking
  findings fixed with bug tickets and regression tests.
- **Decided under the owner's blanket instruction, each recorded "say if wrong" on its ticket:** the Ember budget is
  option (a), text actions underlined (MM-288); "Just for now" lasts until the app is closed (MM-58); FoodData Central as
  the second online source and a name search on request (MM-58); MM-304's three owner questions; MM-416 follows rule 1
  rather than an exception; MM-135's open points (two weeks, seven days at maintenance resets, exempt from the step
  limit); community records that are complete and consistent are a label (MM-153).
- **Where M2 stands:** every buildable ticket done. Left, and only people can close them: MM-51 (the fifty-product hand
  check and the pantry test need real packages), MM-57 (a qualified reader of the licensing). MM-63 and MM-64 closed after the
  owner decided (2026-10-20): the share sheet is the only way a backup leaves, no storage-service connectors, the file stays
  `.mmbackup` rather than a password zip, and no export for reading the data outside the app or for other logging apps.
  Outside M2 and the owner's: MM-432 (a one-week break option). Unverified on a device: the native sleep
  readers, the online lookup through the shell's HTTP, a backup through the share sheet and back through the picker, screen
  readers, the phone's largest text.
- Roadmap: WS-15, WS-07, WS-08, WS-03, WS-04, WS-02 steps tagged M2 are built; `mm roadmap` regenerated.

## Session 38: 2026-10-19 to 20, Claude (M2 closed up on one branch: backup, coaching rules, targets, period days, training, what to expect, the icon)

- The owner asked for backup and restore in M2 and to "get started on M2 and
  close up all the tickets there on a single branch" (`feat/m2`); mid-session
  the owner added the app icon and two loading screens. Every owner-open
  decision in this session was taken under that instruction and recorded on
  the ticket as "say if wrong"; nothing was asked.
- **Commits on the branch so far:** the seven M2 design bugs through the
  panel (`44cb4b6`), backup and restore with the noisy-logger rule
  (`dc14797`), the Add food sheet and the week's summary (`842d3f8`), and
  this session's uncommitted batch below (committed once `mm check` is
  green).
- **Built this session, M2 tickets closed:** MM-141 (three more insight
  rules: weekend higher, waist against weight, consistent day; every rule
  against six simulated people for banned words; register rows for every
  rule and threshold), MM-140 (training start masks a stall; the
  closed-loop "estimate was high" scenario; "a gentler pace" is a button;
  cycle data shortens the window), MM-123 (targets rounded to 25 kcal and
  5 g, the on-target band drawn on the arc and said in the caption, the
  label-accuracy line once, Exact targets in Settings), MM-128 (Gentle,
  Standard, Faster with what each costs today, the 35% deficit cap, a pace
  change at once built on the estimate the targets rest on, in onboarding
  and on the Coach), MM-130 (the maintenance anchor and band, the drift
  question, the rebound said before it happens, the pause before another
  cut, Ease into maintenance), MM-20 (period days on Progress, the trend
  widened and the chart shaded), MM-134 (the training notes, the lean-gain
  acknowledgement, lapse notices, the surplus suspended), MM-158 ("What to
  expect", onboarding step 8 and reread from the Coach, the weigh-in
  reminder offered there), MM-180 and MM-136 (closed: built and tested),
  MM-413 (the camera failure announced, focus kept). Schema 11: exact
  targets, the label note, easing in, the pace change day, the maintenance
  anchor and correction, the pace on each targets record, the
  `menstruation_days` table.
- **The icon and splash (owner's art):** `apps/mobile/design/` holds the
  masters; `scripts/app-icons.py` (pure Python) writes every iOS, Android
  and web icon and splash; the launch storyboard shows the splash whole on
  the art's sky colour. See the app's README.
- **Where M2 stands:** 128 of 156 tickets done. Left, with why: MM-135,
  MM-51, MM-57, MM-288 wait on the owner or on people; MM-63/MM-64 wait on
  the owner's choice of storage providers; MM-155 (the protocol drawing,
  the waist chart, the monthly report's figure), MM-142 (the weight-jump
  explanation), WS-08's food tickets (MM-42, 43, 49, 150, 151, 152, 167:
  each with a short "not built" list in its progress), MM-55/MM-56/MM-153
  (phone timings, a real device run, licensing), WS-15 sleep (three
  stories), WS-03 (MM-91, 106, 286, 287, 289, 304, 357) are buildable and
  next on this branch.
- **Owner questions recorded on tickets:** "kcal left" kept over the
  ticket's "to go" (MM-123); the example deficits reflect the engine's
  energy density, not 7,400 kcal/kg (MM-128); strength-on-a-cut lives under
  the lift, not the dashboard (MM-141); a check-in now waits for the
  training log and preferences to load (CheckIn).
- Roadmap: WS-09 step 3, WS-06 steps 4 to 6, WS-07 steps 2 and 3, WS-05
  steps 3 and 4, WS-08 steps 5 and 9 advanced to built.
