---
id: MM-54
status: done
component: food-database
related: [MM-50, MM-43, MM-52, MM-55]
---

# Task: One form for every barcode

## Context
The same product can carry a 12-digit UPC-A, an 8-digit compressed UPC-E, or a 13-digit EAN with a leading zero, and the sources store them
inconsistently (with and without leading zeros, sometimes as numbers that lost them). A scan must find the product whichever form the
package and the database happen to use.

## Description
A pure function, in `mm_domain` or the food catalog package, used by both the pipeline and the scanner:
- strips anything that is not a digit;
- expands UPC-E to UPC-A;
- verifies the check digit and rejects a code that fails;
- left-pads to 14 digits (GTIN-14).

Packs store and index the 14-digit form.

## Acceptance Criteria
```gherkin
Scenario: Different forms, one product
  Then a UPC-A code, the same code with a leading zero as EAN-13, and its UPC-E compression all normalize to the same 14 digits

Scenario: A leading zero lost in the source
  Given a source that stored a UPC-A as an 11-digit number
  Then padding restores it and the check digit verifies

Scenario: A misread
  Given a code whose check digit is wrong
  Then it is rejected

Scenario: EAN-8
  Then an 8-digit EAN is padded to 14 digits and is not mistaken for UPC-E
```

## Notes
- UPC-E and EAN-8 are both 8 digits. The scanner reports the symbology; the function takes it as an argument and does not guess from
  length.

## Progress (built and verified)
- `normalizeBarcode(raw, {symbology})` in `mm_domain` (`food/normalize_barcode.dart`), with `BarcodeSymbology` (UPC-A, UPC-E, EAN-13, EAN-8, GTIN-14). It drops non-digits, expands a UPC-E (told by the caller, never guessed from length) to its UPC-A, verifies the check digit and left-pads to 14 digits; it returns null for a bad check digit or a length outside 8 to 14 digits.
- Tests: UPC-A, EAN-13 with a leading zero and UPC-E give one GTIN-14; a leading zero lost by a source is restored; wrong check digits are rejected; eight digits are an EAN-8 unless told UPC-E; all five UPC-E expansion patterns, against check digits computed independently in the test; nonsense is rejected.
- **Choices to know about**: without a symbology, codes shorter than 8 digits are rejected, so a number that lost more than three leading zeros is not recovered; and a code that happens to pass the check digit under a wrong guess still matches only if that exact product exists in the pack.
- **Not done**: the scanner and the pipeline do not exist yet to call it.
