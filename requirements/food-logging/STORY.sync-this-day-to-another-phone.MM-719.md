---
id: MM-719
status: in-progress
component: food-logging
related: [MM-255, MM-611, MM-655, MM-698, MM-715, MM-717, MM-718]
---

# Story: "Sync this day to another phone", a row after the meals, makes the other phone's day match this one

## Context
The owner, 2026-10-30, from the phone, under the day's rows on the Food screen: "add another line item when log
entries are present above refeed day item called sync this day to another phone." Copying foods (MM-715) and
water (MM-718) adds to the other phone; a day kept on two phones drifts, and a sync makes the other phone's day
this one.

## Decisions
From the owner, in an interactive Q&A (2026-10-30):
- **Sync means the other phone's day is made to match this one**: its foods and water for that day are replaced
  by this phone's, so both phones hold the same day. Undo puts its own back.
- **What travels** is the day's foods and water, plus its Refeed or Day off mark and its fully-logged answer, so
  the whole Food screen for that day matches. Workouts and weigh-ins do not go.
- **Where**: a row among the day's rows after the meals, above "Mark a refeed or a day off", shown once anything
  is logged on the day.

Choices made without asking (say if any is wrong):
- **The row** is an `MmListRow` like its neighbours (MM-255, MM-611), with the move's phone icon, titled "Sync
  this day to another phone", its subtitle "Its foods, water and marks; your other phone’s day becomes this one."
  It shows on a day with any food or water logged, up to today, and never on a day still to come.
- **It sends by the move's flow** (MM-715): scan the other phone's code, the sending sheet says "Your other phone
  has this day. Confirm there to make its day match; this phone keeps its own." A failure says "The sync did not
  happen". The foods go with their times (MM-717), the water with its moments (MM-718), and the Library foods
  the entries came from, as a copy does.
- **On the wire** it is the copy's format (version 2) with `whole`: the day's kind and completeness. No new
  parcel kind: the Receive screen and My QR Code take it as they take a copy.
- **The receiving phone asks "Sync this day from your other phone?"**, saying what came ("Your other phone sent
  its whole day for yesterday: 2 foods, 16 fl oz of water, a refeed mark and marked complete.") and what it
  holds now ("This phone’s yesterday holds 1 food, 16 fl oz of water and a day off mark now; the day sent
  replaces that. Undo puts it back."; an empty day: "This phone has nothing for yesterday yet, so nothing is
  replaced."), in its own units. Sync replaces that day's foods in one step, then its water, then sets its marks
  to the sender's. The Library foods are asked for as with a copy. "Synced yesterday from your other phone" with
  Undo, which puts back the day's own foods, water and marks and takes back any Library foods saved. A write
  that fails puts back what was changed and says so.
- **Other days are never touched**, nor anything beyond the Food screen's day.
- **The Receive screen's instruction and the privacy policy** name the sync.

## Description
On the Food screen, a day with anything logged offers "Sync this day to another phone" above its mark. It sends
the day's foods, water and marks to the other phone by the move's code; that phone says what it holds and what
is replaced, and once confirmed makes its day match, with Undo.

## Acceptance Criteria
```gherkin
Scenario: The row
  Given today has nothing logged
  Then there is no sync row
  When a drink of water is logged
  Then "Sync this day to another phone" stands above "Mark a refeed or a day off"

Scenario: Sent whole
  Given today holds oats at 7:30 AM, rice at 7:00 PM, 8 fl oz of water at 8:00 AM, a refeed mark and marked complete
  When the row is pressed and the other phone's code scanned
  Then the day sent holds both foods with their times, the drink with its moment, the refeed mark and the completeness
  And this phone keeps its own

Scenario: Synced there
  Given this phone's yesterday holds toast, 16 fl oz of water and a day off mark, and the other phone sends that day whole
  When "Sync this day from your other phone?" says both sides and Sync is pressed
  Then yesterday holds the two foods sent with their times, the two drinks, a refeed mark and marked complete; today is untouched
  And Undo puts back toast, the 16 fl oz and the day off mark, with no completeness

Scenario: Nothing here
  Given this phone's yesterday is empty
  Then the question says nothing is replaced, and Cancel changes nothing
```

## UI/UX
- The row — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: SyncDayRow).
- Sent — apps/mobile/src/gallery/screens/MoveToAnotherPhone.stories.tsx (Story: SyncDaySent).
- Sync? — apps/mobile/src/gallery/screens/MoveToAnotherPhone.stories.tsx (Story: SyncDayConfirm, small phone).

## Notes
- `FoodDaySyncRow`, `useCopyToAnotherPhone` (`whole`), `WholeDay` in the copy's format, `syncReceivedDay`,
  `daySyncWords`, `DaySide`; the Library save shared with a copy in `saveReceivedLibraryFoods`,
  `linkedToLibrary`, `ReceivingServices`.
- Tests: `test/food/syncDay.test.tsx`, `test/transfer/foodCopy.test.ts`.
