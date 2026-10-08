---
id: MM-113
status: proposed
component: safeguards
related: [MM-110, MM-112, MM-114, MM-115, MM-121, MM-23, MM-29, MM-134]
---

# Story: Coach a user on weight-loss medication to keep their muscle

## Context
A large and growing share of people losing weight in the United States do it on a GLP-1 medication (semaglutide, tirzepatide). The drug
suppresses appetite, so the usual coaching problem is reversed: the difficulty is not eating *less* than a target but eating *enough*,
especially protein. An app that hands this user a calorie ceiling and congratulates them for coming in under it is working against them.

Evidence:
- **Moderate**: in the body-composition substudies of the main trials, lean mass was roughly a quarter to two fifths of the weight lost on
  semaglutide (about 39% in the STEP 1 DXA substudy), and a similar or somewhat larger share has been reported for tirzepatide. Lean mass
  is not the same as muscle, and the clinical meaning is debated.
- **Emerging**: resistance training with adequate protein reduces that loss. Observational and early interventional reports are
  favorable; the first randomized trial designed to test it (LEAN-PREP, targeting 1.6 g/kg with three sessions a week) is under way.
- **Judgement**: every rule below.

## Decisions
Choices I made without asking (say if any is wrong):
- **A screening answer** (MM-112): "I take a prescription weight-loss medication". Not blocking.
- **The calorie target is framed as a level to reach, not a limit.** The Food screen and dashboard say "aim for about 1,900" and show
  progress toward it; "remaining" wording is kept, "over" is unchanged.
- **Protein is the headline number for this user**: shown first, with its minimum (MM-121), and the protein-minimum days count is the
  first line of their weekly summary (MM-149).
- **The under-eating notice (MM-114) is stricter**: it triggers after 5 qualifying days rather than 7.
- **The app does not fight the prescriber.** If loss outruns the app's limit (MM-115) the app raises its target as usual, but the message
  says the pace is faster than the app would set and to raise it with the prescriber. It does not tell the user to change a dose.
- **Training is prompted** (MM-134): with no training days set, the user is told plainly that resistance training is the main lever for
  keeping muscle on this medication.
- **Nothing else changes.** The expenditure estimate needs only intake and weight and works the same.

Where the experts disagreed:
- The product strategist wanted a dedicated "GLP-1 mode". The UX strategist objected that modes multiply screens and that the differences
  are four wording and threshold changes. Resolved as a screening answer with effects, like every other condition (MM-11).
- Whether to raise the protein target for these users. No trial supports a number above the general range; the panel declined to invent
  one.

## Description
A new screening field with the effects above, read by the Food screen, dashboard, weekly summary and the two safeguards named.

## Acceptance Criteria
```gherkin
Scenario: Framing
  Given the medication answer is ticked and 900 of 1,900 kcal are logged
  Then the calorie card says how far there is to go to about 1,900, and protein is shown above calories

Scenario: Stricter under-eating notice
  Given the medication answer is ticked
  And 5 usable days in the last 14 average more than 10% below the calorie floor
  Then the under-eating notice is shown

Scenario: Faster than the limit
  Given trend loss above the user's limit for two weeks
  Then targets rise as MM-115 describes
  And the message suggests discussing the pace with the prescriber and does not mention dose

Scenario: No training
  Given the answer is ticked and training days per week is 0
  Then the Coach screen says resistance training is the main way to keep muscle while losing weight on this medication

Scenario: Not ticked
  Given the answer is not ticked
  Then none of the above applies
```

## Notes
- Priority: should-have. It can follow the first release, but the group is large enough that it should not wait long.
- The medication also slows stomach emptying and can cause nausea; a user who cannot eat the protein minimum is not failing. The wording
  must not imply it (MM-108).
- Stopping the medication is followed by appetite returning. A user who unticks the answer is a candidate for the maintenance guidance in
  MM-130. Not specified further here.
