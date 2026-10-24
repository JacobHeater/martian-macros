---
id: MM-609
status: proposed
component: coach-insights
related: [MM-604, MM-605, MM-610, MM-78, MM-79, MM-117, MM-121, MM-134, MM-252, MM-366, MM-368, MM-377, MM-442, MM-613]
---

# Story: What the coach reads in your training, water and sleep

## Context
The owner listed training "(or lack thereof)", water and sleep among what the coach should read (MM-604). The engine already has
most of the pieces:
- the training lapse (`assessTrainingLapse`, 14 and 21 days);
- weekly hard sets (`buildWeeklyVolume`, `countHardSets`; MM-78's 10–20 typical range);
- the volume jump (MM-366);
- strength trends (`buildStrengthTrends`);
- falling lifts feeding the MM-117 offer;
- strength on fat loss (MM-377);
- the MM-79 stall;
- short sleep (`SleepRule`);
- water logging (`WaterFewDaysRule`).

None of them reaches the Coach tab as analysis. The training panel proposed the catalog on 2026-10-24.

## Decisions
Choices made without asking (from the training panel; say if any is wrong):
- **A training session** is a finished workout with ≥ 1 hard set. An empty imported session is not training (it is today, in
  `assessTrainingLapse`).
- **Reuse, not duplication.** The volume jump, strength on fat loss and the lean-gain strength reading stay where they are. The
  coach reads their results and shows no second card.
- **Training findings use weeks**, since rest days are real zeros (MM-605 Decisions).
- **On fat loss nothing is said about a stall** (MM-79), and strength rising is not a fat-loss finding. Strength held is the
  "holding up".
- **Never "because"** between sleep or water and performance. Days are counted and stated side by side.
- **Not built:**
  - sleep beside falling performance, since the owner declined sleep insights as "medical advice" (MM-368);
  - steps, which are not stored (MM-442).
- **Eating-disorder history or under-eating:** no "train more" (T2, T3), no T7 held line, no water line. A compulsive-exercise
  risk.
- **Protein on training and rest days is one minimum** (MM-121). Never "eat more protein on training days".

## Description
Signal definitions for MM-605:

| id | signal | change when | holding up when | action |
|---|---|---|---|---|
| T1 | training stopped (reuse) | lapse notice: ≥ 14 days without a session on a deficit or gain; suspend at 21 on lean gain (MM-134's words). Silent on maintenance and in a pause | a session in each of the last 4 weeks | open Train, or "Set a pause". T1 suppresses T2–T9 |
| T2 | training dropped | usual ≥ 2 a week over the 4 weeks before, with sessions in ≥ 3 of them; the last 14 days at ≤ 50% of usual and ≥ 2 fewer sessions (uncertain) | sessions in line with the usual rate | none forced; says one session a week with heavy sets holds strength (Spiering 2021) |
| T3 | sets per muscle | trains ≥ 2 a week, yet a major group (chest, back, shoulders, quads, hamstrings, glutes) averages < 4 hard sets a week over 4 weeks while another averages ≥ 10 (uncertain). On fat loss only at 0 sets | a group at 10–20 sets a week in ≥ 3 of 4 weeks | link to weekly volume |
| T5 | strength rising (maintenance, lean gain) | | smoothed e1RM up ≥ 5% over ≥ 42 days, ≥ 4 sessions, no gap > 28 days, trained in the last 14; at most 2 lifts | none |
| T6 | strength stalled (maintenance, lean gain) | ≥ 2 regular lifts each stalled per MM-79 and within ±2.5% over 6 weeks (uncertain) | | open the lift; one more rep or one more set |
| T7 | strength on fat loss (reuse) | ≥ 2 lifts falling: the MM-117 offer, with short sleep and protein short as co-evidence lines | held or up (`StrengthOnFatLossRule`) | the offer's gentler pace |
| T8 | training days | | ≥ 2 usual weekdays, each trained in ≥ 3 of the last 4 weeks | none |
| T9 | reps in reserve unrecorded (data quality) | ≥ 15 hard sets in 14 days with RIR on < 25% (uncertain) | | says weekly sets may read high |
| X1 | protein on rest and training days | ≥ 4 of each in 14 whole days; met share differs by ≥ 30 points and the lower is < 50% (uncertain) | | rest days named; the minimum is the same every day. Folds into N1 when N1 fires |
| X3 | water on training days | water logged on ≥ 10 of 14 days; on ≥ half of ≥ 4 training days, ≥ 500 ml under the goal and under the rest-day average (uncertain) | water logged on most days, training days at goal | a fact and one easy step; never a dehydration claim |

Bodyweight and assisted lifts, lifts over 12 effective reps or at RIR 5+, and sets with unknown reps (MM-613) feed no rising,
stalled or falling claim. A deleted exercise is named "Deleted exercise" (MM-348).

## Acceptance Criteria
```gherkin
Scenario: Training dropped
  Given 3 sessions a week for 4 weeks, then 2 sessions in the last 14 days
  Then a finding says 2 sessions in 14 days against about 3 a week, and that one session a week with heavy sets holds strength

Scenario: A pause silences training
  Given a pause covering the last 14 days
  Then no T1 or T2 finding is shown

Scenario: A neglected muscle
  Given 4 sessions a week, 14 hard sets a week for chest and 0 to 2 for hamstrings over 4 weeks, on maintenance
  Then a finding names hamstrings and the sets of both groups

Scenario: Strength holding on a cut
  Given 6 weeks of deficit with bench press within 2.5% of its start over 5 sessions
  Then "holding up" says bench press held, and no stall is mentioned

Scenario: Rest-day protein
  Given 14 whole days, the minimum met on 6 of 6 training days and 2 of 8 rest days
  Then the finding names rest days and does not say to eat more on training days

Scenario: Water is a log, not hydration
  Given the water finding
  Then its words say "logged" and never "dehydrated" or claim a loss of performance

Scenario: Eating-disorder history
  Given an eating-disorder history
  Then no T2, T3, T7-held or X3 finding is shown

Scenario: Empty imported session
  Given an imported session with no sets
  Then it does not count as training for T1 or T2
```

## Notes
Sources (training panel, accessed 2026-10-24):
- Bosquet 2013 (cessation: a dose-response with the length of the stop);
- Spiering 2021 (strength and size kept on 1 session and 1 set a week in younger adults; older adults may need 2 and 2–3);
- Schoenfeld 2017 (about +0.37% muscle per added weekly set);
- Morton 2018;
- Murphy & Koehler 2022 (strength generally kept in a deficit);
- Savoie 2015 (hypohydration and strength; logged water is not hydration);
- Craven 2022 (acute sleep loss, not used).

Register row 394's "Pelland 2024" needs re-verifying against the published version.
