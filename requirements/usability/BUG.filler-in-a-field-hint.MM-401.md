---
id: MM-401
status: done
component: usability
related: [MM-389, MM-108, MM-358]
---

# Bug: "Your own amount. From 17 to 202 fl oz." and filler like it

## Context
The owner, on the water goal in Settings (2026-10-18): "Nothing has sounded more AI than this shit right
here," and "This cannot happen again." The hint narrated the field ("Your own amount.", "Type your own
to change it.") before giving the range. MM-389 removed such lines by hand; nothing stopped new ones.

## Description
The water goal's hint says only what the field does not: why a suggestion was made, a care-team note, a
note above a high amount, and the range ("17 to 202 fl oz."). The food reminder's condition reads "On
days with no food logged yet." The Welcome screen's "Get started" becomes "Begin" (the theme chooser
already has a Continue). And `test/voice.test.ts` fails on filler patterns the owner has caught
(narrating an empty screen, "press to change", "type your own", "your own amount", "… is coming",
"get started", "let's", "here you can", a slogan headline, cheering); a pattern is added whenever a new
one is caught.

## Acceptance Criteria
```gherkin
Scenario: A water goal the person typed
  Then the hint under the field is the range alone

Scenario: Filler in any text the app shows
  When a string matching a filler pattern is added
  Then the voice test fails, naming the file and the text
```

## Notes
`test/format/support/dartFormats.json` (the Dart app's recorded strings) is updated for the reminder line.
