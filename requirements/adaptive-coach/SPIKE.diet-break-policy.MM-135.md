---
id: MM-135
status: proposed
component: adaptive-coach
related: [MM-22, MM-24, MM-28, MM-31, MM-115, MM-116, MM-117, MM-124, MM-130, MM-143]
---

# Spike: Should the diet break be forced, when, and for how long?

## Context
MM-31 forces a one-week maintenance break after sixteen unbroken weeks of deficit. That ticket records that the product owner's decision
was "capped at 12 to 16 weeks, followed by a *recommended* one to two weeks at maintenance", and that the implementation chose 16 weeks,
forced, one week. The panel reviewed the evidence and did not agree among themselves, so this is a decision to make, not a requirement to
write.

Evidence:
- **Moderate, in men with obesity**: alternating two weeks of deficit with two weeks at maintenance produced more fat loss and less
  metabolic slowing than the same sixteen weeks of deficit taken continuously (MATADOR, Byrne 2018, n=51). The breaks were two weeks and
  frequent, at carefully measured maintenance.
- **Moderate, in resistance-trained people**: one-week breaks after every three weeks of deficit gave *no* difference in fat loss,
  fat-free mass, strength or resting expenditure against continuous dieting (ICECAP, Peos 2021). A secondary analysis found lower hunger
  and better muscular endurance in the break group. A later trial in trained women found the same absence of a body-composition effect.
- **Emerging**: two-day carbohydrate refeeds may help retain fat-free mass (Campbell 2020, small).
- **None directly** for a single forced week after sixteen.

Honest summary: a break does not reliably improve body composition in lean trained people; it probably helps hunger and how the diet
feels; it may help metabolic adaptation in people with obesity when breaks are long and frequent. Nobody has shown harm from a break
other than a longer total diet.

## Description
Decide, and record here with reasons:

1. **Forced, offered or absent?** Positions on the panel:
   - *Forced* (safety and recovery experts): the users who most need a break are the ones who will decline it, and a cap on unbroken
     deficit is a defensible safety limit independent of any metabolic benefit.
   - *Offered* (behavior-change and product experts, and the product owner's original word): autonomy; a forced break mid-momentum is a
     reason to leave; the evidence does not support compulsion.
   - *Signal-triggered* (recovery expert's alternative): offer one when recovery signals fail (MM-117), whatever the week, and keep a hard
     cap only as a backstop at a longer interval.
2. **The interval.** 12 or 16 weeks; and whether it should be shorter for leaner users, in whom adaptation and lean-mass risk are greater
   (the same gradient as the loss limits in MM-28).
3. **The length.** One week (as built) or two (as MATADOR used, and as the original decision allowed). A one-week break is partly consumed
   by the glycogen rebound and the engine's blind period (MM-131).
4. **What counts as a break.** A pause (MM-148), a gap in use (MM-147), a week of higher days (MM-124), a user-chosen maintenance week
   (MM-117): which of these reset the count?
5. **What the app claims.** The explanation must match the evidence: "a rest from dieting, which most people find makes the next weeks
   easier", not "resets your metabolism".

## Decisions
The panel's recommendation, to be confirmed or overruled by the product owner:
- **Offered at 12 weeks; forced at 16 for users in the lean bands of MM-28, and at 20 for others.** Signal-triggered offers at any time
  (MM-117).
- **Two weeks by default, one selectable.**
- **Any 7 or more consecutive days at or above maintenance targets resets the count**, however it came about.
- **Exempt from the step limit** (MM-115).
- **Wording makes no metabolic claim.**

## Acceptance Criteria
```gherkin
Scenario: A decision
  Then this ticket records the product owner's answer to each of the five questions

Scenario: The built behavior is reconciled
  Given the decision differs from what MM-31 records as built
  Then a ticket exists to change the engine, and MM-31 notes that it is superseded in that respect

Scenario: The claim matches the evidence
  Then the diet-break explanation shown to users contains no statement about metabolism that the evidence register (MM-143) does not
    grade moderate or better for that user group
```

## Notes
- Priority: decide before any user reaches week twelve.
- MM-31 also records that the break is throttled by the step limit and rises only 100 kcal. MM-115 fixes that whatever is decided here.
- No closed-loop test runs long enough to reach a break and resume (MM-31). Whatever is decided needs one.
