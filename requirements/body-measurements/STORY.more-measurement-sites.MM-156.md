---
id: MM-156
status: proposed
component: body-measurements
related: [MM-154, MM-14, MM-21, MM-34, MM-61, MM-107, MM-129, MM-133, MM-144, MM-155]
---

# Story: Measure more than my waist, if I want to

## Context
See MM-154. Waist is one site. It is the best single one for abdominal fat and tells nothing about where muscle is being gained, and for
many women it is not where fat is lost first. The Navy body-fat method that MM-34 plans as its tape fallback needs neck as well, and hip
for female profiles.

Evidence: circumferences track regional change well when measured consistently (**moderate**); limb circumferences cannot distinguish
muscle from fat on their own, and a rising arm measurement in a surplus is evidence of *something* growing (**strong** as a limitation).
Sex differences in fat distribution and in the order of regional loss are **strong** in direction and highly individual.

## Decisions
Choices I made without asking (say if any is wrong):
- **Optional sites, each off until the user adds it**: neck; chest; hips (widest point of the buttocks); upper arm (relaxed, midway between
  shoulder and elbow); thigh (midway between hip crease and knee); calf.
- **Each site has its own one-line instruction and drawing**, the same three-reading entry, its own noise figure and its own chart
  (MM-155). Limbs are measured on one named side, chosen once.
- **Suggested sets by goal and sex**, offered once and never required:
  - any goal, female profile: waist and hips;
  - any goal, male profile: waist;
  - lean gain or recomp, either sex: add upper arm and thigh;
  - anyone who wants a tape-based body-fat estimate (MM-34): add neck, and hips for a female profile.
- **Arm and chest are measured relaxed.** A flexed measurement is what lifters like and is far less repeatable.
- **The measuring session is one screen**: all the user's sites in a fixed order, so the weekly routine takes a minute.
- **What the app says about limbs is limited to what they can show**: "Upper arm up 1.0 cm in 12 weeks while waist held" is stated as two
  facts. It does not say muscle was gained (MM-133, MM-144).
- **In a lean gain, the pair is used**: limbs up beyond noise with waist steady supports the gain; waist up with limbs steady supports the
  fat-heavy notice (MM-129). Stated as "consistent with", not as a measurement of tissue.
- **No ratios are shown as scores** (waist-to-hip, shoulder-to-waist). They invite comparison with ideals (MM-144).

Where the experts disagreed:
- The bodybuilding coach wanted a fuller set (shoulders, forearm, flexed arm) and symmetry tracking left against right. The UX
  strategist and the adherence expert: every added site lowers the chance that the weekly session happens at all. Six optional sites;
  custom sites can come later if asked for.
- The safety expert asked that sites not be suggested to users with an eating-disorder history. Agreed: for them nothing beyond waist is
  suggested, though any can be added by hand.

## Description
A generic measurement table keyed by site (needs MM-61; waist migrates into it), site definitions with instructions, a session screen,
and per-site charts.

## Acceptance Criteria
```gherkin
Scenario: Adding a site
  When the user adds upper arm, left side
  Then the measuring session includes it, with its instruction

Scenario: A session
  Given waist, hips and thigh are enabled
  Then one screen takes all three in order and stores each median

Scenario: Suggested once
  Given a female profile on recomp who has only waist
  Then hips, upper arm and thigh are suggested once, and declining is remembered

Scenario: Limits of a tape
  Given upper arm up 1.0 cm beyond noise and waist with no clear change
  Then the app states both facts and makes no statement about muscle

Scenario: Sex-specific suggestion
  Given a male profile
  Then hips are not in the default suggestion, and can still be added

Scenario: Eating-disorder history
  Given that screening answer is ticked
  Then no additional site is suggested

Scenario: Waist is unchanged
  Given existing waist entries
  When this ships
  Then they appear in the new store with their dates and values intact
```

## Notes
- Priority: could-have; neck (and hips for female profiles) become necessary when MM-34 is built.
- Skinfold calipers were considered. In practiced hands they are good; self-measured they are not, and most sites cannot be reached
  alone. Not offered; a user may record a caliper-derived body-fat figure as their own estimate (MM-82).
