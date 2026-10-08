---
id: MM-40
status: done
component: food-logging
related: [MM-37, MM-23, MM-27, MM-41]
---

# Story: Say whether a day is fully logged

## Context
See MM-27. The engine guesses which days were only partly logged, and a guess is worse than being told.

## Decisions (made with the product owner)
- **The user can mark a day complete. The app also classifies unmarked days itself.**

Choices I made without asking (say if any is wrong):
- **Three states**: complete, partial, and unmarked. Tapping the selected state clears it.
- **The control appears once the day has at least one entry.**
- **A line under it says why it matters**: partial days are left out of the metabolism estimate instead of being read as under-eating.

## Description
The Today screen shows "Is this day fully logged?" with Complete and Partial, for the day being viewed.

## Acceptance Criteria
```gherkin
Scenario: Marking complete
  Given a day with food logged
  When Complete is tapped
  Then the day is stored as complete

Scenario: Clearing a mark
  Given a day marked complete
  When Complete is tapped again
  Then the day is unmarked

Scenario: The estimate hears about it
  Given a day is marked partial
  Then the intake the engine sees for that day is marked partial
```

## Notes (built and verified)
- The control is in `today_screen.dart`; `MmStore.setCompleteness`, `watchCompleteness` and `watchIntakeDays` (data tests cover the mark
  reaching the intake stream and the stream re-emitting when a mark changes); the widget test taps Complete.
- A day with nothing logged cannot be marked. That is right for "partial" and "missing", but a deliberate full-day fast cannot be recorded
  as a complete day of zero. Rare; note it if it comes up.
