---
id: MM-697
component: developer-tooling
status: in-progress
related: [MM-695, MM-696]
---

# Bug: the runner's install refusal over another machine's debug key says only what adb says

## What happened

The owner, 2026-10-29, right after MM-695 and MM-696 put `./mm run
--phone` on the Pixel: the build succeeded and the install was refused,
`INSTALL_FAILED_UPDATE_INCOMPATIBLE: Existing package com.martianmacros.dev
signatures do not match newer version;ignoring!`. The dev app on the phone
had been installed that evening from the owner's Windows box, whose
Android debug keystore is not this Mac's (certificate `ec274f39…` on the
phone, `99bb58d8…` here, both `CN=Android Debug`). Android refuses an
update signed with another key; the only ways through are to sign with
the same key or to uninstall, and uninstalling deletes the app's data.
The runner showed adb's line and stopped, with no word of why or of what
either remedy costs.

## What is right

When an install is refused for a signature mismatch, the runner says, in
plain words: the app on that device was signed with a different debug key
(another machine, or a changed key); the build can be signed with that key
here by copying its `~/.android/debug.keystore` over this machine's; or the
app can be removed first with `adb -s DEVICE uninstall APP_ID`, which
deletes its data. The runner never uninstalls on its own. Any other
install failure keeps adb's words, which are the best there are.

## Acceptance criteria

```gherkin
Scenario: the app on the phone came from another machine
  Given the dev app on the phone was installed with another machine's debug key
  When I run mm run --phone
  Then after adb's refusal the runner explains the key mismatch
  And names both remedies, with the uninstall marked as deleting the app's data
  And nothing is uninstalled

Scenario: any other install failure
  Given adb install fails for another reason
  When I run mm run --phone
  Then adb's own output is shown and nothing is added
```

## Regression test

`tool/test/installRefusalAdvice.test.ts`.

## Progress

**Built (2026-10-29), not yet seen through the runner.** `installAndLaunch`
in `tool/src/android.ts` captures adb's install output, shows it, and adds
`installRefusalAdvice` on a signature mismatch. The owner's own failing
install is the case; the next `./mm run --phone` against the
Windows-signed app shows the advice. Owed: that run.
