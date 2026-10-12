# Review: product-designer

## Scope and traceability

- **Role:** Product designer (`agents/roles/product-designer.md`), read-only reviewer for run `mm212-workout-logging-walkthrough`.
- **Reviewer identity:** subagent of chair session `9c9d02ab`, model `claude-opus-5-5`. No other reviewer's report was seen or looked for.
- **Brief:** `C:\Users\jacob\dev\martian-macros\docs\agent-runs\mm212-workout-logging-walkthrough\brief.md`.
- **Requirements inspected (all under `C:\Users\jacob\dev\martian-macros\requirements\training\`):**
  - `STORY.log-a-workout.MM-75.md`
  - `STORY.exercise-library.MM-76.md`
  - `STORY.progression-suggestions.MM-79.md`
  - `STORY.set-times-and-timers.MM-191.md`
- **Commit:** branch `feature/mm212-usability-by-inspection` at `ca3ff57`, as the brief states. I did not verify the commit myself (no shell).
- **Input hashes:** not computed (no shell). The brief says they are in `state.json`, which I did not open.
- **Renders read** (720 x 1600 images, taken as 360 x 800 logical at 2x), in `C:\Users\jacob\dev\martian-macros\apps\mobile\test\goldens\images\`:
  - `train_dark.png`
  - `workout_dark.png`
  - `workout_martian.png`
  - `exercise_picker_dark.png`
- **Source read in full** under `C:\Users\jacob\dev\martian-macros\apps\mobile\lib\src\`:
  - `train\`: `train_screen.dart`, `workout_screen.dart`, `workout_exercise_card_state.dart`, `set_editor_state.dart`, `set_timer_bar.dart`, `workout_clock_card.dart`, `workout_times_screen.dart`, `exercise_picker_screen_state.dart`, `workout_controller.dart`
  - `ui\`: `mm_list_row.dart`, `mm_button.dart`, `info_card.dart`, `mm_icon_button.dart`, `show_mm_clock_time.dart`, `mm_clock_time_dialog.dart`, `mm_clock_time_dialog_state.dart`, `show_mm_options.dart`
  - `format\`: `set_text.dart`, `workout_summary_text.dart`, `rest_target_text.dart`, `progression_text.dart`, `progression_settings_text.dart`, `elapsed_text.dart`, `clock_time_text.dart`, `time_span_problem_text.dart`, and `Fmt.day` in `fmt.dart:44-50`
- **Design inputs:**
  - `design\screen-direction.md` (full)
  - `design\design-principles.md:24-37`
  - `design\visual-language.md:136-147`
  - `design\ux-architecture.md:72-79`
  - `design\interaction-and-motion.md` and `design\voice-and-wording.md` only through a keyword search of `design\`
- **Test inspected:** `apps\mobile\test\goldens\screen_goldens_test.dart:288-306`, to learn what state the workout render shows.

## Existing facts versus proposals

**Repository facts (source and renders):**

- The workout render is taken after tapping Continue and then `add-set-0` (`screen_goldens_test.dart:299-305`). The "Set 2" form in `workout_dark.png` is therefore a set that is already recorded, not a draft.
- "Add set" records the set immediately. It copies the previous set, stamps `endedAt` as now, and takes `startedAt` from the set timer if one was running (`workout_controller.dart:150-162`). It then opens that set's controls (`workout_exercise_card_state.dart:224-239`).
- Every field change is saved as it is made (`set_editor_state.dart:29-32`). The editor has no save or done control; its only button is "Remove set" (`set_editor_state.dart:199-207`).
- An open editor closes only when another set is opened or added, or when the set or exercise is removed (`workout_exercise_card_state.dart:98, 149, 166, 226`). There is no control that collapses it.
- The card's order is: last time, suggestion, sets (row or editor), "Suggestions use" row, "Rest target" row, "Add set" (`workout_exercise_card_state.dart:105-240`).
- The workout screen has three buttons of kind primary:
  - "Start set" in the bottom bar (`set_timer_bar.dart:109-114`)
  - "Finish workout" at the end of the list (`workout_screen.dart:163-175`)
  - "Resume" while paused (`workout_clock_card.dart:79-85`)

**Approved requirements and design rules:**

- MM-75: "a typical set is confirmed with one tap and adjusted with large plus and minus buttons."
- MM-191: "Stopping it is the same tap that confirms the set"; the rest "is not stored as its own record."
- `design-principles.md:31`: "One primary action per screen, in Ember."
- `visual-language.md:146`: "Train (later) | Large, high-contrast set controls | History."
- `ux-architecture.md:77-79`: "Keep workout logging optimized for use between sets."
- `screen-direction.md` has no section for Train or the workout screen.

**Proposals:** only the "what would have to be true" lines under each finding and the proposed criteria further down. Nothing here is a redesign, and nothing was observed with users.

## Audit coverage

Mode: `feature`. Method: source inspection plus the four renders. No runtime, emulator or test execution.

| Area | Status | Evidence |
|---|---|---|
| Train destination, populated | walked | source and `train_dark.png` |
| Train destination, first use (no workouts) and "Workout in progress" card | walked | source only (`train_screen.dart:48-76`) |
| Workout in progress with a set editor open | walked | source and `workout_dark.png`, `workout_martian.png` |
| Workout in progress, empty and first exercise with no history | walked | source only |
| Exercise picker, with recents | walked | source and `exercise_picker_dark.png` |
| Exercise picker, first use (no "Recent" group) | walked | source only |
| Set editor: reps, load, reps in reserve, Started/Ended rows | walked | source; render down to the "Started" row only |
| Set timer bar: idle and rest counting up | walked | source and render ("Rest 0:00") |
| Set timer bar: set running, counting down, target reached, paused | walked | source only |
| Set time dialog (`MmClockTimeDialog`) | walked | source only |
| Workout clock card, in progress | walked | source and render |
| Workout clock card, finished or paused | walked | source only |
| Workout times screen | walked as a wrong turn in task 3 | source only |
| Finished workout reopened | walked | source only |
| Rest-target options dialog (`showMmOptions`) | surveyed | source |
| Create your own exercise (`custom_exercise_screen*.dart`) | surveyed | entry point only |
| Suggestions settings (`progression_settings_screen*.dart`) | surveyed | row only; exercise science is out of scope |
| Personal-records card on the workout | surveyed | `workout_screen.dart:95-121` |
| Delete workout and remove-exercise confirms | surveyed | source |
| Weekly volume, strength trends, Health Connect | not inspected | out of scope per brief |
| Light theme, text scaling, screen reader, keyboard-open layout | not inspected | no render; UX-accessibility remit |
| `requirements/ui-ux-assets/views/train.html` | not consulted | — |

No findings in a surveyed area says nothing about its usability.

## Task walkthroughs

The person in every task: someone who lifts, using the training log for the first time, phone in hand between sets, on a 360-wide phone.

### Task 1: Start a workout and log the first set of a barbell lift

| # | What the person sees | Must decide or know | Action | Sign it worked | Result |
|---|---|---|---|---|---|
| 1 | Train, first use: a paragraph ("Log your training here, set by set…"), a full-width Ember "Start workout", an outlined "Weekly training volume" (`train_screen.dart:67-102`). The populated form in `train_dark.png` has "Start workout" as the only fill at the top. | Nothing. | Tap "Start workout". | The Workout screen opens (`train_screen.dart:40-43`). | Pass |
| 2 | Empty workout, source only. Top to bottom: "0 exercises · 0 sets"; the clock card with the largest figure on the screen, Pause and an accent "Edit times"; a sentence "Add the first exercise. Each set is one tap once the first is in."; outlined "Add exercise"; a disabled Ember "Finish workout"; the bottom bar "Set timer 0:00" with an enabled Ember "Start set" (`workout_screen.dart:87-176`, `set_timer_bar.dart:61-66, 109-121`). | That the outlined button is the next step, not the one enabled filled button. The sentence says so. | Tap "Add exercise". | The picker opens. | Pass, with concern PD-5: the only enabled Ember control is not the next action. Tapping it shows "Tap Add set when the set is done." with no "Add set" on screen (`set_timer_bar.dart:101-105`). |
| 3 | Picker (`exercise_picker_dark.png`): title "Choose an exercise", a search field first, then two-line rows (name; "Barbell · Chest"). With no history there is no "Recent" group and the list starts at "Ab wheel rollout" (`exercise_picker_screen_state.dart:47-49`). | The lift's name. Equipment is in the second line. | Type in search or scroll; tap a row. | Back on the workout with a card titled with the exercise (`workout_screen.dart:148-157`). | Pass |
| 4 | New card, source only: title and a close icon, a "Suggestions use / 6 to 10 reps · 5 lb steps" row, a "Rest target / None" row, an outlined "Add set". Below it "Add exercise" and the disabled "Finish workout". In the bar, Ember "Start set". The step-2 sentence is gone (`workout_screen.dart:122`). | Whether to tap "Start set" or "Add set", and whether "Add set" comes before or after the lift. Nothing on the screen says. The first things in the card are two settings rows. | Tap "Add set". | An editor opens. | Pass, same concern PD-5. Either control leads forward; "Start set" then gives the hint. |
| 5 | Editor: "Set 1", an empty "Reps" field between a minus and a plus, an empty "Load … lb" field likewise, "Reps in reserve (optional)" with six segments, "Started / Not timed", "Ended / <time>", "Remove set" (`set_editor_state.dart:128-207`). | Reps and load. That reps in reserve is optional is labelled. | Type or step the values. | The fields show them. | Pass. See PD-7 on the weight of the plus and minus. |
| 6 | The same form, still open. The summary line reads "1 exercise · 1 set" and the bar reads "Rest" and counts. The next button down the card is "Add set". | Whether the set is kept. Nothing in the editor says so, and it cannot be closed. | None needed, but the person does not know that. | Only the count in the quiet summary line (`workout_screen.dart:87-91`) and the bar's label. | **Fails: PD-1** |

### Task 2: Log the next set, timing the set and the rest

| # | What the person sees | Must decide or know | Action | Sign it worked | Result |
|---|---|---|---|---|---|
| 1 | Bottom bar: small quiet "Rest", a counting figure, Ember "Start set" (`workout_dark.png`; `set_timer_bar.dart:61-71`). The rest counts up with no setup. | Nothing. A countdown needs the "Rest target" row in the card, which is below the fold while an editor is open. | Wait. | The figure counts. | Pass |
| 2 | The same bar. | That "Start set" is tapped when the lift begins. | Tap "Start set". | Label becomes "Set", the figure restarts, a line "Tap Add set when the set is done." appears, the button becomes outlined "Cancel" (`set_timer_bar.dart:61-64, 101-114`). | Pass for the set timer. The rest figure just timed is replaced and shown nowhere afterwards: PD-8. |
| 3 | After the lift: the bar tells them to tap "Add set". In `workout_dark.png` the card's visible content ends at "Started / Not timed"; "Ended", "Remove set", "Suggestions use", "Rest target" and "Add set" are below the bar. | Where "Add set" is, and which one if there are two exercises. | Scroll the card, then tap "Add set". | — | **Fails: PD-2.** The control the bar names is off-screen, and the tap that ends the timed set comes after a scroll. |
| 4 | The bar flips to "Rest" from 0:00. The previous set collapses to a row. A new "Set 3" form opens with the previous numbers, Started and Ended filled (`workout_controller.dart:150-162`; `workout_exercise_card_state.dart:124-167, 224-239`). "Add set" has moved one row further down. | That this form is the set just done and is already kept. | Adjust reps or reps in reserve if they differed. | The bar label; the summary count. | **Fails on the same ground as task 1 step 6: PD-1** |
| 5 | Rest counting: "Rest", or "Rest left · 2:00 target" counting down, then "Target rest reached · 2:00 target" with the figure switching to the whole rest and counting up (`set_timer_bar.dart:50-71`). Source only. | That the same figure means time left before the target and time rested after it. The small label above it says which. | None. | Label change; one vibration (MM-191). | Pass from source. Not rendered, so legibility of the label beside the button at this width is unverified. |

### Task 3: Fix the time of a set that was recorded wrongly

| # | What the person sees | Must decide or know | Action | Sign it worked | Result |
|---|---|---|---|---|---|
| 1 | A logged set as a row: "8 × 225 lb · 2 RIR" with small trailing "Set 1" (`workout_dark.png`), or "Set 1 · 0:42" when it was timed (`workout_exercise_card_state.dart:154-165`). A set logged without the timer shows no time. | That something about a set's time is wrong. Only a timed set's length is visible, as a small trailing figure. | — | — | Pass for a timed set. An untimed set's end time is not visible until it is opened; noted under PD-6. |
| 2 | The only control on the screen that mentions times is "Edit times", in the accent colour, in the first card (`workout_dark.png`; `workout_clock_card.dart:92-104`). The set row has no chevron or other mark, while "Started", "Suggestions use", "Rest target" and the Train history rows all have one. | That the row itself is the way in. | Tap the set row. | The row becomes the editor (`workout_exercise_card_state.dart:166`). | **Fails: PD-3** (the row gives no sign it opens) **and PD-4** ("Edit times" is met first and leads to the workout's day and start, `workout_times_screen.dart:103-185`). |
| 3 | Editor in place; any other open editor collapses. "Started" and "Ended" rows with their values and chevrons are last, above "Remove set" (`set_editor_state.dart:183-198`). | Which of the two is wrong. | Tap "Ended" (or "Started"). | A dialog opens. | Pass. A scroll is likely; in the render the "Ended" row is below the fold. |
| 4 | Dialog, source only: title "Set ended"; three number fields "Hour", "Min", "Sec"; an AM/PM segmented control; "Cancel" and "OK". It opens on the current value, or on the set's end or the workout start when there is none (`set_editor_state.dart:87-99`; `mm_clock_time_dialog_state.dart:75-127`). | The right time, to the second. | Type and tap "OK". | The dialog closes. An out-of-range number shows a line in the danger colour in the dialog (`mm_clock_time_dialog_state.dart:43-51, 98-110`). | Pass from source. Not rendered; the fit of three fields at 360 wide is unverified. |
| 5 | The row's second line shows the new clock time. A refused time shows a snack bar with the reason and the row keeps its old value (`set_editor_state.dart:109-114`; `time_span_problem_text.dart:5-11`). | Whether the set's length is now right. The editor shows two clock times and no length; the length is only on the collapsed row. | — | The changed clock time only. | **Fails in part: PD-6** |

### Task 4: Finish the workout and find it again

| # | What the person sees | Must decide or know | Action | Sign it worked | Result |
|---|---|---|---|---|---|
| 1 | While logging, "Finish workout" is not on screen: it is the last item of the list, after every exercise card and "Add exercise" (`workout_screen.dart:136-176`). The bar keeps an Ember "Start set" at all times. Scrolled to the end, an Ember "Finish workout" sits directly above it (source only). | That finishing is at the end of the page. | Scroll to the end; tap "Finish workout". | — | Pass: reachable by scrolling to the end of the list. Concern PD-5 (two Ember fills together; not rendered). The button is disabled with no reason shown until a set has reps (`workout_screen.dart:169-170`); referred to UX. |
| 2 | The screen closes back to Train (`workout_screen.dart:171-174`). | Nothing. | — | Train no longer shows "Workout in progress". The "Workouts" card has a top row "Today / n exercises · n sets · n min" with a chevron (`train_screen.dart:103-124`; `fmt.dart:44-46`; layout as `train_dark.png`). "Repeat last workout" appears if this was the first. | Pass. No transient message; the new row is the sign. |
| 3 | The "Workouts" card with a dated row per workout, newest first. | Which day. | Tap the row. | The workout opens, titled "Workout, Today" (`workout_screen.dart:56-58`). | Pass |
| 4 | Finished workout, source only: summary line with minutes; clock card with the length as the headline, "11:22 AM to 12:14 PM" and "Edit times"; exercise cards with sets as rows; "Add set" and "Add exercise"; no bottom bar and no "Finish workout" (`workout_clock_card.dart:59-76`; `workout_screen.dart:78-83, 161`). | Nothing. | — | — | Pass. Set rows here carry the same missing mark as PD-3. |

## Findings

### PD-1 (product-designer / ux-accessibility): a recorded set looks like an unfinished form

- **Classification:** usability problem found by inspection.
- **Severity:** high. Met on every set of every workout, it recurs each time, and nothing on the screen lets the person resolve it.
- **Confidence:** high on the facts (source and render agree); medium on how the form is read, which is a designer's reading of the render.
- **Rule or requirement:** contract failing-step test ("which value will be kept", "no sign of the result"). MM-75 ("confirmed with one tap") describes the behaviour and is where a change would have to be made.
- **Where:**
  - `apps\mobile\lib\src\train\set_editor_state.dart:128-207`
  - `apps\mobile\lib\src\train\workout_exercise_card_state.dart:124-167, 218-240`
  - `apps\mobile\lib\src\train\workout_controller.dart:150-162`
  - `workout_dark.png`
- **Observed:**
  - A set already recorded is drawn in two unlike ways. Earlier ones are a one-line row with the number small on the right ("Set 1"). The latest is a headed form with the number on the left ("Set 2"), outlined fields and an unselected reps-in-reserve control.
  - The form has no saved mark and no way to close.
  - The next button below it in the card is "Add set".
  - On the first set of a new exercise the fields are empty (`set_editor_state.dart:36-41`), which is how an unsubmitted form looks.
- **Expected:** the person can tell, where they are looking, that the set is kept.
- **User impact:** a person can reasonably take the form for a draft and "Add set" for its submit. That tap records a second set with the same numbers and starts the rest count again. "Remove set" undoes it once noticed.
- **What would have to be true:** a recorded set reads as recorded in the place it is edited, and the action that records the next set cannot be taken for the one that keeps this one.
- **Verification:** source inspection and render. Not run. The render shows the form only down to "Started".

### PD-2 (product-designer): with a set open, "Add set" is below the fold, and the timer bar points at it

- **Classification:** usability problem found by inspection.
- **Severity:** high. Met on every set after the first of each exercise. It costs a scroll with the phone in one hand, and when the set is being timed that scroll falls inside the recorded set length.
- **Confidence:** high for the 360 x 800 render in the state shown; medium for other heights and for a first exercise with no "last time" or suggestion lines, which is not rendered.
- **Rule or requirement:** `design\ux-architecture.md:77-79`; MM-75 context ("between sets, one-handed"). MM-191 puts stopping the timer on "Add set" and is where a change would have to be made.
- **Where:**
  - `apps\mobile\lib\src\train\set_timer_bar.dart:101-105`
  - `apps\mobile\lib\src\train\workout_exercise_card_state.dart:168-240`
  - `apps\mobile\lib\src\train\workout_clock_card.dart:36-106`
  - `workout_dark.png`, `workout_martian.png`
- **Observed in the render (logical pixels):**
  - The body runs from about 58 to 728.
  - The summary and clock card take it to about 228.
  - The exercise card starts at 252 and the open editor at 468.
  - The last thing visible is "Started / Not timed".
  - "Ended", "Remove set", "Suggestions use", "Rest target" and then "Add set" are all below the bar.
  - Because the latest set's editor cannot be closed (see facts), this is the standing state after any set is added.
  - The largest figure on the screen is the workout's elapsed time at the top. The rest figure is smaller and at the bottom.
- **Expected:** the control the bar tells the person to tap is on screen when they need it.
- **User impact:** every set ends with a search for the button. A timed set's end is stamped late by however long the scroll takes. Each added set pushes the button one row further down.
- **What would have to be true:** at the moment a set ends, the control that records it is on screen without scrolling at 360 x 800.
- **Verification:** render and source. Heights below the fold are not measured, since nothing renders them.

### PD-3 (product-designer / ux-accessibility): a logged set row gives no sign that it opens

- **Classification:** usability problem found by inspection.
- **Severity:** medium. Met whenever an earlier set needs any correction (time, reps or load); easy once known; a first-time user has nothing to go on.
- **Confidence:** high.
- **Where:**
  - `apps\mobile\lib\src\train\workout_exercise_card_state.dart:154-167` (trailing is a text, no chevron)
  - same file, `:181` and `:195` (chevrons on the two settings rows)
  - `apps\mobile\lib\src\train\set_editor_state.dart:188, 196`
  - `apps\mobile\lib\src\train\train_screen.dart:119`
  - `workout_dark.png`
- **Observed:** every other row on these screens that opens something has a trailing chevron. The set row has small text there instead. Rows that open and rows that do not are otherwise drawn alike.
- **Expected:** the same kind of thing is marked the same way.
- **User impact:** the way in to task 3 is not found by looking.
- **What would have to be true:** a set row shows that it can be opened, in the manner the other rows on the card do.
- **Verification:** source and render.

### PD-4 (product-designer): "Edit times" is the first and only "times" control the eye meets, and it is not about sets

- **Classification:** usability problem found by inspection.
- **Severity:** medium. Met by a person looking for where to fix a set's time; one wrong turn, recoverable with Back.
- **Confidence:** medium. The prominence is plain in both renders; that a person follows it is inference.
- **Where:**
  - `apps\mobile\lib\src\train\workout_clock_card.dart:92-104`
  - `apps\mobile\lib\src\train\workout_times_screen.dart:98-185`
  - `workout_dark.png`, `workout_martian.png`
- **Observed:**
  - "Edit times" is accent-coloured text in the first card. In the Martian render it is one of two accent-coloured elements on the screen.
  - It opens "Workout times": Day, Started (and Ended once finished).
  - On that screen, while the workout is in progress, an outlined "Start the clock again from now" moves the workout's start with one tap and no confirmation (`workout_times_screen.dart:176-185`; `workout_controller.dart:93-100`).
  - The same word "Started" labels both the workout's start there and the set's start in the editor.
- **Expected:** the label and its place say whose times it edits.
- **User impact:** a wrong turn in task 3, onto a screen with a one-tap control that changes the workout's start. The behaviour of that control is referred to ux-accessibility.
- **What would have to be true:** the control in the clock card cannot be read as the way to a set's times.
- **Verification:** source and render for the card; Workout times is source only.

### PD-5 (product-designer): several Ember fills on the workout screen, and the standing one is not the next action

- **Classification:** evidence-supported domain concern (design rule).
- **Severity:** medium.
- **Confidence:** high on the source; the combined view is not rendered.
- **Rule:** `design\design-principles.md:31` ("One primary action per screen, in Ember"); `design\color-and-theme-system.md:224` ("One primary action", as returned by search).
- **Where:**
  - `apps\mobile\lib\src\train\set_timer_bar.dart:109-121`
  - `apps\mobile\lib\src\train\workout_screen.dart:122-130, 163-175`
  - `apps\mobile\lib\src\train\workout_clock_card.dart:79-85`
- **Observed:**
  - "Start set" is primary and always present.
  - "Finish workout" is primary at the end of the list, directly above the bar when scrolled there.
  - "Resume" is primary while paused; "Start set" is then disabled.
  - On an empty workout the only enabled fill is "Start set", while the next step ("Add exercise") is outlined.
  - "Start set" works with no exercise and shows "Tap Add set when the set is done." when there is no "Add set".
  - Timing is optional under MM-191, yet it holds the screen's one standing emphasis; recording a set ("Add set") is outlined.
- **Expected by the rule:** one Ember action, and it is the next useful one.
- **User impact:** emphasis points a first-time user at the optional step (task 1 steps 2 and 4). Neither step is a dead end, which is why this is a concern and not a failing step.
- **What would have to be true:** at each state of the workout, one filled action, and it is the one most people need next.
- **Verification:** source only for the empty, scrolled-to-end and paused states. A render of each is requested.

### PD-6 (product-designer): the figure a person came to fix is not shown where they fix it

- **Classification:** usability problem found by inspection.
- **Severity:** low to medium. Met only when correcting a time; the person can work it out from two clock times.
- **Confidence:** high.
- **Where:**
  - `apps\mobile\lib\src\train\workout_exercise_card_state.dart:158-165` (length on the collapsed row only)
  - `apps\mobile\lib\src\train\set_editor_state.dart:82-83, 183-198` (two clock times to the second, no length)
- **Observed:**
  - A timed set's length appears only on its collapsed row.
  - The editor shows start and end as clock times.
  - After a correction the length cannot be seen until the editor closes, and an editor closes only when another set is opened or added.
  - For an exercise with one set, the corrected length cannot be seen without adding a set.
  - A set logged without the timer shows no time on its row at all.
- **Expected:** the result of the correction is visible where it is made.
- **User impact:** partial sign of result in task 3 step 5.
- **What would have to be true:** after changing a start or end, the set's length is shown without leaving the set.
- **Verification:** source. The editor below "Started" is not in any render.

### PD-7 (product-designer): the set controls are the quietest things in the editor, and its left edges do not agree

- **Classification:** design/usability improvement.
- **Severity:** low.
- **Confidence:** medium (render, one size, two themes).
- **Rule:** `design\visual-language.md:146` ("Large, high-contrast set controls"); MM-75 ("large plus and minus buttons").
- **Where:** `apps\mobile\lib\src\train\set_editor_state.dart:213-238`; `apps\mobile\lib\src\train\workout_exercise_card_state.dart:154-157`; `workout_dark.png`, `workout_martian.png`.
- **Observed:**
  - The minus and plus are bare glyphs about 15 logical pixels wide, with no container, lighter in weight than the field between them. Their touch size is not visible in a render.
  - Left edges inside one card: 32 for the title, last time, suggestion, "Set 2" and reps in reserve; 48 for the set row and "Started"; 48 for the minus; 88 for the fields.
  - The set number is trailing and small on a row, and leading and bold on the form.
- **Impact:** the controls MM-75 names as the fast path carry the least weight on the screen. No step fails on it.
- **Verification:** render.

### PD-8 (product-designer; refer to ux-accessibility and training): a timed rest leaves no figure behind

- **Classification:** usability problem found by inspection.
- **Severity:** low.
- **Confidence:** high on the source.
- **Requirement:** MM-191 decides the rest "is not stored as its own record"; that is where a change would have to be made.
- **Where:** `apps\mobile\lib\src\train\set_timer_bar.dart:29-71`.
- **Observed:** the rest is shown only while it counts. Tapping "Start set" replaces it, and no row shows how long the rest was. A set's own length does appear on its row.
- **Impact:** of the two things timed in task 2, one has a lasting sign and the other does not.
- **What would have to be true:** for the owner to decide whether a rest that was timed should be readable afterwards.
- **Verification:** source only.

### PD-9 (product-designer): no screen direction exists for Train

- **Classification:** documentation or requirement gap.
- **Severity:** low.
- **Confidence:** high within the files searched.
- **Where:** `design\screen-direction.md` has sections for Today, Dashboard, Food, Progress, Coach, Onboarding and Settings, and none for Train. Its only mention is the priority table at `:243`. The direction that exists is one table cell (`design\visual-language.md:146`) and one sentence (`design\ux-architecture.md:77-79`).
- **Impact:** tone, density, primary action and the "must never" list for the workout screen are not written down, so PD-5 and PD-7 rest on general rules. No drawing was compared in this run.
- **Verification:** search of `design\` for train/workout terms, plus a full read of `screen-direction.md`.

## Sources and evidence

None external. All evidence is repository source, requirement and design files, and the four renders listed under Scope.

## Research

Status: unnecessary. No claim about a platform convention or external standard is made; every finding rests on the built screen, the repository's own requirements and its design rules. No web tools were used.

## Confidence and limitations

- **Overall confidence: medium to high.** High where a render and the source agree (PD-1, PD-2, PD-3, PD-4 for the card, PD-7); medium where a state was read from source alone.
- **Not rendered, so walked from source only:**
  - the empty workout
  - a first exercise with no history
  - a running set timer, a rest counting down and target reached
  - paused
  - the time dialog and the rest-target options
  - Workout times
  - a finished workout
  - anything in the workout below the "Started" row
- **Not seen at all:** the Light theme, text scaling, the layout with the keyboard open, a short-height phone.
- **Method limits:** distances are read off 2x images and are approximate. This is analysis of the built screen; it measures nothing about how many people would fail a step. No user was observed.
- **Inputs:** hashes not computed; the commit is taken from the brief.
- **Self-review:** one independent pass, with no second reader.

## Acceptance criteria and edge cases

**Existing criteria traced:**

- MM-75 "Logging a set quickly" (one tap) is met by `addSet`. PD-1 and PD-2 concern whether the person can see that and reach the tap.
- MM-191 "Timing a set" is met in the controller. PD-2 notes the stamped end includes the time taken to find the button.
- MM-191 "Typing the times" and "Times that cannot be" are met from source. PD-6 concerns what is shown afterwards.

**Proposed criteria (not approved; for the owner):**

- At 360 x 800 with a set's controls open, the control that records the next set is visible without scrolling, including on an exercise with last-time and suggestion lines and three or more sets.
- A set that is recorded is distinguishable from one that is not, in the place it is edited.
- Every row that opens something carries the same mark.
- At each workout state (empty, first exercise, set running, resting, paused, scrolled to the end) no more than one filled action is on screen.
- After a set's start or end is changed, its length is visible without closing it.

**Edge cases to render:**

- an exercise with one set
- a set logged without the timer
- a bodyweight exercise (helper line under the field, `set_editor_state.dart:153`)
- two cards for the same exercise
- the longest bar label ("Target rest reached · 5:00 target") beside "Start set"
- Light theme

## Dependencies

- **ux-accessibility:** should challenge whether PD-1 and PD-3 fail for a first-time user as read here. Owns the one-tap "Start the clock again from now" (PD-4), the reasonless disabled "Finish workout", target sizes of the plus and minus (PD-7), and text scaling of the bar.
- **training / product:** whether timing should hold the standing emphasis (PD-5), and whether a rest should be readable afterwards (PD-8). Both touch MM-191.
- **flutter:** whether the bottom bar stays visible above the keyboard while typing reps. Not determined here.
- **Tickets:** MM-75 and MM-191 are where PD-1, PD-2 and PD-8 would be changed; `design\screen-direction.md` for PD-9.

## Safety concerns

None found within this scope; this is not clinical clearance. No health data, privacy or mascot matter arose. Fixture data only.

## Unresolved product decisions

- **Which action holds the emphasis on a workout in progress?** Alternatives: timing ("Start set"), recording a set, or finishing. Impact: PD-2 and PD-5. Authority: product owner.
- **Is the open form the intended resting state of the latest set, or should a recorded set return to a row?** Impact: PD-1, PD-2, PD-6. Authority: product owner; it touches MM-75's "opens its controls".
- **Should a timed rest be shown after it ends?** Impact: PD-8. Authority: product owner; MM-191 currently says the rest is not its own record.
- **Should Train have a section in `design\screen-direction.md`?** Impact: PD-9. Authority: product owner, with product-designer drafting.

## Verification

- **Executed:** nothing. No tests, commands or app runs; read-only tools.
- **Inspected:** the source, requirement and design files listed under Scope; four golden images; `screen_goldens_test.dart:288-306`.
- **Requested of the chair or edit owner** (renders at 360 x 800, Dark at least):
  1. an empty workout
  2. a first exercise with no history, before and after "Add set"
  3. a set running, a rest counting down, and target reached with the longest label
  4. the workout scrolled to its end with a set open
  5. the set time dialog, including a refused value
  6. Workout times, in progress
  7. a finished workout reopened
  8. the workout with the keyboard open on the Reps field
- Items 2 to 4 would settle the unrendered parts of PD-2 and PD-5.

## Targeted challenges

None.
