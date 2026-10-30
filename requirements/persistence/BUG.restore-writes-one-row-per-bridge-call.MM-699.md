---
id: MM-699
status: in-progress
component: persistence
related: [MM-63, MM-698, MM-700]
---

# Bug: A restore writes one row per statement, minutes on a phone

## Context
The owner moved from the iPhone to the Pixel (MM-698) and confirmed "Replace". Nothing appeared to happen; the welcome stayed,
and the app was swiped away. Read off the Pixel over USB (2026-10-29, logcat and the WebView's DevTools): at 21:24 the app was
still inside the restore, inserting `imported_samples` (the iPhone's Apple Health samples) one `INSERT` per row, each a call
across the native bridge (`MmDb.execute`), at about 160 rows a second. The restore is one transaction, so it was rolled back
when the app was killed and the Pixel stayed empty.

`SqlDataRestorer` (MM-63) copied every row with its own statement. In a browser that is fast; on a phone every statement is a
bridge round trip, and a phone that reads Apple Health or Health Connect holds tens of thousands of samples. A restore from a
backup file takes the same path.

## Description
A restore writes each table's rows in multi-row statements, each within 999 parameters (SQLite's limit before 3.32; the app
supports Android 8, whose SQLite has it).

## Acceptance Criteria
```gherkin
Scenario: Thousands of rows in tens of statements
  Given a snapshot holding 5000 imported health samples
  When it is restored
  Then all 5000 are present
  And the restore ran fewer than 200 statements, none with more than 999 parameters
```

## Notes
- Guarded by `test/data/restoreInBatches.test.ts`, which failed with 5000 statements before the change.
- Owed on the owner's phones: the same move from the iPhone, finishing in seconds rather than minutes. The dev build logs
  every bridge call (Capacitor's verbose logging), which slows it further; the batches make that matter far less.
