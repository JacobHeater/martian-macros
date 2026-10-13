---
id: MM-246
component: architecture
status: done
related: [MM-159, MM-160, MM-228, MM-229, MM-232]
---

# Task: the engineering rules are checked in TypeScript

## Why

MM-160 enforced the owner's rules on the Dart code with `mm arch`: one
declaration per file, named for it; a vendor import only in its adapter;
no raw control in a screen. The conversion (MM-232) removed the Dart and
with it the check. MM-229 listed the TypeScript replacement as not built;
until now one declaration per file was kept by hand, `layers.test.ts`
covered four libraries, and nothing looked for raw controls. A rule that is
only written down decays (MM-160's words), and it had: twelve files held
several declarations and two screens drew their own buttons.

## The rules, as they read in TypeScript

- **One declaration per file, named for it.** A file exports one named
  thing: a type, interface, class or enum; or a function; or a component
  with its `<Name>Props` type; or a union type with the same-named value
  that carries its cases. A file whose exports are all constants is a
  constants file and may hold a group. A barrel only re-exports. Stories
  files follow Storybook's format and tests are not source. Exports are
  named, never default. Declarations that are not exported are the file's
  own business.
- **A library only where it is listed.** `test/architecture.test.ts` names
  every library the app imports and the folders that may: `react`
  anywhere, `react-dom/client` in `main.tsx`, the SQLite build in
  `sql/wasm/`, Capacitor in `platform/`, `sql/native/` and
  `foodCatalog/download/native/`, Material icons in `ui/`, Storybook in
  `gallery/`, Vitest in tests. A library not on the list fails until it is
  given an adapter folder. Node's modules stay `layers.test.ts`'s rule.
- **No raw control in a screen.** Outside `src/ui/`, a `.tsx` file writes
  no `button`, `input`, `select`, `textarea`, `dialog`, `progress` or
  `meter`; the design system has a component for each.

## What changed to meet them

- **`MmPressable`** joins the design system: content that can be pressed
  as a whole (the calorie hero opening the day, an entry opening its
  editor, a meal heading folding its list). It draws nothing of its own.
  The three raw buttons in `CalorieHero` and `MealSection` use it; their
  layout stays in the screens' own stylesheet on wrappers.
- **Split:** `schema.ts` (`currentSchemaVersion`, `tables`, `Table`,
  `currentSchema`), `statements.ts` (`Values`, `insert`, `upsert`,
  `update`, with `placeholders`), `portionColumns.ts`, `partition.ts`
  (`partitionConstants` and three functions), `safetyBodyFat.ts`
  (`safetyBodyFatConstants` and three functions), `bodyMassIndex.ts`
  (`lowWeightLimits`), `checkNutrition.ts` (`maxKcalPer100g`),
  `easyToMissVisible.ts` (`easyToMissSchedule`), `AppContext.ts`
  (`AppScope`), `MeasurementsStep.tsx` (`MeasurementsTyped`) and
  `WeightEventsCard.tsx` (`onboardingCreatine`). Behavior is unchanged;
  the barrels export the new files.
- **A baseline that can only shrink**, as MM-160 kept: `data/columns.ts`,
  fifteen one-line row readers used together. A file on it that comes to
  follow the rule fails the test until it is taken off.

## Acceptance criteria

```gherkin
Scenario: two declarations
  Given a file under src that exports two functions, or a function beside a constant
  When the test suite runs
  Then the architecture test names the file and what it exports

Scenario: the allowed shapes
  Given a component with its Props type, a union type with its same-named value,
    a file of constants only, or a barrel
  Then the architecture test accepts it

Scenario: a file named for something else
  Given util.ts exporting only computeTargets
  Then the test says the file is computeTargets.ts

Scenario: a library outside its adapter
  Given a screen that imports @capacitor/core, or any library the list does not know
  Then the test names the file and the folders that may import it

Scenario: a raw control
  Given a .tsx file outside src/ui that writes <button>
  Then the test names the file and says to use the component

Scenario: the baseline only shrinks
  Given a baselined file that now follows the rule
  Then the test fails until it is removed from the baseline

Scenario: the tree as committed
  Then the architecture test passes with one file on the baseline
```

## Regression test

`apps/mobile/test/architecture.test.ts`: twelve sample files for the
one-declaration rule (six that pass, six that fail for a named reason), and
the three rules over every file of `src/`.

## Progress

**Done (2026-10-13).** Before the split the test reported twelve files and
two screens; after it, it passes, and the evidence register's file names
follow the split. `MmPressable` is in the Components story and the Food
screen stories; the Food story was looked at in a browser from the static
build at phone size (the hero, a meal heading and an entry row unchanged in
look). Not done: an `mm arch` command of its own, since the test runs
inside `mm check` and CI already.
