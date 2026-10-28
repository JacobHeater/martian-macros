---
id: MM-678
status: in-progress
component: coach-insights
related: [MM-23, MM-140, MM-604, MM-609, MM-617, MM-677]
---

# Story: The coach reads cardio and steps

## Context
The owner, 2026-10-28: "part of training on any fatloss or recomp program must be steady state cardio." MM-677 brings
the wearable's sessions and the platform's steps into the app; this ticket makes the coach read them: two training
signals of MM-609's kind in the coach's voice (MM-617), the floors they are held to, and a stall explanation (MM-140).
The coach is a real coach (the owner, 2026-10-24): blunt orders and accountability, never number restatements.

`docs/non-goals.md` said "No cardio prescriptions and no 'burn it off'" (MM-140). The owner reopened the first half:
cardio is a standing part of a fat-loss or recomp program. The second half stands: cardio is never said as a way to
make up for food, and no calories are worked out from it (MM-23).

## By the product owner (the Q&A of 2026-10-28)
- **The floors:** 8,000 steps a day and 150 minutes of cardio a week ship as the coach's defaults. The person changes
  both in **Settings › Coach**.
- **Fat loss and recomp only.** The coach is silent about cardio on maintenance and lean gain; the numbers still show on
  Train (MM-677).
- **Orders and accountability, and a stall explanation:** when progress stalls, steps down 20% or more against the four
  weeks before the window, with at least 20 days of steps in both, is named as the likely cause before any calorie cut.
- **The lines ship as drafts** and the owner reads them on the phone; edits come as a follow-up.

## Decisions
Choices made without asking (say if any is wrong):
- **Only once the wearable is in use:** nothing is said about cardio or steps until the platform has given at least one
  session or one day of steps. A person with no wearable is not nagged about a thing the app cannot see; MM-677's
  disclosure says what brings it.
- **C1, cardio minutes:** the last seven days through yesterday under the minutes floor is a fix, in any span; the
  order is the shortfall on the watch this week. Holding up: at or over the floor in each of the last four weeks, in a
  28-day span.
- **C2, steps:** the last seven days' average under the steps floor is a fix, with at least five days of steps in them;
  the order is the shortfall a day. Holding up: at or over the floor in each of the last four weeks, in a 28-day span.
- **Neither fix is said under an eating-disorder history or the under-eating finding** (`restricted`), which forbid
  "train more" (MM-609). A pause silences both, as it does T1.
- **Priority:** coaching for a fix, pattern for holding up, as T1.
- **The stall diagnosis** gains `activity`, after `intake` and before `estimate` (MM-140's order), so a drop in moving
  is named before the estimate is called wrong and the target comes down. Its line states both averages and orders the
  steps back; the estimate diagnosis is not reached that check-in.
- **The floors** are a `CardioFloors` preference (two nullable columns of `user_preferences`, schema 31, null meaning
  the default): a whole number of steps from 1,000 to 30,000 and minutes from 0 to 1,000. `CardioRule` holds the
  defaults and the stall rule's figures, each with an evidence row.
- **Draft lines**, for the owner to read on the phone:
  - C1 fix, lead: "{minutes} of cardio this week against the {floor} floor." / "Cardio this week: {minutes}. The floor
    is {floor}."
  - C1 fix, why: "Cardio is part of this program, with the lifting." / "The lifting keeps the muscle. The cardio is the
    other half of the program."
  - C1 order: "Get {more} more on the watch this week." / "{more} more this week. Walk, run or ride; the watch counts it."
  - C1 held: "Over the cardio floor in each of the last {weeks} weeks: {minutes} this week." / "{weeks} weeks over the
    cardio floor; {minutes} this week." Then "Keep that."
  - C2 fix, lead: "About {steps} steps a day this week against the {floor} floor." / "Steps this week: about {steps} a
    day. The floor is {floor}."
  - C2 order: "Get to {floor} a day. {short} more each day covers it." / "{short} more steps a day. Walk them."
  - C2 held: "Over {floor} steps a day in each of the last {weeks} weeks." / "{weeks} weeks over the steps floor: about
    {steps} a day." Then "Keep that."
  - Stall, activity: "Your steps fell: about {now} a day over the last {window} days against about {before} a day in
    the four weeks before. Less moving is the likeliest reason the scale held. Get the steps back to {before} before
    anything else changes."

## Description
- `TrainingAnalysisInput` carries the cardio sessions, the steps and the floors; `cardioFindings` and `stepsFindings`
  make C1 and C2; `trainingAdviceOf` gives each fix its order (`cardio`, `steps`); `trainingFindingText` and
  `coachPhrasings` say them. `unjudgedTrainingAreas` names training as needing 28 days for the holding-up lines.
- `assessStall` takes the steps; `StallDiagnosis` gains `activity`; `stallText` says it.
- Settings › Coach: two rows, "Steps a day" and "Cardio minutes a week", a number each, the default shown until changed.

## Acceptance Criteria
```gherkin
Scenario: Under the cardio floor on fat loss
  Given a fat-loss goal, the default floors, and 96 minutes of cardio in the last seven days
  When yesterday's span is analysed
  Then a cardio fix says 96 min against 150 and orders 54 more minutes this week

Scenario: Under the steps floor
  Given a fat-loss goal and about 6,100 steps a day over the last seven days
  Then a steps fix says 6,100 against 8,000 and orders 1,900 more a day

Scenario: Silent until the wearable is in use
  Given a fat-loss goal and no session and no steps ever
  Then no cardio or steps finding is made

Scenario: Silent on maintenance
  Given a maintenance goal under both floors
  Then no cardio or steps finding is made

Scenario: Holding up
  Given a 28-day span over both floors in each of the four weeks
  Then two holding-up findings say four weeks

Scenario: Restricted
  Given an eating-disorder history
  Then no cardio or steps fix is made

Scenario: The floors are the person's
  Given 10,000 steps a day saved in Settings › Coach
  Then the steps finding is judged against 10,000

Scenario: A stall explained by steps
  Given a stall with intake on target, about 5,200 steps a day in the window against about 8,100 in the four weeks before
  Then the diagnosis is activity, said with both averages, and the estimate diagnosis is not reached
```

## UI/UX
- Settings › Coach floors — apps/mobile/src/gallery/screens/Settings.stories.tsx (Story: CoachCardioFloors).
- The coach's lines — apps/mobile/src/gallery/screens/CoachingInsights.stories.tsx (Story: CardioUnderFloor).
