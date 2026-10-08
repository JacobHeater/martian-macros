---
id: MM-58
status: proposed
component: food-database
related: [MM-50, MM-43, MM-44, MM-56, MM-95]
---

# Story: Look up an unknown barcode online, if I allow it

## Context
The installed pack is a snapshot. A product launched last month is not in it. Open Food Facts has a public API that can answer for a
single barcode.

## Decisions (made with the product owner)
- **A live lookup is opt-in.** The app is offline by default and health data never leaves the device.

Choices I made without asking (say if any is wrong):
- **The question is asked the first time it would help** (an unknown barcode with a network available): "Look this up online? Only the
  barcode number is sent." with Always, Just this once, and Never. The choice can be changed in Settings.
- **Only the barcode is sent.** No identifier, no account, nothing about the user.
- **A product found online passes the nutrition checks** (MM-53) before it is offered, and is cached on the device so it is found offline
  next time.

## Description
On an unknown barcode, if allowed and online, the app asks the Open Food Facts API for that barcode, validates the answer, and continues to
the amount step as if it had been in the pack. If it is not found, or fails the checks, or there is no network, the app falls through to
reading the label (MM-44).

## Acceptance Criteria
```gherkin
Scenario: First unknown barcode
  Given the user has not been asked before
  When an unknown barcode is scanned with a network available
  Then the app asks, and says only the barcode number is sent

Scenario: Never
  Given the user chose Never
  When an unknown barcode is scanned
  Then no request is made and the label scan is offered

Scenario: Found and remembered
  Given a product was found online
  When its barcode is scanned again with no network
  Then it is found

Scenario: A bad online entry
  Given the online entry fails the nutrition checks
  Then it is not offered, and the label scan is
```

## Notes
- Follow Open Food Facts' API etiquette: a descriptive User-Agent and their rate limits.
