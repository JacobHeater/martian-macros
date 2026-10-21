# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior; durable
rules live in the `AGENTS.md` files (root, `apps/mobile/`, `src/data/`,
`android/`, `ios/`), not here. Read only this section at the start of a
session.

## Where things stand

Last updated: 2026-10-21, by Claude, Session 41.

**How work is done now (owner, 2026-10-20 and 21; root `AGENTS.md`, "Usage").** No
local tests, checks or builds: CI validates. Small parallel branches, one PR
each, merged by Claude when green (`gh pr merge --merge`; no branch
protection, so `--auto` is refused). For the push through M3 and M4 the owner
lifted the five-minute subagent cap (2026-10-21): builder agents, one ticket
per worktree and PR. This handoff is updated once per session, in its own PR.

**Open PRs at the end of Session 41.** Waiting on CI, then merged by Claude:
#205 (MM-45), #208 (MM-116, MM-117), #210 (MM-46), #213 (MM-329), #214
(MM-129), #216 (MM-191), #217 (MM-34), #219 (MM-73), #222 (MM-113, unwired),
and #223 (MM-36, on #217) when it opens. Waiting on the owner: #203 (MM-95,
MM-247: the owner merges the Pages workflow), #218 (MM-454, on #203: confirm
the address), #220 (MM-432, schema v16: go or no-go). Held by Claude: #221
(MM-122, MM-124) until MM-486 gives the shapes a table, since on the phone they
are forgotten on restart.

**What to build next.**
- The schema lane, one at a time after #220 (v16): MM-486 (target shapes,
  then merge #221), MM-510 (the weight-loss-medication answer, then wire
  MM-113), MM-480 (a slower lean-gain pace), MM-456 (a recipe ingredient keeps
  its food), MM-490 (platform workouts in the app).
- Native, after #219: MM-489 (workouts written to and read from the
  platforms), MM-70 and MM-314 (nutrition and water written), MM-72
  (background sync), MM-323, MM-442.
- M4 left: MM-157 (photos), MM-35 (one body model, a spike), MM-450 (body fat
  in the monthly report, after #217), MM-441, MM-447 (owner's decisions).
- The owner's to-dos for M2: a FoodData Central API key in
  `config/prod.local.json` (`MM_FDC_API_KEY`); a pantry and fifty packages for
  MM-51; a qualified reader for MM-57 and the terms (MM-242).
- A pack rebuild (`mm food fetch`, `build`, `package`, then a release in
  martian-macros-food-data) puts MM-153's community tiers into the packs.

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
- From Session 41: MM-453 (the terms' section 10 and the Apple Health
  purpose string say nothing leaves the phone, untrue since the backup; the
  owner and the attorney reword them); Pages on in the repository settings
  ("GitHub Actions"), the address, and the store declarations drafted in
  MM-95; whether MM-109 closes with the owner's own icon and launch art (the
  planet icon, #211, was rejected on 2026-10-21); the missed-period choices
  in MM-116 (the answer is not stored; "regular" is 21 to 35 days); MM-113's
  calorie words ("so far, aiming for about" or "to go"); whether a long run of
  nights under 5 h hands over to MM-251's clinician pointer (MM-368); MM-447's
  Train decisions; the choices listed under "say if any is wrong" in MM-92,
  MM-126, MM-129, MM-34, MM-122, MM-124 and MM-432.
- The clinician (MM-29): every MM-113 string marked "pending MM-29", its
  escalation line and its five-day threshold; MM-368's evidence rows.
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
  about this week" and between Settings' headers (MM-402). From Session 41:
  exact alarms on Android 12, 13 and 14+, a 7:00 reminder at 7:00, the
  permission granted from the phone's settings, and a release build of the
  reminders plugin (MM-248); "Set done" in view at 360 by 800 while a set is
  timed, the reps keyboard, a workout's times to the second, the rest
  vibration and the timer read aloud (MM-222, MM-191); the custom-food and
  recipe flow with its "Weighed as" switch and line menu (MM-45); Coach in a
  due week (MM-391); the missed-period chips at 360 px and large text and the
  falling-lifts card (MM-116, MM-117); the two alcohol fields at 360 dp
  (MM-127); the protein marker at Full detail on a narrow screen (MM-125); both
  packs downloading on a release build with the WebView's memory flat,
  cancel and resume with matching checksums (MM-387); a glass pouring in the
  three palettes (MM-329); the lean-gain card at 200% text (MM-129); Coach >
  Body in its three states (MM-34); "On the web" opening the browser
  (MM-454); a year of Health Connect history read once allowed (MM-73).
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

## Session 41: 2026-10-21, Claude (the push through M3 and M4: builders in parallel, 13 PRs merged)

- **The owner's words this session:** "I want all milestones done in rapid fire. No more excuses, and no more
  delays." The owner allowed `gh pr merge` and lifted the subagent cap for this push. On #211: "I reject #211 icons."
- **Merged:** #195 (backup by share sheet only), #196 (MM-438), #197 (MM-439), #198 (MM-440), #200 (MM-92, MM-33:
  the longest logging run and personal records in the monthly report), #201 (MM-71: the primary scale, schema v15;
  MM-443, a `StreamCell` that ignored a change made while it woke), #202 (MM-248: exact alarms), #204 (MM-214,
  MM-215, MM-222: the Train hierarchy), #206 (MM-391, MM-392), #207 (MM-125: the protein marker on the reference
  weight), #209 (MM-126, MM-127: standard drinks, the fiber insight), #212 (MM-386, MM-387, MM-471: the catalog
  closes what it replaces, downloads streamed to a file natively), #215 (MM-189: the rules for platform workouts).
- **Closed:** #211 (MM-109's planet icon), rejected by the owner.
- **New tickets:** MM-441, MM-442 (WS-11), MM-443 (done), MM-447 (Train decisions), MM-450 (body fat in the report),
  MM-453 (the terms predate the backup), MM-454, MM-456, MM-471 (done), MM-474 (dev and demo icon markers, moot
  while the owner's art stays), MM-480, MM-486, MM-489, MM-490, MM-495 (done), MM-498 (skipped test), MM-501,
  MM-502, MM-510.
- **Lessons:** a ticket placed in a step must also be in that milestone's `requires` list, or `mm check` fails (twice
  today). Scripted edits failed silently three times (a reminder toggle, a swallowed comment, an emptied ticket):
  re-read every scripted edit. The shared "Built" and "In progress" lines in the workstream files conflict on almost
  every merge; record status in `roadmap.json` and touch only a step's own lines. `gh` lives in `~/.local/bin`, and
  `/usr/bin/git` (not `/usr/local/bin`'s 2.10) pushes with `-c credential.helper='!gh auth git-credential'`.
- **Not run:** nothing was run locally; CI validated every merge.

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
