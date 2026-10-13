---
id: MM-241
component: developer-tooling
status: done
related: [MM-198, MM-201, MM-228, MM-232, MM-237]
---

# Task: the panel's implementation role is for the app as it is built

## The decision

The owner's call (2026-10-12): "get the old flutter panel role out of here
and change it to a new ionic (and other techs this uses) role." The
repository has had no Dart since MM-232, and the panel still had a
`flutter` role reviewing "Dart/Flutter correctness".

## What is built

- The role is `react-capacitor` (`agents/roles/react-capacitor.md`,
  `panel-react-capacitor` in the Claude and Copilot adapters). It reviews
  what the app is made of: React and strict TypeScript, the cells of
  `state/`, the shared controls and their CSS, the Vite build and offline
  check, Vitest, Storybook, the Capacitor Android shell with the app's own
  Kotlin plugins, and the `mm` runner.
- The name says Capacitor and not Ionic on purpose: the shell is Ionic's
  Capacitor runtime, and the app uses none of the Ionic Framework's
  components. Its controls are its own (`src/ui/`).
- `flutter` is gone from the schema's role list, the chair's adapters, the
  index and the checker. The other roles' hand-offs name the new role, and
  their Flutter-era terms (Drift, goldens) are replaced.
- Saved runs under `docs/agent-runs/` keep the role name they were run
  with; they are records, and `mm panel <run-dir>` on one of them will now
  report the unknown role.

## Acceptance criteria

```gherkin
Scenario: the panel has no Flutter role
  When mm panel is run
  Then it passes with fifteen roles, one of them react-capacitor,
  And no role file, adapter or schema names flutter

Scenario: the role reviews this stack
  Then its responsibilities name React, TypeScript, Vite, Vitest,
  Storybook, the Capacitor shell and its Kotlin plugins
```

## Progress

**Done (2026-10-12).** Renamed with `git mv`, rewritten, and every
reference followed; `mm panel` and the tool's tests pass.
