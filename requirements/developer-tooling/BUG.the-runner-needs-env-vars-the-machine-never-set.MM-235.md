---
id: MM-235
component: developer-tooling
status: done
related: [MM-232, MM-234]
---

# Bug: the runner's Android commands need env vars the machine never set

## What happened

With MM-234 fixed, the owner ran `./mm run --env phone` in a plain
PowerShell and was told "No Android phone connected" while the phone sat
connected. The runner looked for `adb` only through `ANDROID_HOME` (or
PATH), and the machine sets neither: the earlier verifications had exported
it per command. With no `adb`, the device list came back empty, and the
error blamed the phone instead of the missing variable. `gradlew` would
have failed next for the same reason (`JAVA_HOME`).

The Flutter-era runner did not have this problem because `flutter` knew its
own SDK.

## What is right

The runner finds the Android SDK by itself: `ANDROID_HOME`, else
`ANDROID_SDK_ROOT`, else the platform's default install location
(`%LOCALAPPDATA%\Android\Sdk` on Windows, `~/Library/Android/sdk` on
macOS, `~/Android/Sdk` on Linux), else `adb` on PATH. When `adb` still
cannot be run, the error says that — set `ANDROID_HOME` or install
platform-tools — and never claims no phone is connected. For Gradle, when
`JAVA_HOME` is unset, the runner offers Android Studio's bundled JDK when
it is in its default place.

## Acceptance criteria

```gherkin
Scenario: the SDK is found without any environment variable
  Given ANDROID_HOME and ANDROID_SDK_ROOT are unset
  And the SDK is at the platform's default install location
  When I run mm run --env phone in a plain shell
  Then the phone is found and the app is installed on it

Scenario: adb genuinely cannot be run
  Given no SDK anywhere the runner looks
  When any device command runs
  Then the error names adb and how to point the runner at it,
  And never says "No Android phone connected"

Scenario: environment variables still win
  Given ANDROID_HOME is set
  Then the runner uses it, not the default location
```

## Regression test

`tool/test/androidSdk.test.ts`: the resolution order, the defaults per
platform, and that an adb failure reads as an adb problem. Fails on the
runner as ported, passes with the fix.

## Progress

**Fixed (2026-10-12).** `androidSdkFrom` resolves the SDK as above, device
commands throw an adb-naming error when `adb` cannot run, and Gradle gets
Android Studio's JDK when `JAVA_HOME` is missing. Verified in a plain
PowerShell with no variables set: `./mm run --env phone` found the SDK,
built and installed on the connected Pixel.
