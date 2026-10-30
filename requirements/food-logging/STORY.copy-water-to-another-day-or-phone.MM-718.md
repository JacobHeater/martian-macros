---
id: MM-718
status: in-progress
component: food-logging
related: [MM-313, MM-318, MM-319, MM-633, MM-698, MM-714, MM-715, MM-717]
---

# Story: a drink of water copies to another day or to the other phone, from its menu

## Context
A drink's ⋯ menu on the Food screen held "Delete" alone (MM-318), while a food's holds the copies and moves
(MM-714) and "Copy to another phone" (MM-715). The owner, 2026-10-30, from the phone, on a drink's menu: "add
copy to other phone and copy to another day on water."

## Decisions
From the owner (2026-10-30): "Copy to another day" and "Copy to another phone" on a drink of water.

Choices made without asking (say if any is wrong):
- **The menu reads Copy to another day, Copy to another phone, Delete**: the copies in a food's order (MM-714),
  then Delete. Time, meal and day moves are not offered: a drink has no meal, and its moment is when it was had.
- **Copy to another day** asks which day ("Copy 8 fl oz of water at 8:00 AM to", any day up to today), logs the
  amount on it at the moment of copying, so a past day's row says "Added later" (MM-319), as a food's copy has no
  time (MM-633), and says "Copied 8 fl oz of water to yesterday" with Undo. A copy that cannot be saved says so.
- **Copy to another phone** sends the drink by the move's flow (MM-715), with the moment it was had, as a food's
  copy carries its time (MM-717). The sending sheet says "Your other phone has the water. Confirm there to add it;
  this phone keeps its own."
- **The copy's format is version 2**, with a `water` list; a phone reading version 1 refuses it whole rather than
  add the foods and lose the water. A copy holds at least one food or drink.
- **The receiving phone asks as for foods**: "Add water from your other phone?" ("Your other phone sent 16 fl oz
  of water in 2 drinks yesterday. They are added to this phone, on that day. Nothing here is replaced."), in its
  own units; foods and water together are "Add foods and water from your other phone?" and the sentence names
  both. Added with Undo, which takes back the drinks with the foods and any Library foods saved. Nothing of the
  Library is asked for water alone.
- **The Receive screen's instruction and the privacy policy** say a drink's menu copies too.

## Description
On the Food screen, a drink of water's ⋯ menu copies it to another day, or to the other phone by the move's code,
where it is confirmed and added on its day with Undo.

## Acceptance Criteria
```gherkin
Scenario: The menu
  Given 8 fl oz of water at 8:00 AM today
  Then its ⋯ menu offers Copy to another day, Copy to another phone and Delete, in that order

Scenario: Copy to another day
  When Copy to another day is chosen and yesterday picked
  Then yesterday holds 8 fl oz logged now, today's drink is unchanged, "Copied 8 fl oz of water to yesterday" is said, and Undo removes the copy

Scenario: Copy to another phone
  When Copy to another phone is chosen and the other phone's code scanned
  Then the copy sent holds the drink for today, 8 fl oz, at 8:00 AM, and no food
  And this phone keeps its drink

Scenario: Water received
  Given this phone shows its code and the other phone sends two drinks for yesterday
  When "Add water from your other phone?" is confirmed
  Then yesterday holds both drinks at their moments, "Added 16 fl oz of water from your other phone" is said, and Undo removes them

Scenario: Foods and water received
  When the other phone sends a food and a drink for yesterday
  Then "Add foods and water from your other phone?" names both, and Add logs both
```

## UI/UX
- The menu — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: WaterEntryMenu).
- Sent — apps/mobile/src/gallery/screens/MoveToAnotherPhone.stories.tsx (Story: CopyWaterSent).
- Add? — apps/mobile/src/gallery/screens/MoveToAnotherPhone.stories.tsx (Story: CopyWaterConfirm, small phone).

## Notes
- `WaterSection` (the menu and the copy to a day), `useCopyToAnotherPhone` (foods or water), `FoodCopy` and its
  codec (version 2), `addReceivedFoods`, `foodCopyWords`, `foodCopyKind`, `SendWhat`.
- Tests: `test/food/copyWater.test.tsx`, `test/transfer/foodCopy.test.ts`.
