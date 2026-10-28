# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior; durable
rules live in the `AGENTS.md` files (root, `apps/mobile/`, `src/data/`,
`android/`, `ios/`), not here. Read only this section at the start of a
session.

## Where things stand

Last updated: 2026-10-28, by Claude, Session 48.

**How work is done now (owner, 2026-10-20 and 21; root `AGENTS.md`, "Usage").** No
local tests, checks or builds: CI validates. Small parallel branches, one PR
each, merged when green (`gh pr merge --merge`; no branch
protection, so `--auto` is refused). For the push through M3 and M4 the owner
lifted the five-minute subagent cap (2026-10-21): builder agents, one ticket
per worktree and PR. This handoff is updated once per session, in its own PR.

**AI meal analysis with tools, the owner's push of 2026-10-28 (Session 48, Claude; MM-682 to MM-687, PR #361 merged green).**
Settled in a four-round interactive Q&A (the owner's standing rule, and the Q&A is interactive: AskUserQuestion rounds, never a
list of questions in prose) before any ticket; the answers and the owner's approved coach lines A, B, C and the inline line are in
MM-682. Built: `mealMovesOf` (one move per meal ranked by the day's gap: cut the portion, add a protein food, a same-group swap,
the next meal's order; the catalog first then the person's own foods; MM-683's bug: a swap is within the food's group or none),
the approved lines as the built-in words on the sheet's "Your move" row, under the foods and in the Executive brief (MM-684);
`CoachToolbox` and the tool loop in `HttpCoachNarrator` for Gemini, OpenAI and Anthropic, `AppCoachToolbox` answering
meal_and_day, moves, my_foods_at_meal, search_catalog, price_move, today_meals, week and training from the state, privacy and
terms amended (MM-685); the sheet, the Executive summary and Settings' test ask with tools and "Answer now" after three seconds
shows the built-in words and keeps them (MM-686); the inline lines phrased in one request a day (MM-687). Tickets stay
`in-progress` and in `remaining`: **owed is the owner's phone read of the coach's words on a real breakfast** (never call coach
work done before that), and then `done` and `built`. Three CI rounds (a type predicate; `state` may not import `format`, one
declaration per file, a gap from the `--space-N` scale in px; a test's old words).
**The owner's first phone read (same day, PR #363, green in one round): two plain defects, fixed without asking.** MM-689: the
Executive summary opened "I'll work from the JSON you supplied; the protein gap is marked as unable to fit": the prompts said
"the supplied JSON" and the check had no rule against the model talking about its input. The prompts now say "the figures" and
tell the model to speak as the coach who looked at the day; `whyCoachNarrationRejected` refuses words about figures, instructions
or tools. MM-688: the same brief ordered "adding a beaver beside" the biscuit: `leanProteinOf` took the most protein inside 300
kcal from the catalog's protein groups, and `CatalogTradeCatalog.load` lists a group's first 500 foods as the pack stores them
(the owner's meat group runs "Armadillo" to "Beef, heart"; chicken breast is past a thousand cuts). Now `everydayProteins`, an
ordered list (chicken breast first), `everydayProteinRankOf` striking breaded, fried, raw, dried and game forms, and the adapter
searching each everyday protein by name across its whole group. Lesson: a pick "by the most X" over a catalog of thousands names
the strangest food in it; check the real pack (`.food_cache/packs/generic.pack`, SQLite, values x100) before trusting a rule.
Still owed: the owner's phone read of all of it (MM-682 to MM-689 stay `in-progress`).

**Cardio from the wearable, the owner's push of 2026-10-28 (Session 47, Claude; MM-677, MM-678).** Settled in a four-round Q&A
with the owner before any code (the owner's standing rule now: a big feature starts with the Q&A): platform only, every
non-strength session counts, floors of 8,000 steps a day and 150 min a week changeable in Settings › Coach, fat loss and
recomp only, one "Cardio" section on Train and a row on the Dashboard, both shells, both counted, orders plus a stall
explanation at a 20% steps drop, the coach's lines built as drafts for the owner to read on the phone. Built in the main
checkout, uncommitted, **not yet on a branch or through CI** (the owner decides how it ships): schema 31
(`cardio_sessions`, `daily_steps`, two floor columns), `cardioSessionImports` and `importSteps` in `AppState`,
`buildCardioWeek`, the Cardio fold on Train (MM-680), the Dashboard row, `cardioFindings` and `stepsFindings` (C1, C2), the `activity` stall
diagnosis, both native plugins sending a session's `activity`. The non-goal is narrowed to "no burn it off". **MM-679** (the owner, from the phone: the first live run blanked the
app with no words, a service wired to the wrong object): `CrashBoundary` inside `App` with the theme and around it
in `main.tsx`, the crash said in `ReadFailedNotice`'s shape with Try again; `test/app/crashBoundary.test.tsx`. **MM-680** (the owner, from the phone: "collapsibles not nav to sub views", "Cardio must
have infographics"): `WeeklyVolumeFold` and `CardioFold` on Train in place of the two screens, the cardio drawn by
`CardioWeekFigures`, `StepsByDayChart` and `CardioActivityBars`. **MM-681** (the owner: "coach is completely mute on training"):
the Executive brief carries a `TrainingBrief` (`trainingBriefOf`), said by `trainingBriefText` after the food and given to the
model with its figures allowed; the Executive summary shows the three rows; 1d's findings include the week's training,
cardio and steps accountability.

**Open PRs at the end of Session 48:** none (#360 and #361 merged green; this handoff PR is opened and merged after). A new session still checks `gh pr list` first.

**Coaching architecture & UI overhaul, the owner's push of 2026-10-27 to 2026-10-28** (MM-663 to MM-667, PRs #355 to #358). Built and merged:
- **MM-663** (PR #355): deterministic pre-calculated `ExecutiveBrief` (`executiveBriefOf`) and `MealBreakdownAnalysis` (`mealBreakdownAnalysisOf`), whole-situation paragraph archetypes for offline / no-key coaching (`executiveBriefArchetypeText`, `mealBreakdownArchetypeText`), and the hard mathematical invariant `proteinRemainingG * 4 <= kcalRemaining` enforced across intraday coaching (`analyseFoodDay`, `dayAdviceOf`, `foodFindingText`, `executiveBriefOf`, `mealBreakdownAnalysisOf`, `verifyCoachNarration`). When protein cannot fit inside remaining calories, advice pivots to pure protein sources for the remaining calorie budget and marks protein as unrecoverable today without pushing the user over their calorie budget.
- **MM-664 & MM-665** (PR #356): lifted the zero-AI runtime policy (`docs/non-goals.md`, MM-144, `privacyPolicy.ts`, `termsOfUse.ts`) and added optional BYOK LLM coaching narration (`CoachNarrator` with `HttpCoachNarrator` and `InMemoryCoachNarrator`; `CoachAiStore` with `LocalStorageCoachAiStore` and `InMemoryCoachAiStore`) supporting `Google Gemini`, `OpenAI`, and `Anthropic` in `Settings > Coach` (`CoachSettingsSection.tsx`), guarded by `verifyCoachNarration` with automatic fallback to the deterministic archetype paragraph.
- **MM-666** (PR #357): on-demand `"Coach breakdown"` sheet (`MealBreakdownSheet.tsx`, `showMealBreakdownSheet.tsx`) in every non-empty meal's overflow (`⋯`) menu (`MealSection.tsx`), plus concrete higher-protein swaps (`swapFor`) wired into inline `mostlyFat` and `lightOnProtein` food insights (`useItemInsightContents.ts`).
- **MM-667** (PR #358): consolidated the 5-tab navigation bar into 4 tabs (`Dashboard`, `Food`, `Train`, `Coach` in `destinations.ts`), added `ExecutiveSummaryCard.tsx` at the top of `CoachScreen.tsx`, embedded `ProgressScreen` into `CoachScreen.tsx`, made the bottom telemetry sections (`Your metabolism`, `Coach confidence`, `Body`) collapsible, and retired `RecentInsightsSection.tsx` and `useRecentInsights.ts`.

**Food logging, the owner's push of 2026-10-26** (`docs/food-logging-plan.md`, WS-08 steps 18 to 23). Built and
merged: MM-623 to MM-626 (reuse keeps every nutrient; saves said and pressed once; meal writes all or nothing
through `FoodEntryBatchWriter`, so a deleted meal goes at once; a logged meal's time settable), MM-627 (search by
match first, the owner's D-3), MM-628 (a unit change keeps the portion), MM-629 (recents say their amount, this
meal's first), MM-630 and MM-634 (one time, meal or day for a whole meal or for chosen foods, with Undo), MM-631
(several foods for one meal, the owner's D-1 and D-2), MM-632 (the cup a digit short), MM-633 (copies said, once,
to any day), MM-635 (pressing a saved food in Add food logs it), MM-636 (cups, tablespoons and teaspoons through
a volume serving, read from its words; no pack rebuild), MM-637 (a search's own foods and log under their own
heading, the owner's ask), MM-638 (a mistyped word still finds), MM-639 (what is usual at a meal first among the
recents), MM-640 (the chosen count said), MM-641 (take one food out of a logged meal), MM-642 to MM-644 (the
owner's choices: "About this food" folds the food's details, calories first when typing, "Cancel" while
choosing), MM-645 (save a meal and log it again in one press; schema 30), MM-646 and MM-647 (a food typed by hand
into a meal says how it was measured, and Look up offers its matches; the plan's F-19), MM-648 (extras follow the
amount, never a corrected calorie; F-20), MM-649 (focus after the chosen row is gone; MM-634's follow-up). The
plan's status table in `docs/food-logging-plan.md` says what is built and what is not, and why. Still open:
- **From the phone, 2026-10-27 (the owner):** MM-652, a search's results come one list at a time, chosen at the top
  ("Yours", "Database", "Online"; their own first when any matched; MM-637's headings gone), and MM-653, the food
  sheets' stacked actions 12 px apart and the unit chips filling their rows. The owner dictated both, so no panel.
  On the review that missed them: the panel reads code and stories and never sees the phone; what the owner
  calls out from the phone is fixed without a panel pass. MM-654 (the owner: "you can't grade orange soda?"): a
  drink logged by volume is graded per 100 mL, as the pack grades it. The ticket's Notes hold the audit of every
  way a food ends in the question mark, with counts on the 2026-10-27 pack; **the owner's calls** among them: a
  typed food graded on the per-calorie parts (no mass needed but for calories per gram), recipes graded through
  their ingredients' origins, a copied drink's millilitres kept (a `CustomFood` column), diet drinks under 10 kcal.
  MM-655 (the owner: "the random flag just sitting at the top"): the day's Refeed or Day off is a row after the
  meals under the completeness row; the header keeps the chip. MM-656 (the soda still had no grade after MM-654:
  neither fiber nor sugars stated): an unstated fiber is counted as none, said so; only sodium is required now.
  MM-657: the edit sheet says where an entry's numbers came from. MM-658: the fluid ounce is offered under
  "Cup / spoon" for every food (the owner's soda, in fluid ounces, had no such chip when edited). MM-659 (the
  owner): the edit sheet shows the entry's grade under its name, following the numbers on the sheet. **Owner's
  question, 2026-10-27:** General Tso chicken (FNDDS) grades C by the method, as Nutri-Score would; the per-calorie
  framing and the 3 kcal/g start of the energy-density scale let a fried, sauced dish sit mid-table on its
  protein. Resolved as MM-660 (the owner, "go"): a fried food by its name, or a sweet and fatty one by its
  numbers with little for it, is held to C-; the moves on the generic pack are listed in
  `docs/food-grade-cap-moves.md` for the owner to review; ingredients lists closed by the owner (they would not
  improve the grade: the dishes that fooled it have none, and packaged fried food says so in its name). MM-661
  (the owner): a long press on a food starts choosing with it ticked and one haptic tap (`@capacitor/haptics`,
  the app's first haptic); MM-634's choice against the long press reversed. MM-662 (the owner, from the phone):
  the held row stays where the finger is once the boxes are drawn, and the "Choosing: tick…" snack is gone. The
  scroll correction needs layout the test harness has none of: the owner's phone is the check. **Lesson, the owner's (2026-10-27):** a fix
  proven only on a hand-built entry passed CI and failed on the phone; `test/food/drinkGradeOnThePhone.test.tsx`
  is the shape every such fix needs: the real screens, the real database, a reopen and an edit.
- **Liquids' volume** (the plan's C2, second half): built 2026-10-27 as MM-650 (pack format 5: a food per
  100 g or per 100 mL, a serving by weight, by volume or both; the extract reads Branded `ml`/`MLT` rows and
  Open Food Facts mL servings as per 100 mL) and MM-651 (a drink by its can, the fluid ounce or the millilitre;
  grams only with a density), PR #341. Packs rebuilt 2026-10-27 as format 5 (`docs/food-packs-data.md`,
  "Format 5", with the panel's IN-1 figures; PR #342 removed two `node_modules` symlinks PR #338 had committed,
  which broke the build on the main checkout). **The owner's step**: publish release 2026-10-27 and pull both
  packs from Settings > Food database. Open: the online path stays per 100 g; a recipe ingredient that is a
  drink is still weighed in grams; the pack version is the fetch day, so a rebuild needs `./mm food fetch` first.
- **Owner's calls:** favorites pinned by the person (not built: Saved and usual-first cover it, say if a star is
  still wanted); F-21 (a re-logged analysed food becomes a label serving); whether "Select" is worded better.
- **On a phone:** every new food-logging screen, the choosing bar at 200% text (a story exists), and View meal's
  form with a screen reader (the checklist below).

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
  a drink from the rebuilt packs logged by its can and by fluid ounces, and its row's "per 100 mL" (MM-651);
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
  "chicken breast skinless" (MM-627); two tablespoons of a food served "1 cup, chopped" (MM-636); a
  saved food logged by pressing it (MM-635); a meal saved from breakfast's menu and logged at lunch, then
  Undo (MM-645); "About this food" opened and remembered (MM-642).
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

## Session 48: 2026-10-28, Claude (AI meal analysis with tools: the Q&A, then MM-682 to MM-687 in one PR)

- **The owner's words:** "i think it's time to lean into the ai driven meal analysis when the ai coach is enabled and provide tools into the application either through mcp or other tools within the application runtime to make proper suggestions and analysis. let's be honest, swapping a biscuit for a chicken breast is kind of a poor suggestion, but i'm also open to revamping and reworking this determinstically with another approach that isn't agent driven and is also available to deterministic users." Then, on a first reply that listed six questions in prose: "i said interactive q and a sessions only" (recorded: every Q&A question goes through the interactive question tool, a round at a time).
- **The Q&A's answers** are in MM-682 under Decisions, with the approved lines. Among them: both tracks, deterministic first; same-group swaps only; the catalog first, then the person's foods; one best move; the model may pick a different move as long as every number came from a tool; no limit on the wait, "Answer now" after 3 s; the cheap models stay; one inline pass a day; not MCP (no server for a provider to reach), each provider's own function calling.
- **Merged:** #361 (MM-682 to MM-687; the worktree-per-PR shipping the owner chose in the Q&A). Not seen on a phone yet: the owner's read of the coach's words is owed before the tickets close.
- **Lessons:** `state/` may not import `format/`, so a figures mapper the state needs lives in `engine/` (`mealMoveFigures`); the one-declaration rule counts an exported interface beside a class (`AppCoachToolboxReads` has its own file); the spacing scale is `--space-N` in px (`--space-12`), and a `gap` with a fallback literal fails the stylesheet test; a food can carry two insights (mostly fat and light on protein), so a one-pass test counts items, not foods.
- **Not run:** nothing was run locally; CI validated the merge.

## Session 47: 2026-10-28, Claude (cardio from the wearable: the Q&A, then the build of MM-677 and MM-678 in the main checkout)

- **The owner's words:** "Next big swing here on a feature is steady state cardio. I don't want the app to track steady state cardio, but we'll track this in two forms: steps, and cardio workout sessions within the user's wearable. I love strength training here and it must stay, but part of training on any fatloss or recomp program must be steady state cardio. now ask me questions." Then: "q&a sessions only. record that for the record then get started." (a rule, not a scope answer: the Q&A comes first; a first misreading of it as "sessions only" was stopped by the owner and undone).
- **The Q&A's answers** are in MM-677 and MM-678 under "By the product owner". Among them: every non-strength session counts, so the word is "cardio", never "steady state".
- **Built, in place on main, uncommitted:** the two tickets, the roadmap (WS-10 step 10, WS-09 step 16, an edge), `docs/non-goals.md`, `docs/evidence.md` rows, and the code and tests listed above. No test was run locally (the owner's rule); the first CI run is owed, and the owner's phones (both shells) are the check that a watch's session arrives with its activity and steps arrive by day.
- **Lessons:** a Python `replace(..., 1)` on a repeated anchor (`customExercises:`) landed two services inside `MirroredWorkoutLog`'s options instead of on `AppServices`; the phone blanked and nothing said why (MM-679 now does). Check every inserted line's placement, not just that the edit applied. `format/` may not import `state/`: a screen helper that reads the health connection takes the two sets it needs as a structural type. `cardioDisclosureText` is that helper.
- **Not run:** nothing was run locally.

## Session 46: 2026-10-28, Gemini (coaching architecture, BYOK narration, meal breakdowns & unified Coach tab; 4 PRs)

- **The owner's words:** "I have NO concerns lifting the zero AI policy, and I'm ready to do so. We've got to get Coaching sounding human, and I like your plan to trim costs. So, I want determinstic engine with precalc, and we'll keep the human sounding determinsm track for offline modes, or users who don't want to supply keys, and then run BYOK with users who bring keys."
- **Merged:** #355 (MM-663: `executiveBriefOf`, `mealBreakdownAnalysisOf`, offline paragraph archetypes, and the hard `proteinRemainingG * 4 <= kcalRemaining` invariant across intraday coaching and narration validation), #356 (MM-664, MM-665: lifted zero-AI runtime policy in `docs/non-goals.md`, MM-144, privacy policy, and terms of use; added `CoachNarrator` and `CoachAiStore` with `Google Gemini`, `OpenAI`, and `Anthropic` BYOK in `Settings > Coach`), #357 (MM-666: on-demand `"Coach breakdown"` sheet from meal overflow menu and higher-protein `swapFor` suggestions on `mostlyFat` / `lightOnProtein` inline insights), #358 (MM-667: consolidated 4-tab navigation `Dashboard`, `Food`, `Train`, `Coach`, `ExecutiveSummaryCard` at top of `CoachScreen`, embedded `ProgressScreen`, collapsible bottom telemetry sections, retired `RecentInsightsSection`), and this handoff PR.
- **Lessons:** `apps/mobile/scripts/check-unseen.mjs` uses `/<[A-Z][A-Za-z]*[\s/>]/` to spot JSX in unexecuted callbacks, which also matches TypeScript type arguments like `overlays.options<CoachAiProvider>(...)`; omit the explicit generic parameter so the type is inferred from `choices`. `CoachScreen`'s collapsible `<MmSection title="Your metabolism">` needs `remember="coach.metabolism-section"` so its fold state does not collide with `MetabolismSummary`'s inner `<MmDisclosure remember="coach.metabolism">`.
- **Not run:** nothing was run locally; CI validated every merge.
