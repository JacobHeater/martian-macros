---
id: MM-156
status: done
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

## Decisions (built 2026-10-21)
Choices I made without asking (say if any is wrong):
- **Waist moved into the generic store** (`body_measurements`, site `waist`); `WaistRepository` stays as an adapter
  (`WaistFromMeasurements`) so every waist reader is unchanged. The table holds 10 to 300 cm; each site's plausible
  range is checked where it is typed.
- **Noise figures per site** (judgement, `MeasurementSite.facts`): waist 1.0 cm (the user's own once known, MM-155),
  neck 0.5, chest 1.0, hips 1.0, upper arm 0.5, thigh 0.8, calf 0.5; half as much again when an end rests on a single
  reading. A site's change is the waist's rule (`siteChangeOf` over `waistChangeOf`).
- **Limb statements look back twelve weeks** and are two facts: "Upper arm (left) up 1.0 cm in 12 weeks while waist
  held." In a lean gain, the pair is said as "consistent with" (`leanGainPairOf`), never as tissue.
- **The tape body-fat sites** (neck, and hips for a female profile) are named on the sites screen; the one-time
  suggestion is by goal and sex only, since nothing says who wants a tape estimate (`suggestedSites`' `tapeBodyFat`
  is there for MM-501 to use).
- **The side is asked once**, when the first limb is added (from the suggestion or the sites screen), with the
  two-answer question (`overlays.choice`).
- Siblings (rule 9): the "More measurements" section is built as the Waist section beside it (`WaistEntryCard`,
  folded to its line); the session's entry per site is the waist's three fields and its drawing
  (`MeasurementSiteFigure`, in `WaistProtocolFigure`'s strokes); the sites screen is a list of `MmSwitchRow`s as
  Nutrition goals' switches are; a site's history screen draws `WaistChart` with the site's noise, as Progress draws
  the waist's.
- **Panel review (2026-10-21)**: each site in the session is an `MmSection` with the tape's mark (sibling: the
  Progress sections), not a raw heading; its drawing is in full the first session and behind "How to measure" from
  the second. A site left with two of three readings says "Type one reading, or all three." on its first empty
  field (said once focus leaves the site, never while the third is being reached); a reading no such site can be
  is said on its own field ("That hips reading looks off. Check it."), which takes focus, in place of a snack. The
  side can be changed from a "Limb side" row on the sites screen (`overlays.options`); with limbs already measured,
  the snack says earlier entries were on the other side (no schema change: entries do not record a side). "Choose
  sites" is the last row of the sites group, its subtitle "3 of 6"; limb facts are captions under the group.
  Body-measurement charts' 90-day and one-year ranges are allowed in `design/visual-language.md`.

## Progress
Built 2026-10-21. Not run locally; CI validates.
- Domain: `MeasurementSite` (sites, instructions, ranges, noise, limbs), `SiteObservation`, `LimbSide`,
  `MeasurementSettings`; `MeasurementReader`/`MeasurementWriter`/`MeasurementRepository` and
  `MeasurementSettingsRepository`; `WaistFromMeasurements`.
- Data: `SqlMeasurementRepository` (`body_measurements`), `SqlMeasurementSettingsRepository`
  (`measurement_settings`); in-memory fixtures; both in `SqlRepositories`, `InMemoryRepositories` (and its eraser),
  `AppServices`, `openAppServices` and the gallery's services; `state.measurements`, `state.measurementSettings`.
  The schema change (the two tables, waist rows copied over, `waist_entries` dropped) is added with the migration.
- Engine: `siteChangeOf`, `suggestedSites`, `limbFactsOf`, `leanGainPairOf`. Format: `siteLabel`, `siteAmount`,
  `siteSummary`, `siteListText`, `limbFactText`, `leanGainPairText`.
- Screens: Progress' "More measurements" section (`MeasurementsCard`) with the suggestion once, each site's line and
  chart (`SiteHistoryScreen`), the limb facts and the lean-gain pair; `MeasurementSessionScreen` (every site in the
  fixed order, waist first, the middle of three kept, a site left empty skipped, an implausible value refusing the
  save); `MeasurementSitesScreen`. `WaistChart` takes another site's noise.
- Guarding tests: `measurementRepositoryContract` and `measurementSettingsRepositoryContract` (in memory and SQL);
  `dataEraserContract` (no measurement or site left); `test/data/restore.test.ts`;
  `test/engine/measurementSites.test.ts` (the suggestions by goal and sex, none with an eating-disorder history; a
  site's own noise; Limits of a tape; the lean-gain pair); `test/progress/measurementSites.test.tsx` (Adding a site,
  A session, Suggested once, Sex-specific suggestion, Eating-disorder history, Limits of a tape); the upgrade test for
  "Waist is unchanged" is with the migration.
- Stories: `ProgressMeasurementsSuggested`, `ProgressMeasurementsWaistOnly`, `ProgressMeasurementsLimbs`,
  `MeasurementSessionFirst`, `MeasurementSessionSites`, `MeasurementSites`, `MeasurementSitesChosen`, `SiteHistory`,
  `SiteHistoryEmpty`.
- Panel review fixes (2026-10-21): `MeasurementSessionScreen`, `MeasurementSitesScreen`, `MeasurementsCard`,
  `MmTextField`'s `onBlur`; `design/visual-language.md`. Tests in `test/progress/measurementSites.test.tsx` (the
  implausible value on its field with focus; two of three said once the site is left; the drawing from the second
  session; "3 of 6"; changing the limb side). Stories: `MeasurementSessionTwoOfThree`, `MeasurementSessionLooksOff`,
  `MeasurementSitesLimbSide`.

## Owed on a phone
- The upgrade on the owner's phone brings every waist entry into the new store with its date, value and readings,
  and the Waist section and chart show them as before.
- A measuring session of three sites saves each and survives a restart.

