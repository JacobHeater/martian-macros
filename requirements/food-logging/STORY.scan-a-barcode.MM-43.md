---
id: MM-43
status: proposed
component: food-logging
related: [MM-37, MM-42, MM-44, MM-54, MM-55, MM-58]
---

# Story: Log a packaged food by scanning its barcode

## Context
See MM-37. The product owner's requirement: barcodes must be supported.

## Decisions (made with the product owner)
- **Scanning happens on the device** (ML Kit on Android, Apple Vision on iOS), with no server.
- **The order when a barcode is scanned**: the installed food pack; then, if the user has allowed it and there is a network, a live lookup
  (MM-58); then the nutrition label (MM-44).

Choices I made without asking (say if any is wrong):
- **Formats**: UPC-A, UPC-E, EAN-13 and EAN-8, normalized to one form before lookup (MM-54).
- **A found product opens the same amount step as search** (MM-42), defaulting to one label serving.
- **Camera permission is asked for the first time Scan is tapped**, with a sentence saying it is only for barcodes and labels and that
  images do not leave the device.
- **A torch toggle**, and a way to type the digits when the camera cannot read them.

## Description
The add-food sheet gains a Scan action. Pointing the camera at a barcode finds the product and opens the amount step.

## Acceptance Criteria
```gherkin
Scenario: A known product
  Given a product in the installed pack
  When its barcode is scanned
  Then its name and per-serving macros are shown, ready to log

Scenario: UPC-E
  Given a product stored under its 12-digit UPC-A code
  When its compressed UPC-E barcode is scanned
  Then it is found

Scenario: Unknown, offline
  Given a barcode not in the pack and no network
  Then the app offers to scan the nutrition label or enter the food manually

Scenario: Camera denied
  Given camera permission is refused
  Then the app explains and offers typing the barcode digits instead
```

## Notes
- Likely plugin: `mobile_scanner`. Confirm it still wraps ML Kit and Vision without bundling a large model.
- Test with real packaging: curved cans, glossy film, small EAN-8 codes.
