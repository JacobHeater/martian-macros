---
id: MM-237
component: developer-tooling
status: in-progress
related: [MM-210, MM-211, MM-228, MM-236]
---

# Task: Storybook is the design register

## The decision

The owner's call (2026-10-12): the component catalog and the design review
move to Storybook, and it replaces the hand-kept HTML register. The reason
the app moved to web technologies was to track design decisions on tickets
and opine on the design without running the app (the browser-first working
agreement); Storybook is that surface now, with the real components, not
drawings of them.

What this supersedes:

- **MM-210's convention** (HTML assets under `requirements/ui-ux-assets/`,
  linked under `## UI/UX Assets`): retired for new work. The folder stays
  as the historical record of the Flutter-era screens, and old tickets'
  links keep resolving; nothing new is added to it and `mm req` no longer
  checks it.
- **MM-211's manifest** (`coverage.json`, a drawing of every surface):
  retired and deleted. Its replacement arrives in steps: stories cover the
  design system first (this ticket), screens next.
- **The in-app `?gallery` catalog**: removed; its palettes, components and
  icons are stories.

## What is built

- Storybook (react-vite) in `apps/mobile`: `npm run storybook`, or
  `mm storybook` from the root; `npm run build-storybook` for a static
  build the owner can open without a dev server.
- A palette toolbar (martian, dark, light) applying the real theme classes,
  so every story is reviewed in all three.
- Stories for the token palettes and type roles, the component catalog and
  the icon set (MM-236), rendering the same live components the app ships.
- Tickets that need a design decision link the story:
  `src/ui/MmButton.stories.tsx (Story: Kinds)` under a `## UI/UX` heading.
  No validator yet; the convention is in `requirements/README.md`.

## Acceptance criteria

```gherkin
Scenario: the owner reviews without running the app
  When storybook dev or a static build is opened
  Then the palettes, the type roles, every component and every icon are
  there, in all three palettes, as the live components the app ships

Scenario: the old register is retired, not broken
  Then mm req passes with no coverage.json and no asset checks,
  And requirements/ui-ux-assets/README.md says it is the historical record

Scenario: the gallery is gone
  Then the app has no ?gallery route and no Component gallery button
```

## Progress

**Step 1 (2026-10-12).** Storybook 10 installed pinned; palettes, type
roles, components and icons are stories with the palette toolbar; the
`?gallery` route and Settings button are removed and their tests retarget
the catalog components; `mm req` no longer runs the MM-210/MM-211 checks
and `coverage.json` is deleted; the register's README carries the
retirement note; `mm storybook` added. Stories for the screens themselves
are the remaining step, tracked here.
