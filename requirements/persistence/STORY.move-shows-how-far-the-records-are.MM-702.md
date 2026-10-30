---
id: MM-702
status: in-progress
component: persistence
related: [MM-698, MM-699, MM-700, MM-63]
---

# Story: Putting a move's records in place shows how far it has come

## Context
After "Replace", the receiving phone shows a sheet while the records replace its own (MM-700), with a busy line only. With
months of health samples that takes a while, and a spinner says nothing about how long. The restore writes in batches
(MM-699), so it knows how many rows it has written of how many.

## Decisions (made with the product owner, 2026-10-29)
- **A progress bar, not a spinner**, on the sheet shown after "Replace".

Choices I made without asking (say if any is wrong):
- **The bar counts rows written of all rows**, reported after every batch. It starts empty while what arrived is read, and the
  percentage beside it is said in words, as the receiving stage's is ("42% in place").
- **The restore takes an optional progress callback** (`DataRestorer.restoreFrom`), so a restore from a backup file could show
  the same later; that screen is not changed here.
- **The status region says the start and the end**, not every percent (the UX guard's F4 on MM-698).

## Description
The sheet after "Replace" shows a progress bar that fills as the rows are written, with the share in words beside it, until
the records are in place.

## Acceptance Criteria
```gherkin
Scenario: The restore reports its rows
  Given a snapshot holding 5000 rows
  When it is restored with a progress callback
  Then the callback is told after every batch, ending at 5000 of 5000

Scenario: The sheet shows the bar
  Given a move's records are being put in place
  When the restore has written 3 rows of 10
  Then the sheet shows a progress bar and "30% in place"
```

## UI/UX
- The bar — apps/mobile/src/gallery/screens/MoveToAnotherPhone.stories.tsx (Story: MoveApplying, small phone).
