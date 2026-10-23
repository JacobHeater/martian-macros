---
id: MM-590
status: in-progress
component: food-logging
related: [MM-586, MM-589]
---

# Bug: "Paste from clipboard" cannot read the clipboard on the phone

## Context
Found by the product owner on their iPhone on 2026-10-22, in a live run (MM-586): "Paste from clipboard"
always said the phone did not hand over the clipboard, leaving only the field to paste into by hand. The
clipboard was read through the web clipboard API (`navigator.clipboard.readText`), which does not exist on a
page served over plain http, as a live run is, and whose permission Android's WebView never grants; no web
way around it exists for reading.

## Description
In the shell, the clipboard is read and written natively, through the `MmBackup` plugin that already hands
things to the phone's other apps (MM-454): `ClipboardManager` on Android, read on the main thread while the
app has focus, and `UIPasteboard` on iOS. In a browser the page's clipboard stays (MM-589). The field stays
as the fallback.

## Acceptance Criteria
```gherkin
Scenario: Pasted on the phone
  Given the assistant's answer is on the phone's clipboard
  When the person presses "Paste from clipboard"
  Then the meal is read and shown for review

Scenario: Copied on the phone
  When the person presses "Copy prompt"
  Then the prompt is on the phone's clipboard
```

## Notes
- Regression test: `test/platform/nativeClipboard.test.ts` ("MM-590: writes and reads the phone's
  clipboard"); the Kotlin and Swift methods are not compiled locally (owner's rule) and CI compiles no Swift.
- The shell must be rebuilt for the native methods: a live run started before them reloads the web code only,
  and the old shell refuses the call (the fallback message, and no "Allow Paste" question).
- Owed on a phone: Paste on Android (Android 12 and later show a "pasted from your clipboard" notice, which
  is the system's) and on iOS (iOS asks "Allow Paste" unless allowed in Settings); a release build, as any
  plugin change needs (`android/AGENTS.md`).
