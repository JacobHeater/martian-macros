# Review: ux-accessibility

## Scope and traceability

- **Role:** UX & accessibility (`agents/roles/ux-accessibility.md`), an assigned review lens, not a credential.
- **Reviewer identity:** read-only subagent of Claude Code session `9c9d02ab` (model `claude-opus-5-5`), run on 2026-10-11. No other reviewer's report was read or searched for.
- **Run:** `mm212-workout-logging-walkthrough`; brief at `C:\Users\jacob\dev\martian-macros\docs\agent-runs\mm212-workout-logging-walkthrough\brief.md`.
- **Baseline:** branch `feature/mm212-usability-by-inspection` at `ca3ff57`, as the brief states. I could not confirm the commit or compute SHA-256 hashes, because I cannot run commands. The brief says the hashes are in `state.json`, which I did not open.
- **Requirements read:**
  - `requirements/training/STORY.log-a-workout.MM-75.md` (in full)
  - `requirements/training/STORY.set-times-and-timers.MM-191.md` (in full)
  - `requirements/training/STORY.exercise-library.MM-76.md` and `STORY.progression-suggestions.MM-79.md` were located and not read. Their screens are surveyed only.
- **Governing documents read in full:** `AGENTS.md`, `agents/roles/ux-accessibility.md`, `agents/panel-protocol.md`, `agents/review-contract.md`, `agents/templates/findings/role.md`.
- **Implementation read in full** (under `apps/mobile/lib/src/`):
  - `train/`: `train_screen.dart`, `workout_screen.dart`, `workout_exercise_card_state.dart`, `set_editor_state.dart`, `set_timer_bar.dart`, `workout_clock_card.dart`, `workout_times_screen.dart`, `exercise_picker_screen_state.dart`, `workout_controller.dart`, `rest_alarm_state.dart`, `haptic_rest_signal.dart`, `ticking_state.dart`
  - `ui/`: `mm_clock_time_dialog_state.dart`, `mm_list_row.dart`, `mm_icon_button.dart`, `mm_icon_button_state.dart`, `mm_segmented.dart`, `mm_text_field.dart`, `show_mm_options.dart`, `show_mm_snack_bar.dart`
  - `format/`: `set_text.dart`, `elapsed_text.dart`, `clock_time_text.dart`, `rest_target_text.dart`, `time_span_problem_text.dart`, `workout_summary_text.dart`, `progression_text.dart`, `progression_settings_text.dart`, and `Fmt.day` in `fmt.dart`
  - `packages/engine/lib/src/`: `rest_started_at.dart`, `rest_target_of.dart`, `place_time_of_day.dart`, `check_set_times.dart`
- **Renders read** (360 by 800 logical pixels, from `apps/mobile/test/goldens/images/`): `train_dark.png`, `workout_dark.png`, `workout_martian.png`, `exercise_picker_dark.png`.
  - `apps/mobile/test/goldens/screen_goldens_test.dart:439-447` shows the workout render is taken straight after tapping `add-set-0`, with no scrolling.
- **Design inputs:** `design/interaction-and-motion.md` lines 60-87 and `design/ux-architecture.md` lines 70-83 were read. `design/screen-direction.md` was searched for training content; it has only a table row for it. `design/voice-and-wording.md` was not read.

## Existing facts versus proposals

**Repository facts** (source inspection; line references in the walkthrough and findings):

- "Add set" saves a set at once, stamps its end as the moment of the tap in a workout in progress, takes the set timer's start if one is running, and opens the set's controls (`workout_controller.dart:150-162`, `workout_exercise_card_state.dart:224-239`).
- Every edit in the set controls is saved as it is made; there is no save, done or close control (`set_editor_state.dart:29-32`, `118-211`).
- A closed set is a row whose tap opens it; the row carries text only, no chevron (`workout_exercise_card_state.dart:154-167`).
- "Finish workout" is the last item in the scrolling list and is disabled until a set has reps (`workout_screen.dart:161-176`).
- The rest signal is one vibration, given only while the workout screen is open (`rest_alarm_state.dart:35-54`, `haptic_rest_signal.dart:10`).

**Approved requirements:** MM-75 and MM-191 ask for one-tap sets, stopping the set timer with the tap that confirms the set, and optional times. A requirement asking for a behaviour does not make a step pass; where a finding touches one, I say the requirement is where a change would have to be made.

**Observed results:** none at runtime. Everything below is source inspection plus four static renders.

**Proposals:** only the "what would have to be true" lines in each finding and the proposed criteria near the end. No redesign is proposed.

## Audit coverage

Mode: `feature`. Method: source inspection and static renders of the built screens. No runtime, emulator, screen reader, text-scale, contrast measurement or user observation.

| Area | Status | Evidence used |
|---|---|---|
| Train destination, populated | walked | source + `train_dark.png` |
| Train destination, first-use empty state | walked | source only (no render) |
| Train destination, "Workout in progress" state | walked | source only |
| Workout in progress: summary, exercise card, set rows | walked | source + `workout_dark.png`, `workout_martian.png` |
| Set editor: reps, load, reps in reserve, Started/Ended, Remove set | walked | source + render (Ended and Remove set are below the fold in the render; source only) |
| Exercise picker, choosing a listed exercise | walked | source + `exercise_picker_dark.png` |
| Set timer bar: idle and resting at 0:00 | walked | source + render |
| Set timer bar: set running, rest counting down, target reached, paused | walked | source only (no render) |
| Rest-target options dialog | walked | source only |
| Set time dialog (`MmClockTimeDialog`) | walked | source only |
| Finished workout, reopened | walked | source only |
| Workout clock card: Pause/Resume | surveyed | paused branch touched in Task 2 only |
| Workout times screen (day, start, end, restart clock) | surveyed | read; no step record; system time and date pickers not inspected |
| Creating an exercise (`custom_exercise_screen*.dart`) | surveyed | entry point read; screen not read |
| Suggestions screen (`progression_settings_screen*.dart`) | surveyed | entry row read; screen not read |
| Personal-records card, "Repeat last workout", remove exercise, delete workout | surveyed | read; no step record |
| Weekly volume, strength trends, histories, Health Connect, exercise science | not inspected | out of scope per brief |

No findings in a surveyed area says nothing about its usability.

**Not inspected:** `MmButton`, `InfoCard`, `MmSurface`, `MmAppBar`, `showMmClockTime`, `showMmTimePicker`, theme tokens, light-theme renders, `requirements/ui-ux-assets/views/train.html`.

**Tests:** I read test names in `apps/mobile/test/train_test.dart`, `workout_times_test.dart` and `rest_target_test.dart`, and the body of `train_test.dart:270-321`. I did not run them.

**Cross-domain referrals:**
- product-designer: visual weight of "Start set" against "Add set"; the look of set rows.
- flutter: effective hit area of the compact segmented control; whether the bottom bar is hidden by the keyboard; timer behaviour when the screen sleeps.
- qa: device, TalkBack and text-scale checks listed under Verification.

**Blocked verification:** anything needing a running app.

## Task walkthroughs

**Person:** someone who lifts and is using the training log for the first time, phone in hand between sets, 360-wide phone. Each step gives: sees / must decide or know / action / sign it worked.

### Task 1: Start a workout and log the first set of a barbell lift

1. **Train tab, nothing logged. PASS.**
   - Sees: "Log your training here, set by set…", a filled "Start workout", and "Weekly training volume" (`train_screen.dart:67-102`). No render of this empty state; `train_dark.png` shows the populated one.
   - Decides: nothing.
   - Action: tap "Start workout".
   - Sign: the Workout screen opens (`train_screen.dart:40-43`).

2. **Empty workout. PASS with a branch that fails (UXA-5).**
   - Sees: title "Workout", a trash icon, "0 exercises · 0 sets", the clock card (running time, "Started h:mm", Pause, "Edit times"), the line "Add the first exercise. Each set is one tap once the first is in.", an outlined "Add exercise", a disabled "Finish workout", and a bottom bar reading "Set timer 0:00" with a filled "Start set" (`workout_screen.dart:122-176`, `set_timer_bar.dart:61-71`, `109-121`).
   - Decides: which button comes first. The sentence says to add an exercise. The only enabled filled button on the screen is "Start set".
   - Action: tap "Add exercise".
   - Sign: the picker opens.
   - Failing branch: "Start set" works with no exercise (`workout_controller.dart:63-64` has no guard) and the bar then says "Tap Add set when the set is done." (`set_timer_bar.dart:101-105`), naming a button that does not exist until an exercise is added.

3. **Choose an exercise. PASS.**
   - Sees: "Choose an exercise", a search field, then rows of name with "Barbell · Quads" beneath (`exercise_picker_screen_state.dart:51-113`; `exercise_picker_dark.png`). On first use there are no "Recent" or "All exercises" headings (`:47-49`), just the alphabetical list.
   - Knows: the lift's name. Search is not focused on arrival, so it costs one tap; scrolling also works.
   - Action: tap the row.
   - Sign: return to the workout with a card titled with the lift (`:110`; `workout_screen.dart:148-157`).

4. **The exercise card before any set. FAILS (UXA-1).**
   - Sees: the card title and a close icon, a row "Suggestions use / 6 to 10 reps · 5 lb steps", a row "Rest target / None", and an outlined "Add set"; the bottom bar's filled "Start set" (`workout_exercise_card_state.dart:168-240`). The sentence from step 2 is gone, since it shows only while there are no exercises (`workout_screen.dart:122`).
   - Must decide: whether to tap "Add set" before lifting (to get a row to fill in) or after; and what "Start set" is against "Add set".
   - What the screen does not say: "Add set" records the moment of the tap as the set's end and starts the rest count from it (`workout_controller.dart:150-162`, `rest_started_at.dart:6-15`). The relation between the two buttons is stated only after "Start set" is tapped.
   - Action: tap "Add set".
   - Sign: see step 5.

5. **The set's controls open. FAILS in part (UXA-3).**
   - Sees: "Set 1", an empty "Reps" field between minus and plus, an empty "Load" field with "lb" between minus and plus, "Reps in reserve (optional)" with 0 to 5+, then "Started / Not timed" (`set_editor_state.dart:128-190`; layout as in `workout_dark.png`). "Ended / h:mm:ss" and "Remove set" are below the fold in the render. The top line now says "1 exercise · 1 set" and the bar says "Rest", counting from 0:00, although no reps have been entered.
   - Knows: reps and load. "Load" with "lb" reads as the weight lifted; "Reps in reserve (optional)" is spelled out here.
   - Action: type or step reps and load.
   - Sign: only the figures in the fields. Each keystroke is saved (`:56-66`), but nothing says so; there is no save, done or close control; and the form stays open.
   - Passing parts: the stepper buttons carry names ("Less: Reps", "More: Load", `:222-236`); the fields start empty rather than at zero (`:34-41`).

**Outcome:** the set can be logged. Two steps fail on meaning and feedback, not on reach.

### Task 2: Log the next set, timing the set and the rest

1. **During the rest. PASS.**
   - Sees: the bar's "Rest" with m:ss counting up (`set_timer_bar.dart:61-71`; "Rest 0:00" in `workout_dark.png`).
   - Decides: nothing. The rest was started by the previous "Add set".
   - Sign: the figure moves each second (`ticking_state.dart:15`).

2. **Optional: set a rest target. PASS from source; no render.**
   - Sees: "Rest target / None" in the card, below the open set's controls and off-screen in the render (`workout_exercise_card_state.dart:189-216`).
   - Action: tap it; a dialog titled "Rest target" lists None, 1:00, 1:30, 2:00, 3:00, 5:00, with the chosen one marked by a check named "Chosen" (`show_mm_options.dart:16-31`).
   - Sign: the row shows the choice and the bar changes to "Rest left · 2:00 target", counting down (`set_timer_bar.dart:53-71`).

3. **The target is reached. PASS for phone in hand, with limits.**
   - Sees: the label becomes "Target rest reached · 2:00 target" and the figure changes from the countdown to the whole rest, counting up.
   - Sign: one vibration (`haptic_rest_signal.dart:10`) and the label, which is a live region (`set_timer_bar.dart:79-88`).
   - Limits: the label keeps the same small secondary style, there is no sound (recorded as not built in MM-191), and the signal is scheduled only while this screen is open (`rest_alarm_state.dart:35-54`). See UXA-8 for the screen-sleep question.

4. **Start the set. PASS.**
   - Sees: a filled "Start set" at bottom right, always in view.
   - Action: tap it.
   - Sign: the label becomes "Set", the figure counts from 0:00, "Tap Add set when the set is done." appears, and the button becomes "Cancel" (`set_timer_bar.dart:61-66`, `101-121`).

5. **End the set. FAILS (UXA-2).**
   - Sees: the instruction to tap "Add set". On a 360 by 800 screen with the previous set's controls open, "Add set" is not on screen.
   - Evidence: `workout_dark.png` is taken straight after "Add set" was tapped and shows the card running under the bottom bar at "Started / Not timed". Below that the source places "Ended", "Remove set", "Suggestions use", "Rest target" and only then "Add set" (`set_editor_state.dart:191-207`, `workout_exercise_card_state.dart:168-240`).
   - Must know: to scroll down past the previous set's controls and two settings rows. The bar's button offers only "Cancel".
   - Action: scroll, tap "Add set".

6. **After "Add set". PASS.**
   - Sees: the previous set collapses to a row "8 × 225 lb · 2 RIR … Set 1"; a new "Set 2" opens with reps and load copied (as in `workout_dark.png`).
   - Sign: the bar returns to "Rest" from 0:00; a timed set's row gains its length, as in "Set 2 · 0:40", once it is closed (`workout_exercise_card_state.dart:159-164`).
   - Decides: whether the copied figures are right; minus and plus adjust them.
   - Note: reps in reserve are not copied (`workout_controller.dart:143-145`) and the control shows nothing chosen.

7. **Branch: the workout was paused. FAILS (UXA-7).**
   - Sees: the bar says "Paused" with 0:00 and a disabled "Start set" (`set_timer_bar.dart:49-52`, `61-62`, `116-120`).
   - Must know: "Resume" is in the clock card at the top of the list (`workout_clock_card.dart:78-89`), which may be scrolled off.
   - Also: pausing during a timed set discards the running set time without a message (`workout_controller.dart:41-46`).

**Outcome:** completable. The step that ends a timed set fails on finding the control, and it recurs on every set.

### Task 3: Fix the time of a set that was recorded wrongly

1. **Find the way in. FAILS for a set that is not open (UXA-4).**
   - Sees: a closed set as a line of text, "8 × 225 lb · 2 RIR" with "Set 1" or "Set 1 · 0:40" at the right, and no chevron or edit mark (`workout_exercise_card_state.dart:154-167`; `workout_dark.png`, the Set 1 line).
   - Contrast: "Started", "Suggestions use" and "Rest target" in the same card each carry a chevron.
   - Must know: tapping the line opens it. The line shows a length, never the clock times.
   - Action: tap the line.
   - Sign: the controls open in place.
   - For the set currently open, the time rows are already in its controls and this step passes.

2. **Find the times. PASS, with scrolling.**
   - Sees: "Started / 6:02:10 PM" or "Not timed", and "Ended / 6:02:50 PM", each with a chevron (`set_editor_state.dart:183-198`).
   - Decides: which one is wrong. A set logged without the timer shows "Started / Not timed"; MM-191 intends that.

3. **Enter the time. PASS from source; no render.**
   - Sees: a dialog titled "Set started" or "Set ended" with fields "Hour", "Min", "Sec", an AM/PM control, "Cancel" and "OK" (`mm_clock_time_dialog_state.dart:75-127`). It opens on the time the set has, or on the set's end or the workout's start when it has none (`set_editor_state.dart:88-99`).
   - Must do: tap a field, delete its digits and type new ones; no field is focused on opening.
   - A number that is no time is refused in the dialog, in words, in a live region, and the dialog stays open (`:36-51`, `98-110`).

4. **A time that makes sense. PASS.**
   - Sign: the dialog closes and the row shows the new time, saved at once (`set_editor_state.dart:114`). The set's length is not shown while its controls are open (see UXA-3).

5. **A time that is refused. FAILS in part (UXA-6).**
   - Sees: the dialog has already closed; a message appears at the bottom: "The end has to be after the start.", "That is before the workout started.", "That is after the workout, or still to come." or "That overlaps another set in this workout." (`set_editor_state.dart:109-113`, `time_span_problem_text.dart:5-11`).
   - Sign that the old time was kept: the row is unchanged. The message does not say so.
   - Must do: reopen the dialog and enter the time again. For an overlap, the person must also work out which set it is and what its times are; the message does not say, and opening another set of the same exercise closes this one (`workout_exercise_card_state.dart:30`, `166`).

**Outcome:** completable once the way in is known.

### Task 4: Finish the workout and find it again

1. **Find "Finish workout". PASS, with a note.**
   - Sees: nothing about finishing until the list is scrolled to its end. The filled "Finish workout" sits below every exercise card and "Add exercise" (`workout_screen.dart:136-176`); it is not in `workout_dark.png`. The top bar holds only back and delete.
   - Decides: to scroll to the bottom.
   - Note: the button is disabled, with no reason given, until a set has reps (`:167-170`).
   - Note: leaving by the back arrow does not finish the workout. Train then shows "Workout in progress" with "Continue" (`train_screen.dart:48-65`), which is a sign, but the clock keeps running.

2. **Tap "Finish workout". PASS.**
   - Action: one tap, no confirmation (`workout_screen.dart:171-174`).
   - Sign: return to Train, where "Start workout" and "Repeat last workout" are back and a "Workouts" card lists "Today / 1 exercise · 2 sets · 12 min" at the top (`train_screen.dart:77-124`, `fmt.dart:44-50`, `workout_summary_text.dart:6-17`). There is no other message.
   - See UXA-10 for a mistaken tap.

3. **Find it again. PASS.**
   - Sees: on the Train tab, a "Workouts" card with one row per workout: the day, then exercises, sets and minutes, and a chevron (`train_dark.png`).
   - Decides: which row. Rows differ only by day; exercise names are not shown, and the two rows in the render read the same apart from the date.
   - Action: tap the row.

4. **The reopened workout. PASS from source; no render.**
   - Sees: "Workout, Today", the clock card with length and "6:02 PM to 6:14 PM", "Edit times", each exercise with its set lines, "Add set" and "Add exercise", and no timer bar or finish button (`workout_screen.dart:56-83`, `161`; `workout_clock_card.dart:59-76`).
   - Correcting a set is as in Task 3, with UXA-4 applying.

**Outcome:** passes.

## Findings

All are from source inspection and static renders. None was reproduced at runtime; none was observed with users.

### UXA-1: "Add set" stamps the set's end time and starts the rest, and nothing says so
- **Domain:** ux-accessibility
- **Classification:** usability problem found by inspection
- **Severity:** medium. Met on every set by anyone who taps "Add set" before lifting in order to enter planned figures; easy to get past (the set is still logged); recurs each time and leaves wrong times without notice.
- **Confidence:** high on behaviour (read in source); medium on how the label reads to a new person (analytical).
- **Rule:** contract walkthrough rule, "could not tell what a value means or which value will be kept".
- **Evidence:** Task 1 step 4. `workout_controller.dart:150-162`; `rest_started_at.dart:6-15`; `workout_exercise_card_state.dart:218-239`. The explanatory line exists only while the workout has no exercises (`workout_screen.dart:122-130`). The relation between the two buttons is stated only after "Start set" (`set_timer_bar.dart:101-105`).
- **Expected:** before choosing, the person can tell that "Add set" means "the set is done now".
- **Observed:** the label reads as making a row. The recorded "Ended" time is below the fold of the opened controls in `workout_dark.png`.
- **Impact:** rests counted from the wrong moment, and set times kept that the person did not mean to record.
- **Where a change would have to be made:** MM-191 decides that confirming the set is what ends it.
- **What would have to be true:** the screen says, where "Add set" is offered, that it records a finished set and when.
- **Verification:** source inspection only.

### UXA-2: With a set open, "Add set" is off-screen when the bar tells the person to tap it
- **Domain:** ux-accessibility
- **Classification:** usability problem found by inspection
- **Severity:** medium. Met on every set after the first of an exercise; got past by scrolling roughly a third of a screen (my estimate from the render and usual row heights, not measured); recurs each set, mid-workout.
- **Confidence:** high. The render is taken immediately after "Add set" with no scrolling (`screen_goldens_test.dart:439-447`).
- **Rule:** walkthrough rule, "would not find the control". `design/interaction-and-motion.md:83-84` asks for frequent actions in thumb reach; `design/ux-architecture.md:77-78` asks that logging be optimised for use between sets.
- **Evidence:** Task 2 step 5. `workout_dark.png` and `workout_martian.png`; `set_editor_state.dart:183-207`; `workout_exercise_card_state.dart:168-240`; `set_timer_bar.dart:101-121`.
- **Expected:** the control that ends a timed set is on screen when the set ends.
- **Observed:** the always-visible bar offers only "Cancel"; "Add set" is below the open controls and two settings rows.
- **Impact:** a scroll before every set is logged, and timed sets that run longer than the lift by the time taken to find the button.
- **Where a change would have to be made:** the layout of the card and bar. MM-75's "one tap" is met in count, not in reach.
- **What would have to be true:** at 360 by 800 the control that confirms a set is visible without scrolling while a set is being timed.
- **Verification:** static render; not checked on a device or at other heights.

### UXA-3: Nothing says a set is saved, the form cannot be closed, and some typed values are not the ones kept
- **Domain:** ux-accessibility
- **Classification:** usability problem found by inspection
- **Severity:** low to medium. The missing sign is met on the first set and is learned after that. The value mismatch is met only when a field is left empty or holds a decimal.
- **Confidence:** high (source).
- **Rule:** walkthrough rule, "gets no sign of the result" and "which value will be kept".
- **Evidence:** Task 1 step 5; Task 3 step 4.
  - Saved per keystroke, with no save, done or close control: `set_editor_state.dart:29-32`, `118-211`.
  - Only another set's row or "Add set" closes the form: `workout_exercise_card_state.dart:30`, `166`, `226`.
  - A cleared "Reps" field, or reps typed with a decimal point, is ignored and the earlier figure stays stored while the field shows otherwise: `set_editor_state.dart:56-60`. The field's keyboard offers a decimal point: `mm_text_field.dart:38-41`.
  - A cleared "Load" behaves the same: `set_editor_state.dart:62-66`.
  - The set is counted in "1 set" before any reps exist: `workout_controller.dart:153-161`; `workout_summary_text.dart:12`.
  - A timed set's length shows only on the closed row: `workout_exercise_card_state.dart:159-164`.
- **Expected:** the person can tell the set is logged and what was kept.
- **Observed:** no sign beyond the field contents; what is stored can differ from what is shown.
- **Impact:** hesitation at the first set; occasionally a stored figure the person did not see.
- **What would have to be true:** what the field shows is what is stored, or the difference is said; there is a visible sign that a set is kept.
- **Verification:** source only. The ignored-input cases have no test that I found among the test names read.

### UXA-4: A logged set does not look like something that can be opened
- **Domain:** ux-accessibility; referral to product-designer for the visual side
- **Classification:** usability problem found by inspection
- **Severity:** medium. Met whenever an earlier set needs correcting, including on a finished workout. Got past only by trying a tap. Does not recur once learned.
- **Confidence:** high on what is drawn; medium on whether a new person would try the tap.
- **Rule:** walkthrough rule, "would not find the control".
- **Evidence:** Task 3 step 1. `workout_exercise_card_state.dart:154-167` (trailing is text, no icon); `workout_dark.png` Set 1 line. The other tappable rows in the same card carry chevrons (`:181`, `:195`; `set_editor_state.dart:188`, `196`).
- **Expected:** the way to correct a set is visible.
- **Observed:** a plain line of text is the only way to a set's reps, load and times.
- **Impact:** a wrong set or time may be left wrong.
- **What would have to be true:** a closed set shows that it opens, as the other rows in the card do.
- **Verification:** static render and source.

### UXA-5: "Start set" works with no exercise, and its instruction names a button that is not there
- **Domain:** ux-accessibility
- **Classification:** usability problem found by inspection
- **Severity:** low. Met on a new workout or when moving to an exercise not yet added. Got past by adding the exercise. The set time then includes the time spent choosing.
- **Confidence:** high (source).
- **Evidence:** Task 1 step 2. `workout_controller.dart:63-64`; `set_timer_bar.dart:101-121`; `workout_screen.dart:122-160`. The timer survives adding an exercise, because `addExercise` copies the workout unchanged otherwise (`workout_controller.dart:105-116`).
- **Expected:** the instruction points at something on screen.
- **Observed:** "Tap Add set when the set is done." with no "Add set" until an exercise exists.
- **What would have to be true:** the bar's instruction matches what the screen offers at that moment.
- **Verification:** source only.

### UXA-6: A refused set time closes the entry first, loses what was typed, and does not say which set it clashes with
- **Domain:** ux-accessibility
- **Classification:** usability problem found by inspection
- **Severity:** low. Met only when a typed time is refused. Got past by re-entering. More likely in a workout with many timed sets.
- **Confidence:** high (source).
- **Evidence:** Task 3 step 5. `set_editor_state.dart:91-113` (the check runs after the dialog returns); `time_span_problem_text.dart:5-11`; `check_set_times.dart:23-45`.
- **Expected:** the person can see why the time was refused and correct it in place.
- **Observed:** a passing message, the old time kept without that being said, and "another set" unnamed.
- **Where a change would have to be made:** MM-191 asks that a refusal give "the reason"; whether the reason includes which set is for that ticket.
- **Verification:** source only. Tests exist for refusal (`workout_times_test.dart:396-531` by name); not run by me.

### UXA-7: While paused, the bar gives no route to resume, and pausing drops a running set time silently
- **Domain:** ux-accessibility
- **Classification:** usability problem found by inspection
- **Severity:** low. Met only after a pause.
- **Confidence:** high (source); no render.
- **Evidence:** Task 2 step 7. `set_timer_bar.dart:49-62`, `116-120`; `workout_clock_card.dart:78-89`; `workout_controller.dart:41-46`.
- **Expected:** a disabled control says what would enable it; a discarded timing is said.
- **Observed:** "Paused", 0:00 and a disabled button; "Resume" is at the top of the list.
- **Verification:** source only.

### UXA-8: Whether the rest signal and countdown survive the screen turning off is not established
- **Domain:** ux-accessibility; referral to flutter and qa
- **Classification:** unverified hypothesis requiring investigation
- **Severity:** medium if it holds, since rests of 1 to 5 minutes are offered and the signal is the only cue when the phone is not being watched.
- **Confidence:** low. I found no screen-wake handling in `apps/mobile` (search for wakelock and keep-screen-on in dart, yaml, xml and kt files returned nothing). I do not know how the scheduled timer (`rest_alarm_state.dart:53`) behaves when the display sleeps.
- **Evidence:** `rest_alarm_state.dart:35-54`; `haptic_rest_signal.dart:10`. MM-191 "Not built" records no sound, no background signal, and that the vibration was not felt on a phone.
- **Needed:** a device check of a 2-minute target with the default screen timeout: whether the vibration is given, and what the bar shows on waking.
- **Verification:** not verified.

### UXA-9: Screen-reader wording and target size of set controls are unchecked
- **Domain:** ux-accessibility
- **Classification:** unverified hypothesis requiring investigation
- **Severity:** low to medium.
- **Confidence:** low; static source cannot settle these.
- **Evidence:**
  - A set row's text is "8 × 225 lb · 2 RIR" with "Set 1 · 0:40" after it, and has no spoken form (`set_text.dart:9-23`; `workout_exercise_card_state.dart:154-165`). The timer does have one (`set_timer_bar.dart:92-94`).
  - The reps-in-reserve buttons are labelled "0" to "5+", with their heading as a separate text (`set_editor_state.dart:164-181`).
  - The reps-in-reserve control is drawn about 32 logical pixels high in `workout_dark.png` (my reading of the image) and uses compact density (`mm_segmented.dart:29-31`). `design/interaction-and-motion.md:83` asks for 48 by 48 "including … set controls". Its effective touch area was not determined.
  - Text scaling of the bottom bar's row (`set_timer_bar.dart:40-122`) and of the three-field time dialog (`mm_clock_time_dialog_state.dart:82-90`) at 360 wide was not checked.
  - No contrast was measured.
- **Needed:** a TalkBack pass on a set row, the reps-in-reserve control and the time dialog; the hit area of the segmented control; 200% text on the workout screen and dialog.
- **Verification:** not verified. No accessibility conformance is claimed or denied.

### UXA-10: "Remove set" and "Finish workout" act at once, with no undo and no way back
- **Domain:** ux-accessibility
- **Classification:** design/usability improvement
- **Severity:** low.
- **Confidence:** high on behaviour.
- **Rule:** `design/interaction-and-motion.md:69` ("Undo for reversible deletes") and `:84-85`.
- **Evidence:**
  - "Remove set" deletes without confirmation or undo (`workout_exercise_card_state.dart:148-151`; `set_editor_state.dart:199-207`). Removing an exercise with sets, and deleting a workout, do ask.
  - "Finish workout" sits directly under "Add exercise" and ends the workout in one tap (`workout_screen.dart:136-176`). The screen offers no control to put a finished workout back in progress; the timer bar is not shown for one (`:78-83`).
- **Note:** whether either warrants a change is a product decision. This is not a requirement violation; no ticket asks for undo here.
- **Verification:** source only.

## Sources and evidence

External sources consulted: none.

Repository evidence: the files and renders listed under Scope, cited by line in the walkthrough and findings. `docs/evidence.md` was not consulted; no claim here rests on it.

## Research

Status: **unnecessary.**

- Question considered: whether any finding rests on a current platform convention or accessibility standard that needs a source.
- Reason: no finding asserts one. The only rules cited are the repository's own design documents and the contract's walkthrough rule. Where a standard would be relevant (touch target size, contrast, screen-reader output), the item is recorded as unverified in UXA-9, not asserted.
- Execution surface: Claude Code subagent. Web search and fetch tools were present and not used.
- For `state.json`: research `unnecessary`, no sources.

## Confidence and limitations

- **High** on what the source does: each behaviour cited was read at the lines given.
- **Medium** on the walkthrough judgments: they are analytical, made for one described person, and measure nothing about how many people would fail a step.
- **Low** on UXA-8 and UXA-9, which need a device.
- Renders are static and cover four states. The running set timer, countdown, target reached, paused bar, rest-target dialog, time dialog, empty Train state and reopened finished workout were walked from source alone.
- Sizes quoted from renders are my reading of the images, not measurements from a layout tool.
- No commands were run: no tests, no app, no hashes. No screen reader, text scale, contrast measurement, reduced-motion or one-handed reach check.
- I did not open the HTML drawing in `requirements/ui-ux-assets/`, so I make no statement about whether it shows these states.
- `design/voice-and-wording.md` was not read; wording was judged only for whether a step can be completed.
- This is a single reviewer's pass. Independence from the other reviewer rests on my not having read their report.

## Acceptance criteria and edge cases

**Existing criteria traced:**

| Criterion | Built at | Test (by name, not run) | Finding that bears on it |
|---|---|---|---|
| MM-75 "Logging a set quickly" | `workout_controller.dart:150-162` | `train_test.dart:98` | UXA-2: one tap, but not in reach |
| MM-191 "Timing a set" | start to "Add set" | `workout_times_test.dart:304` | UXA-2, UXA-5 on what the interval then includes |
| MM-191 "A set without the timer" | end only | `workout_times_test.dart:340` | UXA-1 on what that end time means |
| MM-191 "Times that cannot be", "Overlapping typed sets" | refusal with reason | `workout_times_test.dart:396-531` | UXA-6 on recovery |
| MM-191 "The target is reached" | label and one vibration | `rest_target_test.dart:172` | UXA-8 on a sleeping screen |

**Proposed criteria** (proposals only, for the owner to accept, change or decline):

- While a set is being timed on a 360 by 800 screen, the control that confirms the set is visible without scrolling.
- Where "Add set" is offered, the screen states that it records a finished set at that moment.
- A closed set shows that it can be opened.
- A reps or load field never shows a value different from the one stored without saying so.
- A refused set time leaves the entry open with the typed values, or says the previous time was kept.
- A rest target reached while the display is off is signalled or, on waking, shown as reached.

**Edge cases met in the source:**

- Empty or decimal reps (UXA-3).
- A set added with zero reps counts as a set and shows as "0 × 0 lb" (`set_text.dart:14`).
- Starting a set with no exercise (UXA-5).
- Pausing mid-set (UXA-7).
- A start typed for an untimed set opens on the set's end, so confirming unchanged is refused with "The end has to be after the start." (`set_editor_state.dart:89`).
- A workout left by the back arrow keeps running; its end can be typed only after finishing (`workout_times_screen.dart:149`).
- Two workouts on different days read identically apart from the date (`train_dark.png`).

## Dependencies

- **product-designer:** UXA-1, UXA-2, UXA-4. Challenge question: is the filled "Start set" against the outlined "Add set" the intended order of emphasis, given that "Add set" is the only control that logs anything?
- **flutter:** UXA-8, UXA-9. Is the bottom bar covered by the keyboard while reps are typed? What is the hit area of a compact segmented control? Does the scheduled rest timer fire with the display off?
- **training / product:** UXA-1 touches MM-191's decision that confirming a set ends it; a change there is a requirement change.
- **qa:** the device checks under Verification.
- **Tickets:** MM-75, MM-191. I allocated none; routing is the chair's.

## Safety concerns

None found within this scope.

- The rest-reached wording ("Target rest reached") does not instruct the person to lift, as MM-191 intends.
- Nothing in the walked flow is time-limited.
- Inaccurate set times (UXA-1, UXA-2) could later be written to a health platform as segments under MM-189. That is a data-accuracy point for the measurement and integrations roles, outside this run's scope.

This is not clinical clearance.

## Unresolved product decisions

1. Should "Add set" keep its double meaning (make a row, and stamp the end of a set)? Alternatives: keep and explain it; or separate the two. Affects MM-191. Authority: product owner.
2. Should removing a set be undoable, and should finishing be reversible or confirmed (UXA-10)? Authority: product owner; design rule at `design/interaction-and-motion.md:69`.
3. Is a rest signal with the display off in scope before MM-146's background notification (UXA-8)? Authority: product owner.

## Verification

- **Run by me:** nothing. Read-only; no commands.
- **Inspected:** the source files and four renders listed under Scope; test names in `train_test.dart`, `workout_times_test.dart` and `rest_target_test.dart`; the body of `train_test.dart:270-321`.
- **Requested of the chair or edit owner:**
  1. Renders at 360 by 800 of: a set being timed with a previous set open (to confirm UXA-2 in the "Set" state); the bar while paused; the time dialog; the rest-target dialog; a reopened finished workout; the empty Train state.
  2. A widget test or run showing stored reps against field text after clearing the field and after typing "8.5" (UXA-3).
  3. A device check for UXA-8.
  4. A TalkBack reading, a 200% text check, and the hit area of the reps-in-reserve control (UXA-9).
- No result above is a runtime reproduction or a test outcome.

## Targeted challenges

none
