---
id: MM-657
status: done
component: food-logging
related: [MM-58, MM-153, MM-221, MM-456]
---

# Task: a logged entry says where its numbers came from

## Context
The owner, 2026-10-27, asked whether a soda had been found online or in the database, could not tell from the
app, and called that a defect. The entry's portion already records its origin (the pack, the food, the source,
MM-456), but nothing on the entry said it.

## Decisions
From the owner (2026-10-27): the entry says its source.

Choices made without asking (say if any is wrong):
- **One line on the edit sheet**, under the numbers the entry rests on (MM-221): "Source: Manufacturer label
  (USDA), found online." or "…, from the food database on this phone."; "Source: entered by you." for a typed
  entry and "Source: your estimate." for an estimate. The source words are MM-153's (`foodSourceLabel`).
- Nothing new is stored: the origin was kept already.

## Description
Editing a logged entry shows where its numbers came from.

## Acceptance Criteria
```gherkin
Scenario: Found online
  Given a soda found online and logged
  When the entry is edited
  Then the sheet says "Source: Manufacturer label (USDA), found online."
```

## UI/UX
The line sits with the entry's reference line, in its caption style; no new screen. A change the owner
dictated, so no panel.

## Notes
- `format/entryOriginLine.ts` (new), `AddFoodSheet`; the end-to-end test of MM-656 reads the line.
