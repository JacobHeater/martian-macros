---
id: MM-308
status: in-progress
component: food-logging
related: [MM-305, MM-307, MM-309, MM-49, MM-167, MM-48, MM-47]
---

# Story: A logged food keeps its micronutrients

## Context
See MM-305. An entry keeps fiber, sodium and alcohol when its source states them, scaled to the amount
eaten (MM-49). The thirteen nutrients of MM-307 need the same path: from a pack food, a custom food or a
label (MM-309) into the entry, through editing (MM-48) and copying (MM-47).

## Decisions
Choices I made without asking (say if any is wrong):
- **One value object, `Micronutrients`**, for the thirteen, so the entry, the catalog food, the custom food
  and the label reading each carry one field instead of thirteen. Sodium keeps its own field, as it has
  since MM-49; the Micros view reads it with the others.
- **Thirteen nullable columns on `food_entries`** (schema version 4), named as the pack names them, rather
  than one JSON column: each is a number the totals query reads, and the schema stays the documentation.
- **Undefined means unknown**, never zero, everywhere: in the entry, in the database and in the totals.
- **Typed-macro and estimated entries carry none.** Nothing is guessed from the food's name.

## Description
Logging a food scales every micronutrient it states to the amount eaten; editing an entry rescales them;
copying a meal or day copies them; the SQL and in-memory repositories store and return them.

## Acceptance Criteria
```gherkin
Scenario: Logged from the pack
  Given a pack food with potassium 358 mg per 100 g
  When 150 g of it is logged
  Then the entry has potassium 537 mg

Scenario: Unknown stays unknown
  Given a pack food that states no calcium
  When it is logged
  Then the entry's calcium is unknown

Scenario: Edited
  Given that entry
  When the amount is changed to 300 g
  Then its potassium is 1,074 mg

Scenario: Copied
  When the day is copied to tomorrow
  Then the copy has the same micronutrients

Scenario: Stored
  Then the SQL and in-memory food repositories return every micronutrient they were given, and unknown for the rest

Scenario: An older database is upgraded
  Given a version 3 database with food entries
  When the app opens it
  Then the entries are kept and have no micronutrients
```
