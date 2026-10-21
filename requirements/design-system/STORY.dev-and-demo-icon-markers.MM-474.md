---
id: MM-474
status: proposed
component: design-system
related: [MM-109, MM-8]
---

# Story: Tell the dev and demo apps apart by their icons

## Context
MM-8 installs three apps side by side: the real one (`com.martianmacros`), the dev build (`.dev`) and the seeded demo
(`.demo`). MM-109 gives all three the same icon. Their names differ ("Martian Macros Dev", "Martian Macros DEMO"), but a
launcher truncates a long name, so on a home screen the three can look identical, and data entered in the wrong one is
lost to the real one.

## Decisions
Choices I made without asking (say if any is wrong):
- **Only the dev and demo builds change.** The real app's icon stays MM-109's, with no marker.
- **The marker is a change of ground, not a badge**, as a first proposal: the same mark on a different flat ground per
  identity, so it survives every mask shape and the themed (monochrome) icon is unchanged. A corner badge would be
  clipped by circular masks. To be drawn and shown to the owner before it is built.

## Description
The dev and demo builds each have an icon that a person tells from the real app's at a glance on a home screen, on both
platforms.

## Acceptance Criteria
```gherkin
Scenario: Three apps on one phone
  Given the real, dev and demo apps installed together
  Then each icon is told from the other two at a glance, without reading its name
  And the real app's icon is MM-109's, unchanged

Scenario: Built per identity
  Then the marker comes from the identity's own build (the Android flavor's resources, the iOS build setting), not from
  a copy of the whole icon set
```

## Notes
- Android: a flavor's `src/dev/res/values/ic_launcher_background.xml` can override the ground alone. iOS: an
  `ASSETCATALOG_COMPILER_APPICON_NAME` per identity naming a second icon set.
