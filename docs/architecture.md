# Architecture and product decisions

Status: founding decisions, October 2026. This is the overview.

**The requirements live in [`requirements/`](../requirements/README.md)**, one
ticket per decision or piece of work, each with a short id (`MM-n`). Where
this file and a ticket disagree, the ticket is right; fix this file.

**Product design guidance lives in [`design/`](../design/README.md)** and
translates requirements and roadmap decisions into shared visual, interaction,
accessibility, and Flutter implementation rules.

## Product

**Positioning.** A body-composition coach with four modes: fat loss, recomp,
lean gain, maintenance. Recomp is recommended only where it reliably works
(Barakat et al., 2020): novices, returning lifters, and higher body fat
(men ≥ 20%, women ≥ 30%; our heuristic). See `mode_advisor.dart`.

**Hero metrics.** Trend weight (with a visible noise band), waist
circumference (weekly, median of three), and strength (e1RM). Body-fat % is
shown only as a converged range, never as a raw daily reading. When weight is
flat, waist is falling, and e1RM is rising, the app shows a "Recomp signal".

**First month.**
- Day 0: onboarding, screening, and baselines.
- Days 1–7: calibration week, with targets held.
- Day ~15: first adaptive update, from a window of at least 14 days.
- Day 28: first monthly report.
- After that: a weekly check-in, a monthly report, and a forced maintenance
  break after 16 consecutive deficit weeks.

**Rewards.** Reward process (logging, protein, sessions, PRs). Never reward a
bigger deficit, a lowest weight, or a streak of low intake.

**Monetization.** Free forever: food logging, barcode scanning, training log,
trend weight, health sync, and backup. A one-time "Coach" unlock covers
adaptive TDEE, weekly target changes, body-composition estimates, reports, and
phase planning, with a 21-day trial so the paywall lands after two adaptive
updates.
- iOS: the trial is a $0 non-consumable ("21-day Trial", Guideline 3.1.1).
- Android: the trial clock is kept locally.

**Market.** United States first. Units are imperial by default, and the
engine is SI-only.

## Biological sex

`BiologicalSex` is a closed `{male, female}` enum with no default anywhere.
- Onboarding cannot complete without it.
- The engine takes it as a required, non-null parameter.
- Persistence must use `NOT NULL CHECK (sex IN ('male','female'))`.
- HealthKit's `.male`/`.female` may pre-fill the onboarding question;
  `.other` and `.notSet` are ignored.
- Health Connect has no sex field.
- Menstrual data, when available, widens weight noise around menses
  (`cycle_noise.dart`).

## Engine (packages/engine)

The engine is a set of pure functions of stored observations: no I/O, clock,
or randomness. Correcting a profile field means recomputing from history.

**Weight trend.** A 3-state Kalman filter with an RTS smoother over (tissue
level, slope, transient water). Water is AR(1), so multi-day water swings are
not read as tissue change.
- Outliers beyond 5σ are rejected, which catches pound/kilogram mix-ups.
- After 3 rejections in a row the reading is accepted anyway, so a real step
  change gets through.

**Fat vs. lean split.** Use a model, not BIA. The lean fraction of a weight
change comes from the Forbes/Hall curve, `p = 10.4 / (10.4 + FM)`, halved for
trained users in a deficit. Energy densities are 9,440 kcal/kg for fat and
1,815 kcal/kg for fat-free mass (Hall 2008). BIA will later inform body
composition only, through a per-device bias state, never energy balance.

**TDEE.** TDEE = mean intake on usable days − ρ · trend slope, blended with
the Mifflin-St Jeor × activity prior by inverse variance.
- The window is 28 days; the minimum span is 14 days from the first weigh-in.
- Updating needs at least 10 usable intake days and at least 8 weigh-ins.
  Otherwise the engine **holds** and never guesses.
- Unmarked days below 65% of the window's 75th-percentile intake are treated
  as partial and excluded. Days the user marks complete are always used.
- A logging-style switch (weighed share changes by more than 0.5) restarts
  the window, because the logging bias changed.
- For 10 days after the calorie target changes by more than 10% of TDEE
  (starting or ending a deficit), glycogen, water and gut contents move the
  scale by a kilogram or two. The trend filter lets level and slope move
  freely on those days, and the estimator leaves them out. A user who starts
  in a deficit therefore gets a first measurement at day 28, not day 14.
- The result is clamped to 1.1–3.0 × BMR.
- The estimate is maintenance *in the user's logging units*. Consistent
  under-logging is absorbed by the closed loop.
- Realistic water noise limits a single 28-day estimate to roughly
  ±150–200 kcal. Tests check for no bias and honest σ, not for precision the
  physics doesn't allow.

**Safety bounds** (`safety_bounds.dart`). These need dietitian sign-off
before launch.

| Bound | Men | Women |
| --- | --- | --- |
| Absolute calorie floor | 1,500 | 1,200 |
| Also floored at | BMR | BMR |
| Energy-availability floor (lean users: men ≤ 15%, women ≤ 25%) | 30 kcal/kg FFM (upper bound) + training | same |
| Max loss per week (by body fat) | 1.0% / 0.7% <15% / 0.5% <12% | 1.0% / 0.7% <25% / 0.5% <22% |
| Goal body-fat floors (warn / reject) | 10% / 8% | 18% / 16% |
| Minimum fat | max(0.5 g/kg, 20% kcal) | max(0.6 g/kg, 20% kcal) |

- Protein is 1.6–2.2 g/kg of reference weight (body weight up to BMI 25,
  then the BMI-25 weight plus a quarter of the excess), or 2.3–3.1 g/kg FFM for lean users in a deficit (Helms 2014).
  It is capped at 0.8 g/kg for chronic kidney disease.
- Weekly target change is at most min(100 kcal, 5%).

**Screening** (`CoachingPolicy`):
- Under 18: blocked.
- Pregnancy or breastfeeding: maintenance only, with +400 kcal while
  breastfeeding.
- Eating-disorder history: no deficit modes and no weight rewards.
- Androgen use: raises the expected muscle-gain rate.

**Verification.** A synthetic-user simulator (`test/support/`) runs the full
weekly loop against people whose true physiology the engine never sees. It
covers biased loggers, collapsing logging quality, and recomp at flat weight.

## Platform and data

- **Storage.** Drift (SQLite), not Isar: the original Isar repo was archived
  in 2025. The app is offline-only, and the local database is the system of
  record.
- **Backup.** A user-initiated, encrypted snapshot: `VACUUM INTO`, then
  Argon2id, then XChaCha20-Poly1305. Providers are Google Drive (app data),
  Dropbox (app folder), OneDrive (app root), WebDAV/S3, and a share-sheet
  export. **No iCloud**, because App Store Guideline 5.1.3(ii) forbids storing
  health data there.
- **Health data in:** weight, body fat, lean mass, height, workouts (as
  sessions), menstruation, and steps (context only). **Out:** nutrition.
  Wearable active energy is *not* used in TDEE (27% to over 90% error).
  - iOS: anchored queries.
  - Android: Changes API through WorkManager, plus a re-read when the 30-day
    token expires. Request `READ_HEALTH_DATA_HISTORY` for a cold-start
    backfill.
- **Food data** (US): built offline with a DuckDB pipeline into SQLite packs.
  - Open Food Facts (Hugging Face Parquet, ODbL) is the primary barcode
    source. USDA FoodData Central (CC0) supplies generic foods and Branded
    Foods fill-in.
  - Every entry is validated: energy must roughly match 4P + 4C + 9F (+ 7 for
    alcohol), within max(15%, 20 kcal).
  - Barcodes are normalized to GTIN-14.
  - The merged pack is published under ODbL.
  - Lookup order: local pack, then the live OFF API (opt-in), then label OCR
    (ML Kit) into a custom food.
- **Training.** An exercise library, sets × reps × load × RIR, Epley e1RM
  with RIR, weekly hard sets per muscle group, and double-progression
  suggestions.

## Code structure principles

Binding rules from the product owner (MM-159); the short form is in
[AGENTS.md](../AGENTS.md).

- **SOLID, with Liskov substitution and Interface segregation first.**
  Integration points are narrow interfaces that any subtype can replace; a
  consumer depends on the smallest role it needs and never on a concrete class.
- **Ports and adapters.** Interfaces are owned by the layer that uses them
  (`packages/domain`); Drift and vendor code are adapters in `packages/data` and
  the integration packages; one registration file chooses implementations.
- **Fixtures keep work moving.** Every interface has an in-memory
  implementation in `packages/fixtures`, so screens, tests and early work do
  not wait on a vendor, a store rule or a product decision.
- **Contract tests prove substitutability.** One abstract suite per interface,
  run against every implementation.
- **Repositories for all persistence** (MM-161), designed as small role
  interfaces (`WeightReader`, `WeightWriter`, ...), not one store.
- **One declaration per file** (MM-160), checked by `mm arch`.
- **One implementation per control** (MM-163): reusable view parts are
  design-system components; screens never use raw Material controls.

State on 2026-10-08: none of this is yet true of the code. 24 of 42 library
files define several types, there are no interfaces, and the app depends on
`MmStore` directly. The work to get there is workstream WS-14.

## Developer experience

- `mm` is a zero-dependency Dart CLI (`tool/`), launched by `mm.ps1`,
  `mm.cmd`, and `mm`, so there is one implementation for every OS.
- Flutter is pinned through FVM (`.fvmrc`).
- Environments use `--dart-define-from-file=config/<env>.json`. Native
  flavors come later, when the dev and prod app IDs need to install side by
  side.
- iOS tasks fail fast with a clear message on non-macOS hosts.

## Roadmap

What to build next, in what order, and what blocks what is in
[`roadmap/`](../roadmap/README.md): fourteen workstreams with their
dependencies, and the same as data in `roadmap/roadmap.json`. The list that
used to be here is superseded by it.
