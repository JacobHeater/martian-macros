---
id: MM-701
status: in-progress
component: persistence
related: [MM-698, MM-665, MM-63]
---

# Story: Moving to another phone carries the coach's API key; a backup still does not

## Context
The coach's provider and API key (MM-665) are kept in the app's local storage, outside the database, so that a backup file,
which goes wherever the person sends it, never holds a credential that spends money. A move (MM-698) sends the database and
the photos, so the key stayed behind and had to be typed again on the new phone.

## Decisions (made with the product owner, 2026-10-29)
- **A move carries the coach's provider and key; a backup never does.** A move is sealed under a one-time key and goes only to
  the person's own other phone on their Wi-Fi; a backup file goes to storage the person picks.

Choices I made without asking (say if any is wrong):
- **The key travels inside the move's sealed opening frames**, beside the sizes, never in the database.
- **When the sending phone has no key, the receiving phone keeps its own.** Removing a working key gains nothing.
- **It is put in place only after the person confirms**, with the records, as part of the same replacement.

## Description
The sending phone sends its coach provider and key with the move. Once the receiving phone's data is replaced, the key is
saved there, and the coach uses it without being set up again.

## Acceptance Criteria
```gherkin
Scenario: The key comes with a move
  Given the sending phone has a coach provider and API key
  When a move to another phone is confirmed there
  Then the receiving phone has the same provider and key

Scenario: A phone with no key does not clear the other's
  Given the sending phone has no coach key and the receiving phone has one
  When a move is confirmed
  Then the receiving phone keeps its own key

Scenario: Cancelled, nothing changes
  Given the receiving phone cancels the confirmation
  Then its coach key is as it was

Scenario: The key never enters a backup
  When a backup is made
  Then the file holds no coach key

Scenario: The key is sealed on the way
  Then the network carries no readable part of the key
```

## Notes
- The privacy policy's coach paragraph says the key goes to the person's other phone when they move, and nowhere else.
