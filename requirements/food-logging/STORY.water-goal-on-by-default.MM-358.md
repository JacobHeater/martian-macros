---
id: MM-358
status: proposed
component: food-logging
related: [MM-313, MM-326, MM-357, MM-359]
---

# Story: the water goal is on by default, suggested for the person

## Context
The product owner, 2026-10-16, after seeing the Water section without its bar in most stories (MM-357): the
water goal is on by default, "with water goals studied by our panel of experts for recommendations and also
based on the user's health questionnaire". This replaces MM-313's "optional goal the user types, off by
default, with no formula".

The panel's nutrition and training specialists researched it (2026-10-16). The owner rejected a first
proposal of 48 / 64 fl oz as too low for high-protein diets and recomposition. The research then found that
protein raises the water needed to clear urea, by about 16–32 fl oz per extra 100 g of protein a day (renal
solute load; NASEM 2005: 40–60 mL per gram of urea nitrogen). It also found that a lifting day adds roughly
17–34 fl oz of sweat (nearest data: CrossFit, Cronin 2016). Both specialists put a training man on a high-protein
target at about 100–104 fl oz. They found 128 fl oz above the evidence as a default for a typical man,
though safe spread through a day. No source supports a term per goal mode, or a 30–35 mL/kg formula
(Yamada 2022). The owner chose the personal formula below. Its coefficients are product judgement built on
that evidence, and `docs/evidence.md` says so.

The safety specialist set the bounds:
- no default above 3.5 L (120 fl oz);
- withheld where a care team sets fluids;
- "drink to thirst, spread through the day", with "Goal reached" said once and never "keep going".

The owner chose to withhold it for kidney disease, bariatric surgery and a clinician-set fluid limit (MM-359), and not for an eating-disorder history.

## Description
Unless the person switches the goal off or sets their own amount, their water goal is suggested for them:

- **Base:** 48 fl oz (1.5 L) for women, 64 fl oz (2.0 L) for men.
- **Plus the urea offset:** 7 mL (about 0.24 fl oz) per gram of the protein target above 0.8 g per kg of body
  weight.
- **Plus training:** 500 mL (about 16 fl oz) × training days per week ÷ 7.
- **Rounded and capped:** rounded to the nearest 8 fl oz glass in imperial, or 250 mL in metric, and capped at
  120 fl oz (3.5 L).
- **Pregnancy and breastfeeding:** 56 fl oz (1.75 L) when pregnant, 64 fl oz (2.0 L) when breastfeeding, with no
  protein or training terms.
- **When there is no protein target or weight yet,** the protein term is left out.
- **No suggestion** with chronic kidney disease, after bariatric surgery, or with a clinician-set fluid limit.
  For those people the goal is off unless they set one, and Settings says their care team sets it.

The suggestion follows the person's targets, weight and training days as they change. Settings shows the goal
as on, with its amount marked "Suggested for you" and the reason in one line. The person can type their own
amount or switch the goal off, and can return to the suggestion. Only plain water counts, as before.

## Acceptance Criteria
```gherkin
Scenario: A training man on a high-protein target
  Given a man of 90 kg, a protein target of 180 g and 4 training days a week, in imperial
  And he has not set a water goal
  Then his water goal is 104 fl oz, marked as suggested

Scenario: A woman on recomposition
  Given a woman of 65 kg, a protein target of 130 g and 3 training days a week, in imperial
  Then her suggested water goal is 80 fl oz

Scenario: Pregnancy
  Given a pregnant woman
  Then her suggested water goal is 56 fl oz, whatever her protein target and training

Scenario Outline: Withheld
  Given a person whose health check says <answer>
  Then no water goal is suggested, and the Water section has no bar until they set one

  Examples:
    | answer                                   |
    | chronic kidney disease                   |
    | bariatric surgery                        |
    | a clinician has limited how much they drink |

Scenario: Their own amount
  Given a person who sets 128 fl oz
  Then their goal is 128 fl oz until they return to the suggestion

Scenario: Switched off
  Given a person who switches the water goal off
  Then no goal, bar or "Goal reached" appears

Scenario: Never above the cap
  Given a suggestion that works out above 120 fl oz
  Then it is 120 fl oz
```

## Notes
Sources, as the specialists gave them (accessed 2026-10-16): NASEM 2004/2005 water DRI
(nationalacademies.org/read/10925/chapter/6), Martin 2006 (PMID 16567155), Yamada 2022 (Science, DOI
10.1126/science.abm8668), ACSM 2007 (PMID 17277604), Cronin 2016 (IJES 9(5)), Kerksick 2018 (ISSN), Rangan 2021
(BMJ Open), NIDDK on CKD. EFSA 2010's primary text could not be retrieved. A dietitian or clinician should review
the bounds before release. Design work (Settings and the Water section) goes through Storybook and the panel.
