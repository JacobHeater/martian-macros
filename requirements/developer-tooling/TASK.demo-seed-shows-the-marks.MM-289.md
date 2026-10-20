---
id: MM-289
component: developer-tooling
status: done
related: [MM-253, MM-255, MM-258, MM-237]
---

# Task: the demo seed shows every mark the direction adds

## What the panel found (product-designer PD-16, PD-22; UX-accessibility UX-15, 2026-10-13)

The register judges design on the demo scenario, and the seed is uniform:
every food entry is "Weighed · amount not recorded", so the method icons
of MM-255 show one glyph; every workout is the same lifts, so every Train
row carries "3 personal records" and the record mark of MM-258 cannot be
judged against an unmarked row.

## What is built

- Demo food entries carry portions across the methods (weighed, a label
  serving, a cup, a palm, an estimate), so the Food story shows at least
  three method icons.
- Demo workouts vary (one record in three, differing sets and lengths), so
  the Train story shows a marked row beside unmarked ones.
- The seed's tests and the stories that read it still pass.

## Acceptance criteria

```gherkin
Scenario: Methods in the register
  Then the Food story shows at least three different method icons

Scenario: A record earns its mark
  Then the Train story shows a row with the record mark and a row without
```

## UI/UX

`Screens/Food` (Food) and `Screens/Train` (Train).

## Progress (2026-10-20, feat/m2)
Built in `apps/mobile/src/fixtures/DemoSeed.ts`:

- Every demo meal carries a portion and its method: oats and yogurt a cup (Cup / spoon), chicken and rice
  350 g (Weighed), tofu and potatoes two palms (Palm, 240 g implied), fruit and nuts a label serving. The mix
  is the same every day, so the estimator never reads a change in logging style (the weighed share is by
  kcal and constant). Today, the partly logged day, has breakfast, an estimated coffee (Estimated totals) and
  the snack: three methods, three icons on the Food story.
- Workouts step their loads up every third week, today's among them (weeks 2, 5, 8, 11, 14 of the fifteen);
  between steps the same load is lifted for fewer reps. A step week is a 65-minute session of three sets a
  lift and sets records on bench, squat and row; the two weeks after are 45- and 50-minute sessions of two
  sets with none. The pull-up's record (assistance dropped) falls on week 7, so a row with one record sits
  among rows with three and rows with none.

Tests: `apps/mobile/test/fixtures/demoSeed.test.ts` (two MM-289 cases: the methods today and yesterday, and
marked weeks beside unmarked), `apps/mobile/test/gallery/demoMarks.test.tsx` (the app over the seed: the
Food screen shows at least three method icons; Train shows a row with the record mark and rows without);
the seed's pinned values updated (`test/app/seedDemo.test.ts`, `test/data/demoSeed.test.ts`: today has three
entries; the newest bench load is 82.5 kg). Stories: `Screens/Food` Food and `Screens/Train` Train, unchanged
in code, now show the marks. Decided here (say if wrong): today gains a coffee rather than the Food story
opening on yesterday, so the destination story stays the app as opened.
