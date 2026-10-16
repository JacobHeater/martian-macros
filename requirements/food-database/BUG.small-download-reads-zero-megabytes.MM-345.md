---
id: MM-345
status: done
component: food-database
related: [MM-56, MM-321]
---

# Bug: a small download read "0.0 MB of 0.0 MB"

## Context
Found drawing the food database's undrawn states for MM-321 (story "Food Database Downloading"). Sizes
were always said in megabytes to one place, so a file under 50 kB, such as a small pack or an update, read
"0.0 MB of 0.0 MB" while it downloaded.

## Description
Under a tenth of a megabyte a size is said in kilobytes ("42 kB"); from there on as before ("0.8 MB",
"47 MB"). The format parity test with the Flutter app (MM-230) states this as a knowing departure.

## Acceptance Criteria
```gherkin
Scenario Outline: A size
  Given a file of <bytes> bytes
  Then its size reads <shown>

  Examples:
    | bytes    | shown  |
    | 42300    | 42 kB  |
    | 800000   | 0.8 MB |
    | 46739747 | 47 MB  |
```

## Notes
Guarded by `apps/mobile/test/format/smallDownloads.test.ts`, which failed before the fix.
