---
id: MM-589
status: in-progress
component: food-logging
related: [MM-586]
---

# Bug: "Copy prompt" says the phone did not allow copying

## Context
Found by the product owner on their iPhone on 2026-10-22, in a live run (`mm run --ios --phone --live`), the
first time AI meal analysis (MM-586) was tried: pressing "Copy prompt" said "The phone did not allow copying.
Try again." and nothing was copied.

The clipboard was written only through the web clipboard API (`navigator.clipboard`). A live run loads the
app from the Mac over plain http, which is not a secure context, so the WebView offers no clipboard API at
all; Android's WebView also refuses its permission.

## Description
In a browser, copying selects the text in a hidden, read-only field and asks the page to copy it, which needs
no permission and no secure context; the clipboard API is tried only if that fails. In the shell, copying is
native (MM-590). Reading is unchanged:
where the phone refuses to hand over the clipboard, the person pastes into the field (MM-586).

## Acceptance Criteria
```gherkin
Scenario: Copied where the clipboard API is refused
  Given a WebView that refuses the clipboard API's write
  When the person presses "Copy prompt"
  Then the prompt is on the clipboard and the step says it was copied
```

## Notes
- Regression test: `test/platform/navigatorClipboard.test.ts`, "MM-589: copies by selection when the
  clipboard API refuses".
- Owed on a phone: the copy on Android and on iOS.
