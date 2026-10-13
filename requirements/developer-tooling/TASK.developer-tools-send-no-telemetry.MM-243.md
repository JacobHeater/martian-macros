---
id: MM-243
component: developer-tooling
status: done
related: [MM-232, MM-237]
---

# Task: the developer tools send no telemetry

## The decision

The owner's call (2026-10-12): "Opt out of telemetry for Capacitor and
Storybook." Both report usage to their makers unless told not to. The app
fetches one thing, ever; the tools it is built with send nothing either.

## What each one sent, and how it is turned off

- **Storybook** reports events and, when enabled, crash reports, and
  fetches a "what's new" feed and a version check. `.storybook/main.ts`
  sets `core.disableTelemetry`, turns crash reports and the news feed off,
  and the dev script passes `--no-version-updates`. This travels with the
  repository.
- **Capacitor's CLI** sends each command it runs, with its arguments, the
  app's id and the versions of its packages, whenever the terminal is
  interactive. It is **on until turned off**: the first successful command
  on a machine writes `telemetry: true` to a file kept for the machine
  (`sysconfig.json` in the user's Capacitor config folder), not in the
  repository. So there is no setting to commit. Instead:
  - `mm bootstrap` runs `cap telemetry off` after installing;
  - the one script that runs the CLI (`npm run android`, which `mm build`
    and `mm run` use) runs `cap telemetry off` first, so a machine that
    never bootstrapped is opted out before its first command.
- The owner's machine had it on; it is off now.

Not covered, because nobody asked and nothing was found sending: Vite,
Vitest and npm report no usage. The Android Gradle Plugin's analytics
follow Android Studio's own setting, outside this repository.

## Acceptance criteria

```gherkin
Scenario: Storybook is silent
  Then .storybook/main.ts disables telemetry, crash reports and the news feed,
  And the storybook script passes --no-version-updates

Scenario: Capacitor is opted out before it can send
  Then every package script that runs the cap CLI runs "cap telemetry off" first,
  And mm bootstrap opts the machine out

Scenario: a new machine
  Given a machine that has never run Capacitor
  When mm run or mm build is its first command
  Then the opt-out is written before any other cap command runs
```

## Regression test

`apps/mobile/test/telemetry.test.ts` reads the Storybook config and the
package scripts.

## Progress

**Done (2026-10-12).** The test failed first, then passed. On the owner's
machine `cap telemetry` reported on before and reports off after.
