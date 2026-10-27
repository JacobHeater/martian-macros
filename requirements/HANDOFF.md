# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior; durable
rules live in the `AGENTS.md` files (root, `apps/mobile/`, `src/data/`,
`android/`, `ios/`), not here. Read only this section at the start of a
session.

## Where things stand

Last updated: 2026-10-26, by Claude, Session 43.

**How work is done now (owner, 2026-10-20 and 21; root `AGENTS.md`, "Usage").** No
local tests, checks or builds: CI validates. Small parallel branches, one PR
each, merged by Claude when green (`gh pr merge --merge`; no branch
protection, so `--auto` is refused). For the push through M3 and M4 the owner
lifted the five-minute subagent cap (2026-10-21): builder agents, one ticket
per worktree and PR. This handoff is updated once per session, in its own PR.

**Open PRs at the end of Session 43:** only this handoff. A new session still checks `gh pr list` first.

**Food logging, the owner's push of 2026-10-26** (`docs/food-logging-plan.md`, WS-08 steps 18 to 23). Built and
merged: MM-623 to MM-626 (reuse keeps every nutrient; saves said and pressed once; meal writes all or nothing
through `FoodEntryBatchWriter`, so a deleted meal goes at once; a logged meal's time settable), MM-627 (search by
match first, the owner's D-3), MM-628 (a unit change keeps the portion), MM-629 (recents say their amount, this
meal's first), MM-630 and MM-634 (one time, meal or day for a whole meal or for chosen foods, with Undo), MM-631
(several foods for one meal, the owner's D-1 and D-2), MM-632 (the cup a digit short), MM-633 (copies said, once,
to any day). Still to build, each waiting on the owner:
- **Volume from the source data (the plan's C2):** keep FDC's measure units, Branded mL servings and Open Food
  Facts' per-100 mL liquids in the pack; a new pack format, so the owner rebuilds and publishes the packs. First
  run the pack query in the plan's H-06 (how many OFF and Branded rows are liquids).
- **"Saved" in Add food** opens a saved food's editor, not its amount step (the plan's B5): left as built
  (MM-45) until the owner says otherwise.
- Follow-ups recorded in MM-631 and MM-634 (count spoken as it changes, focus after a chosen row is deleted, the
  bar at 200% text; "Done" and "Select" wording, the owner's call). Frequency-ranked recents, typo-tolerant
  search, saved meal templates (the plan's C5 and W-D).

**M0 to M4 are done (2026-10-22): every one of the 376 tickets in their `requires` lists is `done` on
main.** What stays open is owed by people, not code, and is listed in each ticket:
- **Owed on a phone** (the owner's device pass, see the phone checklist below and each ticket's
  "Owed on a phone"): most of M3/M4, including every iOS ticket's first build (CI compiles no Swift).
- **Owed by the owner:** MM-57's qualified reading of the licences (seven points in the ticket) and
  the optional note to USDA; MM-51's fifty-barcode pantry check and the hand check of
  `sample50_disagreements.csv` (`tool/spikes/food_sources/README.md`).

**What to build next.** M5 only when the owner decides to release (the paywall, store, sign-offs and
the public legal page). Otherwise: follow-ups the panel left as notes (each in its ticket): RIR in
strength captions (MM-108), "±" on the Dashboard weight row and Progress hero (MM-108, design call),
earlier limb entries carrying their side (needs a schema change, MM-156), the photo database opened
only when first needed if iOS ever launches the app in the background (MM-157), translation as its
own ticket if wanted (MM-108).

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
  ("GitHub Actions") and the store declarations drafted in MM-95 (#203 and
  #218 are merged by the owner); the missed-period choices in MM-116 (the
  answer is not stored; "regular" is 21 to 35 days); MM-113's calorie words
  ("so far, aiming for about" or "to go"); MM-447's Train decisions; the
  coordinator's calls on a gain's end (the upper end of the body-fat range,
  MM-129) and an unchosen balance (as issued, MM-122); the health-write
  choices in MM-70 (fixed meal times, one-minute drinks); the choices listed
  under "say if any is wrong" in MM-92, MM-126, MM-129, MM-34, MM-36, MM-122
  and MM-124.
- Decided by the owner in Session 41: no one-week break (MM-432 closed); the
  planet icon rejected and MM-109 closed with the owner's art; no sleep
  insights, as medical advice (MM-368 closed); no background sync, ever: where missing data weakens coaching the
  app says so and the user decides (MM-516 closed, MM-523, #229).
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
  (MM-454); a year of Health Connect history read once allowed (MM-73);
  AI meal analysis with photos, on Android and iOS, a release build too
  (MM-599): Choose photos (the phone's picker, no permission asked), Take a
  photo, then Send to assistant to ChatGPT, Claude and Gemini, noting which
  keep both the photos and the prompt; no "Save Image" offered on iOS; and,
  after the sheet closes, nothing left under the app's cache
  (`mm-meal-shared` on Android, `mm-backup-*-meal-*.jpg` on iOS). From Session 43: a three-food
  meal deleted, gone in one redraw (MM-625); "Log it" pressed twice fast, one entry, with TalkBack
  hearing the busy state (MM-624); three foods to dinner through "Add another food", the time set
  once, TalkBack hearing each "Added …" and the list's line focused, the list at 360 px with the
  keyboard open (MM-631); "Select" on Food, boxes ticked, the bar at the foot clear of a snack and of
  the navigation bar at 200% text (MM-634); 180 g changed to ounces (MM-628); search for "oats" and
  "chicken breast skinless" (MM-627).
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

## Session 43: 2026-10-26, Claude (food logging: a plan, then its build; 7 PRs)

- **The owner's words:** asked for an evidence-backed food-logging improvement plan (multi-food logging, alternate
  units and volume, bulk editing especially of time); added that recent foods and database search "is kind of ass"
  next to MyFitnessPal and MyNetDiary; that deleting a meal row by row is "a pathetic user experience"; then "go
  forth". Answered D-1 to D-4 as recommended (saved together; loose foods; match first; a day move keeps the time),
  and allowed one worktree per PR for this build only.
- **Merged:** #319 (the plan, `docs/food-logging-plan.md`, and MM-623 to MM-626 as tickets with skipped tests),
  #320 (MM-623 to MM-626 fixed), #321 (MM-627), #322 (MM-628 to MM-630, MM-632), #323 (MM-631), #324 (MM-633), #325
  (MM-634). A six-role panel shaped the plan; the designer and UX guard reviewed MM-631 and MM-634 before they
  shipped, and every blocking finding was fixed in the same PR.
- **Lessons:** a fallback that helps a person reading results can mislead a lookup that takes the first hit (the
  any-word search matched "broccoli cooked" to broccoli raw; now only the results list asks for it). Number
  constants deserve a test of their ratios (the cup was a digit short). `exactOptionalPropertyTypes` refuses
  `{ change: undefined }`, and `useRef<T>()` needs its argument here. A merge's own fetch can race a follow-up
  fetch on the ref lock: fetch again.
- **Not run:** nothing was run locally; CI validated every merge.

## Session 42: 2026-10-22, Claude (M0 to M4 finished: five builder lanes, a panel review of everything, ~50 PRs)

- **The owner's words:** "M3 and M4 are both nearly done. Get them finished ASAP"; "Have the subagents now do their
  reviews"; "I want any ticket that's not done in M0-M4 done tonight and reviewed with the panel. The status must be
  done." On the failing Pages deploys the owner chose to pause the workflow (#288).
- **Built and merged:** five lanes in parallel (schema, coaching, health sync, iOS, food/training), then seven panel
  roles (designer, UX, safety, privacy, measurement, integrations, React) over all of it, then fix PRs for every
  blocking and should-fix finding, then the last eight M0-M4 tickets (MM-108, 176, 179, 183, 51, 57, 323, 523) with
  a second panel pass (product, QA, UX, integrations) and its fixes. Schema is at v24 (MM-441 19, MM-456 20, MM-507
  21, MM-490 22, MM-156 23, MM-118 24).
- **Decisions taken as defaults, each recorded in its ticket ("say if any is wrong"):** goal body fat shown only in
  fat loss and recomp; the soft-floor warning announced, not confirmed; a photo self-timer and the front camera on the
  first set; a smart scale may only make safety stricter (bias 4.5 points, correlation 0.4); only strength workouts
  imported; Navy tape for men only (no natural-waist site); MM-108's localization files not built (a note, not a
  criterion; translation would be its own ticket); "No estimate yet" says what fills it.
- **Bugs found by the panel and CI, fixed:** planned lower days on a shaped week dropped as partial (the estimator
  and every adherence reader now read a day against its plan, MM-124); a consumer scale narrowing the body-fat range
  and loosening safety (MM-502); photos savable by long press on iOS, no lock before a photo backup, no Android
  device-transfer exclusion (MM-157); two Resume buttons while paused (MM-447).
- **Lessons:** GitHub skips PR CI while a PR conflicts, and a stale branch keeps failing on fixes already on main:
  merge main into every open branch after a burst of merges. A cancelled run is not a failure: rerun it. The
  architecture test's import scanner reads `from '…'` inside strings. Coach states ranges in words, never "±", and
  two "Probably between" on one screen break a test. Never share a worktree between agents (one reset another's
  branch; nothing was lost). Pushing straight to main is refused by auto mode: merge through PRs.
- **Not run:** nothing was run locally; CI validated every merge. Main's CI is green at 86744579.

## Session 41: 2026-10-21, Claude (the push through M3 and M4: builders in parallel, 30 PRs merged)

- **The owner's words this session:** "I want all milestones done in rapid fire. No more excuses, and no more
  delays." The owner allowed `gh pr merge` and lifted the subagent cap for this push. On #211: "I reject #211 icons."
- **Merged:** #195 (backup by share sheet only), #196 (MM-438), #197 (MM-439), #198 (MM-440), #200 (MM-92, MM-33:
  the longest logging run and personal records in the monthly report), #201 (MM-71: the primary scale, schema v15;
  MM-443, a `StreamCell` that ignored a change made while it woke), #202 (MM-248: exact alarms), #204 (MM-214,
  MM-215, MM-222: the Train hierarchy), #206 (MM-391, MM-392), #207 (MM-125: the protein marker on the reference
  weight), #209 (MM-126, MM-127: standard drinks, the fiber insight), #212 (MM-386, MM-387, MM-471: the catalog
  closes what it replaces, downloads streamed to a file natively), #215 (MM-189: the rules for platform workouts).
- **Also merged:** #205 (MM-45), #208 (MM-116, MM-117), #210 (MM-46), #213 (MM-329), #214 (MM-129: lean-gain
  guardrails), #216 (MM-191), #217 (MM-34: the body-fat range), #219 (MM-73: a year of history), #222 (MM-113,
  unwired), #225 (MM-72: sync on open and on return), #224 (MM-36: phase planning on the body-fat range; a gain ends
  where MM-129 says, at the upper end of the range), #226 (MM-495; MM-432 closed), #221 (MM-122,
  MM-124, MM-486: the balance and week shape, stored at schema v16; unchosen stays as issued), #227 (MM-489, MM-70,
  MM-314, MM-522: food, water and workouts written to Health Connect and Apple Health, each behind its own switch). The owner merged #203 (MM-95, MM-247) and #218 (MM-454).
- **Closed:** #211 (MM-109's planet icon) and #220 (MM-432), by the owner. MM-368 was declined as medical advice.
- **New tickets:** MM-441, MM-442 (WS-11), MM-443 (done), MM-447 (Train decisions), MM-450 (body fat in the report),
  MM-453 (the terms predate the backup), MM-454, MM-456, MM-471 (done), MM-474 (dev and demo icon markers, moot
  while the owner's art stays), MM-480, MM-486, MM-489, MM-490, MM-495 (done), MM-498 (skipped test), MM-501,
  MM-502, MM-507, MM-510, MM-513, MM-514, MM-515, MM-516, MM-522.
- **Lessons:** a ticket placed in a step must also be in that milestone's `requires` list, or `mm check` fails (twice
  today). Scripted edits failed silently three times (a reminder toggle, a swallowed comment, an emptied ticket):
  re-read every scripted edit. The shared "Built" and "In progress" lines in the workstream files conflict on almost
  every merge; record status in `roadmap.json` and touch only a step's own lines. Two green PRs can still break `main`
  together (#221 and #227 crossed on the eraser contract; #228 fixed it): check `main`'s run after a burst of merges. `gh` lives in `~/.local/bin`, and
  `/usr/bin/git` (not `/usr/local/bin`'s 2.10) pushes with `-c credential.helper='!gh auth git-credential'`.
- **Not run:** nothing was run locally; CI validated every merge.
