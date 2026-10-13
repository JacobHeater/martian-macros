---
id: MM-177
status: done
component: developer-tooling
related: [MM-176]
---

# Task: Repeatable synthetic data in an isolated demo app

## Decisions
The owner requests a script that seeds many records repeatedly without manual
entry. They explicitly chose a separate demo app/database, never replacing
their real phone data. Synthetic dates are anchored to today's local date;
the generated scenario is deterministic and visibly identified as a demo.
The automatic phone shortcut is maintained separately in MM-175.
This command therefore accepts an explicit Android device ID and does not
duplicate its automatic phone-selection helper.

## Acceptance Criteria
```gherkin
Scenario: Demo on a phone
  When the documented mm demo seed command is run for a physical Android phone
  Then a separately identified demo app runs with its own database
  And deterministic synthetic setup, food, completeness, target, weight, waist and recovery histories populate the Dashboard
  And at least sixty days of history and today's partial intake are available
  And the normal app's database is not opened or modified

Scenario: Repeatable reset
  When the demo seed command is run again
  Then only the demo database is reset and seeded
  And records do not accumulate as duplicates

Scenario: No implicit production seed
  When the normal dev or prod app starts
  Then no synthetic records are inserted
  And demo-only startup is guarded from production configuration
```

## Progress

- Implemented `mm demo --seed -d <exact Android ID>` with fixed development
  defines and explicit connected Android selection (phone or emulator).
- Android builds derive the `.demo` package ID and DEMO launcher name from the
  same `MM_DEMO_APP` define used by Dart. Normal native build modes and iOS
  configuration are unchanged; no flavors or schema changes are introduced.
- Startup rejects non-Android/production demo and seed-without-demo configs
  before storage opens. It uses a separate `martian_macros_demo` database and
  completes reset/seeding before any screen subscribes.
- The shared fixture generator writes seventy completed history days plus
  today's partial breakfast, daily weights, eleven weekly waist/recovery
  observations and eleven target records. Values are deterministic relative
  to today's local calendar day. Seeded demo builds reset on every launch.
- An always-visible DEMO strip identifies synthetic data on every screen.
- Tests cover fixture/SQLite reset, deterministic values, date anchoring,
  completeness/history coverage, a second unaffected store, configuration
  guards, command argument restrictions, and visible identification.
- Validation: five focused Flutter tests and three tool tests passed. The
  native identity regression guard failed before MM-178's fix, then passed.
  The Android release bundle built successfully; its packaged manifest was
  checked for the `.demo` application ID and DEMO launcher label. `mm req`
  and `mm arch` passed during implementation. Full integration checks and
  emulator/golden inspection are delegated to the coordinating session.
- No physical phone installation or launch is authorized. Device acceptance
  and visual inspection remain unverified. Seeded demo startup resets on
  every launch (not only on a new command invocation); this is intentional.

**Done (2026-10-13), in the React shell.** `mm demo --seed -d <id>` builds
the web app with `MM_DEMO_SEED=1`, which Vite turns into the
`__MM_DEMO_SEED__` constant; `src/app/seedDemo.ts` then replaces the demo
app's data with `DemoSeed` (seventy days, anchored to the phone's current
day, the same on every launch) before any screen subscribes, inside the
shell only, and `App` shows the DEMO strip. A normal `mm run` or `mm build`
never carries the variable, even when the shell that ran it had it set
(`tool/test/webBuildEnv.test.ts`); a build that was not asked, or a
browser, is never seeded (`test/app/seedDemo.test.ts`: seeded, anchored,
replaced without duplicates, not seeded otherwise). The shell has only the
demo identity (MM-228), so the normal app's database is never opened. Run
on the owner's Pixel with `mm demo --seed -d 47261FDAS00EDR`; the phone was
locked, so the Dashboard was not seen there. The same seed is the Today
story's data in Storybook (`demoScenario`), where it was looked at.
