---
id: MM-371
status: done
component: coach-insights
related: [MM-144, MM-108, MM-306, MM-361, MM-370]
---

# Task: The food-grading non-goal and voice rule, overruled by the owner

## Context
MM-144 lists "No food scoring, grading, or 'clean' and 'junk' labels (MM-108)". MM-108's voice rules say "State, do not judge" and
"Never moralize food". On 2026-10-17 the product owner asked for every food to be graded A+ to D- (MM-370), as MM-306 overruled
the micronutrient non-goal.

## Decisions
- **Overruled by the product owner, 2026-10-17.** Grading is in. The concern behind the non-goal is carried into the design: the
  grade is a nutrient-profile measure with a published basis (MM-369), never a moral word. No "good", "bad", "clean" or "junk"
  appears anywhere. A food that can't be graded says so and is not guessed. The coach's lines stay facts plus a direction
  (MM-362).
- **Still non-goals**: "clean" and "junk" labels, meal plans and prescribed foods. MM-108's banned words stay banned.

## Description
MM-144 and `docs/non-goals.md` mark the grading part of the item as overruled, by whom, when and why, pointing to MM-370 and MM-371,
without deleting the reasoning. MM-108 gains a note that grade letters are allowed and its banned words are not. The banned-word
test lets grade letters through and still fails on every banned word.

## Acceptance Criteria
```gherkin
Scenario: The non-goal says it was overruled
  When docs/non-goals.md is read
  Then the grading part of the item says it was overruled by the product owner on 2026-10-17 and names MM-370 and MM-371

Scenario: The tickets agree
  When MM-144 is read
  Then its grading line says the same, and MM-108 notes that grade letters are allowed and its banned words are not

Scenario: Labels stay out
  Then "clean" and "junk" labels are still listed as non-goals

Scenario: The voice test still bites
  Given a string "Grade D: junk"
  Then the banned-word test fails on "junk" and not on the grade
```

## Progress
- Done 2026-10-18: `docs/non-goals.md` and MM-144 mark the grading part overruled by the product owner on 2026-10-17, naming
  MM-370 and MM-371, with the reasoning kept and the labels still out; MM-108 notes that grade letters are allowed and its
  banned words are not. `test/voice.test.ts` shows "Grade D" passing and "Grade D: junk" failing on "junk".
