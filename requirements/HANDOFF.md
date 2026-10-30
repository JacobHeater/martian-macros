# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior; durable
rules live in the `AGENTS.md` files (root, `apps/mobile/`, `src/data/`,
`android/`, `ios/`), not here. Read only this section at the start of a
session.

## Where things stand

Last updated: 2026-10-30, by Claude, Session 53.

**Your foods, made with your AI, kept in a Library, reached from a side drawer; the owner's push of 2026-10-30 (Session 53, Claude; MM-703 to MM-710; tickets in PR #375, the drawer in #376, AI food creation in #378, the Library in #377, all merged green).** Settled in an eight-round interactive Q&A before any ticket; every answer is in MM-703's Decisions. Built: `MmDrawer` and `DrawerMenu` (a menu button at the left of the app bar opens a drawer from the left with the owner's lettering at its head and rows for the four destinations, Profile, Library and Settings; the gear is gone; MM-704); `ProfileScreen` with the profile section and nutrition goals out of Settings (MM-705); `LibraryScreen` in `src/library/` (Foods, Recipes, Meals, Usual foods and Exercises in closed folds with counts, rows with serving, macros, trust mark, grade and `watchSavedFoodUsage`'s last-logged and times, New food offering With my AI, Scan a label, Type it in and New recipe; MM-706); the Saved step as a picker with Manage in Library (MM-707); `MakeFoodWithAiScreen` in `src/food/ai/` (the questions with a Homemade switch, the photos sent through `MealShare`, the answer pasted, each food reviewed with its group, serving, per-100 g numbers, ingredients and evidence, Update it or Keep both on a same-name food, Save; MM-708); the format `martian-macros-food` v1, `parseFoodAnalysis`, `foodDraftProblems`, `customFoodOfDraft`, `resolveFoodDrafts`, the prompt and the fix message (MM-709); schema 32 (`food_group`, `evidence_kind`, `evidence_citation`, `ingredients` on `custom_foods`), `FoodEvidenceKind` with `label`, `SavedFoodTrustMark`, the group chooser on the typed form, the coach's same-group swap may name a saved food with a group (MM-710). Nine CI rounds across the four PRs, none on the design. All eight tickets stay `in-progress` and under `remaining`. **Owed on the owner's phones:** the drawer's slide and drag and Android's back; Profile from the drawer; the Library's folds; a biscuit made with a real assistant end to end (the share sheet with photos, the paste, the barcode scan from the screen); the trust mark and the count on its row. The main checkout was fast-forwarded to main for `mm run`. **The owner's first build, the same day:** "if we have a menu why do we also have a bottom nav bar. I don't want both" and, on Profile, "all collapsibles start collapsed": MM-711 (the bar deleted; the drawer is the one navigation; the snack and the floating action on the safe area) and MM-712 (Profile's folds closed; `ProfileScreen` takes `open`), fixed without a panel.

**Move to another phone, the owner's Q&A of 2026-10-29 (Session 52, Claude; MM-698, with MM-699 and MM-700 that the owner's first move found, in PR #371; the merge waits on the owner, since the session's permissions refused it).** An AirDrop-like move between the owner's Android phone and iPhone, settled in three interactive rounds and recorded in MM-698: a hand-off that replaces (never a merge), a nudge to back up when the receiving phone holds unbacked records, the same Wi-Fi only, the receiving phone shows a QR code with the app icon and the sending phone scans it, data and photos as a backup holds them (the owner then chose that the database's settings travel too), entry from Settings > Backup and the first-run welcome, the same app version on both, the restore's confirmation before anything is replaced, free. Built: the sealed protocol in `src/transfer/` (a one-time key in the code, libsodium secretstream, versions compared before any data), a QR encoder in `lang/` decoded back in tests by jsQR, the sheets and stories, the `MmTransfer` plugin in Kotlin and Swift and the scanner's QR mode. The product designer and the UX guard reviewed the stories; their blocking findings are fixed. The terms are not changed: the move's sentence waits on MM-453 with the backup's. **Owed on the owner's two phones, on one Wi-Fi:** Android to iPhone and iPhone to Android, each confirmed; the iOS Local Network prompt; Move refusing a product barcode and the food scanner ignoring the move code; an Android release build with the new plugin. The owner's first move (iPhone to Pixel) sat minutes in a row-by-row restore with nothing on screen and was swiped away (MM-699, MM-700, fixed in the same PR); the move is owed again. MM-698 to MM-700 stay `in-progress` and under WS-12 `remaining` until then.

**`mm run --phone` went to the emulator, 2026-10-29 (Session 51, Claude; MM-695, MM-696 and MM-697, working tree of the main checkout, no PR yet).** The owner: `./mm run --phone` with the Pixel plugged in installed on the emulator. The Android runner knew the phone only as `--env phone` (MM-234); `--phone` was the iPhone's spelling (MM-412), and an argument the Android runner did not know fell through to "whatever adb lists", or to an emulator it boots when adb lists nothing. Built: `runTargetOf` in `tool/src/android.ts`, the one reader of `mm run`'s arguments for Android (`--phone`, `--env phone`, `-d ID`, `--phone ID`; anything unknown refuses with the usage line), used by the bundled run and `--live`; `mm help` and the README say `--phone`; `tool/test/runTarget.test.ts`. Ticket in WS-01 step 6, under `remaining`. Not seen on the phone: adb on the dev Mac would not start its server from the agent's shell (`e00002be`, "ADB server didn't ACK"), so the device list could not be read; the owner's `./mm run --phone` landing on the Pixel closes MM-695. Then the owner ran it: "No Android phone connected" with the Pixel plugged in. adb's server hung in USB enumeration under its native macOS backend (`e00002be` repeating, no ACK; macOS showed Chrome holding a user client on the Pixel), and `deviceIds` read the failure as an empty list. `ADB_LIBUSB=1 adb devices` started the server and listed the Pixel as `device` (MM-696): `deviceIds` now retries with the libusb backend when adb says its server would not start, keeps it for the run, and otherwise prints adb's last line before any talk of phones; `tool/test/adbServer.test.ts`. The run then reached the Pixel and the install was refused, `INSTALL_FAILED_UPDATE_INCOMPATIBLE`: the dev app on the phone was installed that evening from the owner's Windows box, under its own debug key (the owner confirmed). Its data is small and from that day (one setup, one weight entry, Health Connect imports, no food). MM-697: the runner now explains the key mismatch and both remedies (copy the other machine's `~/.android/debug.keystore` here, or `adb uninstall`, which deletes the data) and never uninstalls on its own. The remedy is the owner's choice. Left uncommitted on `main` because branching off main needs the owner's word (2026-10-24).

**The owner's phone, 2026-10-29 (Session 50, Claude; MM-694 in PR #369, merged green).** The app, resident through a long
sleep, showed "Could not open your data. Nothing you logged has been changed. Close the app and open it again." on unlock.
Read off the phone over USB: the database sound (schema 31, integrity ok, written at 13:59), the same build opening to the
Dashboard when started again unlocked (`./mm screenshot --phone`). From the code: the shell starts the web app again whenever
iOS drops the web view's process (Capacitor's `webViewWebContentProcessDidTerminate` resets the bridge and reloads), and that
start opened the progress-photo database, `.completeUnlessOpen` on iOS (MM-157), unopenable while the phone is locked; `main.tsx`
took the whole app down with it, error to the console only, no retry. That the owner's start was one made behind the lock
screen is inferred, not observed (the phone kept no jetsam record). Built: `LazyProgressPhotoRepository` (the photo database
opened on first use, a failed opening forgotten so the next call tries again), `startApp` with `OpeningFailed` (the app's
`ReadFailedNotice`, "Could not open your data", Try again), `main.tsx` only wiring; tests `test/data/lazyProgressPhotos.test.ts`,
`test/app/photosOpenedLazily.test.ts`, `test/app/startApp.test.tsx`, story `OpeningFailedAtStart`. MM-694 stays `in-progress`
and in WS-07's `remaining` list: `mm req` refuses a `built` ticket whose status is not `done`. **Owed: the owner's rebuild
(`mm run --ios --phone`) and the app opening after a long sleep with it resident.** The native plugin still keeps the handles a
dropped web view opened; not changed.


**How work is done now (owner, 2026-10-20 and 21; root `AGENTS.md`, "Usage").** No
local tests, checks or builds: CI validates. Small parallel branches, one PR
each, merged when green (`gh pr merge --merge`; no branch
protection, so `--auto` is refused). For the push through M3 and M4 the owner
lifted the five-minute subagent cap (2026-10-21): builder agents, one ticket
per worktree and PR. This handoff is updated once per session, in its own PR.

**The owner's phone call-outs of 2026-10-28 (Session 49, Claude; MM-692 in PR #366, MM-693 in PR #367, both merged green).**
MM-692: the Food header's wordless completeness checkmark is gone; the day's completeness is a chip with a fill at the top right of
the Food hero's head (`FoodCompletenessChip`: Complete positive, Partial caution, Not marked neutral, with MM-255's mark), above
what is left or over, for any day up to today; `MmStatusChip` took a `tone` and an `icon`, `CalorieHero` a `mark`; the Refeed or
Day off chip stays in the header. MM-693: the Executive brief rambled ("The figures are already in front of me, so I can answer
directly without calling tools", 170 words, the rows under it recited). The owner chose, in one interactive question with three
drafts of that day, **verdict, drag, order, one training line, at most 4 sentences and 60 words** (the draft is in MM-693). The
limits travel with `CoachNarrationRequest` (`maxSentences`, `maxWords`) and `whyCoachNarrationRejected` refuses past them with
"It rambled"; "figures" and "tools" as words, "in front of me", "answer directly", "without calling" and "I can answer" are
refused as meta-talk; the sheet's approved line A is longer and is not bound. The built-in words are unchanged. **Owed: the
owner's phone read of both** (the chip at 360 px with "Not marked" over the delta; the next brief the model writes); MM-693 stays
`in-progress` until then. Lesson: the demo seed marks every day complete or partial, so a story that needs an unmarked day sets
it so.

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
explanation at a 20% steps drop, the coach's lines built as drafts for the owner to read on the phone. Shipped in PR #360,
merged green 2026-10-28 after two fix rounds, the main checkout fast-forwarded to it: schema 31
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
**MM-690, same day, from the owner's first walk on the watch: "martian macros isn't picking it up."** Read off the phone itself
(the database copied over USB with `xcrun devicectl device copy from --domain-type appDataContainer`, the Health app's sharing
page): steps fresh, no workout read since 2026-10-09, and Health's "Allow to Read" list without Workouts. The Swift plugin
answered `permitted` from its own `UserDefaults` list of kinds asked for, which held "workout" while HealthKit's record did not,
so Settings never asked again and HealthKit answered every workout query with nothing. Now `askedToRead` asks
`getRequestStatusForAuthorization` per kind; the list is gone; `test/ios/healthAskedFromHealthKit.test.ts` reads the source.
Built in the main checkout for the owner's rebuild; **owed: the owner presses Exercise sessions, allows Workouts, sees the walk.**
Lesson: when the phone disagrees with the code, pull the phone's own data before reasoning further.
**MM-691, same evening:** the owner, on the "Read from Apple Health" snack: "it needs a dismiss button right the fuck now."
Every snack now has the Dismiss icon button, with an action or without, and no longer takes focus itself (a tap on a plain
snack focused it, and a focused snack is held by MM-601, so it never went). `MmOverlays.tsx`, `test/ui/snack.test.tsx`.

**Open PRs at the end of Session 53:** none but this handoff's. A new session still checks `gh pr list` first.

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

## Session 53: 2026-10-30, Claude (your foods made with your AI, the Library and the side drawer, MM-703 to MM-710: the Q&A, then three PRs in parallel)

- **The owner's words:** "I'd be more inclined to lean on recording my own foods if the process was easier, but right now it feels disconnected and cumbersome to create foods in the app. This arguably is the next big swing for the application." Take AI meal analysis as the model: a photo to a frontier model with a Martian Macros prompt, JSON back in the app's schema, pasted. And a front door for managing foods; in the Q&A: "the nav bar is becoming a liability. We may consider moving to a proper menu." The owner asked for at least five rounds; there were eight.
- **Settled with the owner:** every answer is in MM-703's Decisions (copy-paste only; photos held while sent; every field required; a required group; the evidence stored; one saved food each; a left drawer with the bar kept; Profile out of Settings with the goals; the Library's folds and rows; three PRs in parallel, the agent merging). The owner pasted the lettering PNG at the end of the Q&A, as asked; it is `design/brand/lettering-art.png`.
- **Built:** see "Where things stand". Three forked builders, one worktree and PR each, from the tickets branch; the tickets PR merged first so every sibling could refer to them. The Library PR landed last and did the cross-PR wiring (the drawer's Library row, the With my AI route, the mark on Library rows).
- **CI:** #375 green first time; #376 three rounds (a story pressing the gone gear; the unseen check); #378 two rounds (the schema column list, the trade catalog refusing every custom origin, text matchers across two elements); #377 three rounds (a sheet above the NavigatorHost cannot `useNavigator`, so the sheet answers `'manage'` and the opener pushes; the unseen check; four test fixes), then a rebase when its siblings merged while it was red.
- **Lessons:** a PR that goes CONFLICTING gets no CI run on later pushes; rebase first. When sibling PRs are wired by "whichever lands later", say so in each PR body so the last builder knows the wiring is theirs. The panel pass was skipped on every screen (the owner dictated all of it).
- **Not run:** nothing was run locally; CI validated the four merges. Not seen on a phone: the whole feature.

## Session 52: 2026-10-29, Claude (move to another phone over the same Wi-Fi, MM-698: the Q&A, then the feature in PR #371)

- **The owner's words:** "We're going to build an Airdrop like feature for Martian Macros where people switching between phones like myself who have both an Android and iPhone can quickly transfer data between one and the other." Then "go ahead do that on a branch from which you'll begin work", then "continue".
- **Settled with the owner:** three AskUserQuestion rounds before the ticket (the answers are MM-698's first Decisions); one more during the build, when the whole-database snapshot turned out to carry settings the Q&A had said stay behind: the owner chose that they travel, as a restore does.
- **Built:** see "Where things stand". The panel (product designer, UX guard, under five minutes together) read the stories from source; their findings and what changed are in MM-698's "Decisions after the panel".
- **CI:** four rounds. The QR component missing from the design-system catalog; a wrapper with `overflow: hidden` (the focus-ring rule); a story typed too narrowly; a test against the nudge's own day rule; text found twice once a status region repeated it (tests read the sheet's paragraph); `cameraOnIos` pins the retail list's exact line; a regex mangled by shell escaping; and the ticket number: main took MM-695 while the branch was open, so the feature became MM-697, and then MM-698 when a parallel session took that too.
- **Lessons:** on Windows, `QrMatrix.ts` and `qrMatrix.ts` are one file, so a type and a function of the same name need different file names (`QrMatrix`, `encodeQr`). Write multi-line code edits with the file tools, not with `node -e` inside double quotes: backticks run as commands and backslashes vanish. Check `mm req next` against `origin/main` again before the first push.
- **The owner's first move, iPhone to Pixel (MM-699, MM-700):** after Replace, "nothing", then the questionnaire. Read off the Pixel on the Windows box (`adb` from the Android SDK; the WebView's DevTools socket forwarded with `adb forward tcp:9233 localabstract:webview_devtools_remote_<pid>`, a small CDP listener in Node): the restore was still running, one INSERT per Apple Health sample across the bridge at about 160 a second, until the app was swiped away and the transaction rolled back. Fixed: a restore in multi-row batches under 999 parameters (MM-699, `test/data/restoreInBatches.test.ts`); after Replace a sheet shows the wait and cannot be closed, a failure is said and logged (MM-700). **Owed:** the same move again on the owner's phones.
- **Lessons:** a dev build's WebView is debuggable over adb, so the app's console and state can be read on the phone without a rebuild. A restore that is one bridge call per row is invisible in browser tests; count statements in a test when the path crosses the bridge.
- **Not run:** nothing was run locally; CI validated. Not seen on a phone: the whole feature; the Swift is checked only by the source-reading tests.

## Session 51: 2026-10-29, Claude (`mm run --phone` went to the emulator, MM-695; "No Android phone connected" when adb would not start, MM-696; an install refused over the Windows box's debug key, MM-697)

- **The owner's words:** "./mm run --phone should push the apk to my pixel if it's connected but it's not it's pushing to the emulator."
- **Cause, from the code:** `chosenDevice` read `--env` and `-d` only; `--phone` existed for `--ios` alone. With the flag ignored the run took the one device adb listed, or booted an emulator when it listed none.
- **Built:** `runTargetOf` (pure, tested) decides phone / exact device / whatever is connected and refuses unknown arguments; `chosenDevice` resolves it against adb. `--phone` and `--env phone` are one thing; `--phone ID` is `-d ID`. Help, README, ticket MM-695 (`in-progress`, under WS-01 `remaining` and step 6), `ws-01` note.
- **Not run, not seen:** nothing run locally (CI validates); adb's server would not start from the agent's shell on the dev Mac (`Unable to create an interface plug-in (e00002be)`, then "ADB server didn't ACK"), so whether the Pixel is in adb's list right now is unknown. If `adb devices` is empty for the owner too, that is a second problem (another process holding the USB interface; `adb kill-server`, unplug, replug) and the old runner would have booted the emulator for the same reason; the new one refuses instead.
- **Second round, the owner's output:** `./mm run --phone` said "No Android phone connected" with the Pixel plugged in. `ioreg` had the Pixel 9 Pro XL with its ADB interface and `IOUserClientCreator = Google Chrome`; adb's server hung under its native backend (`adb nodaemon server` listened but reset every client), and started at once under `ADB_LIBUSB=1`, listing `47261FDAS00EDR device`, `getprop` answering (Android 17). That server was left running. Built MM-696: `deviceIds` retries with `ADB_LIBUSB=1` on a server-start failure and shows adb's own last line instead of "no phone" on any other failure.
- **Third round:** the build reached the Pixel; adb refused the install over the dev app the owner had put there from the Windows box (another debug key; cert `ec274f39…` on the phone, `99bb58d8…` here). Read off the phone: first installed 19:47 that day, data of that day only. Built MM-697: the install step is captured and a signature mismatch is explained with both remedies; the runner never uninstalls.
- **Left for the owner:** which remedy (same key on both boxes, or uninstall and lose that day's data on the Android dev app); everything is uncommitted on `main` in the main checkout; the branch and PR wait on their word. Chrome's hold on the Pixel is a hypothesis for the native backend's hang, not a confirmed cause.
