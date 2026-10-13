---
id: MM-237
component: developer-tooling
status: done
related: [MM-210, MM-211, MM-228, MM-236, MM-239, MM-240]
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
- Stories for every screen, sheet and step (`src/gallery/screens/`, under
  "Screens" in the sidebar). Each is the whole app as shipped, drawn
  over in-memory stores on a fixed day (the demo's ten weeks unless the
  story is about something else) in a phone's viewport, and brought to its
  screen the way the app reaches it: a destination chosen, a screen pushed,
  a sheet opened, or the steps a person takes walked for them. Nothing is
  redrawn for the register, so a story cannot differ from the app.
- The preview loads the stylesheets in the app's own order, so a rule that
  only wins by load order behaves in a story as it does on the phone
  (MM-239 was invisible in the catalog for want of this).
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

Scenario: every screen is in the register
  Then every component of the app named for a screen, a sheet or a step is
  covered by a story, and a new one without a story fails the tests

Scenario: no story is broken
  When each story is drawn and walked to where it goes
  Then it shows the words it says it shows

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

**Step 2 (2026-10-12): the screens.** 50 screen stories in seven groups
(first run and gates, Today, Food, Progress, Train, Coach, Settings), plus
Fields and Sliders in the design system. `App` takes children so a story
can open a screen from inside the app's own scope; the in-memory services
the tests used moved to `src/gallery/fixtureServices.ts` and the tests use
the same ones. `apps/mobile/test/gallery/stories.test.tsx` draws and walks
every story and fails when a screen, sheet or step has none. Looked at in
a browser from the static build at phone size: Settings, Add food, the
onboarding Training step and a workout, across the three palettes. The
The expert panel's role files and protocol (`agents/`) still told reviewers
to maintain the HTML assets and the coverage manifest; they now name the
stories. The static build is not part of `mm check`: on Windows it writes a valid build
and then exits 127 from a libuv assertion on the way out.
