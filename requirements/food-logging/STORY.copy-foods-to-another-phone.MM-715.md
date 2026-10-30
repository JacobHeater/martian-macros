---
id: MM-715
status: in-progress
component: food-logging
related: [MM-45, MM-167, MM-587, MM-625, MM-633, MM-698, MM-701, MM-714, MM-717]
---

# Story: copy foods, a meal or the chosen foods to another phone, by the move's flow

## Context
The owner, 2026-10-30, from the phone, on a meal's ⋯ menu and the "Change 3 foods" dialog: "I want to use our
newly found move to another phone flow to enable copying meals or selected food items to another phone by the
same flow." Move to another phone (MM-698) replaces the receiving phone whole; this carries a few foods over
the same sealed Wi-Fi link and adds them, replacing nothing.

## Decisions
From the owner, in an interactive Q&A (2026-10-30):
- **Where they land:** the same day and meal as on the sending phone, as a copy to another day lands (MM-633):
  fresh entries, a logged meal as a new meal (MM-587). Nothing on the other phone is replaced. (No time eaten at
  first; the owner then asked for the time to travel, MM-717.)
- **How the other phone gets ready:** the existing Receive screen (Settings > Backup > Move to another phone >
  Receive on this phone, and the welcome's "I have Martian Macros on another phone") shows the same code. What
  arrives is either a whole move or a copy of foods, and the confirmation says which.
- **On arrival:** the receiving phone confirms what came ("Add foods from your other phone?") and adds them with
  Undo.
- **Where it is offered:** on the one shared list (MM-714), so a single food, a logged meal, a whole meal and the
  chosen foods each have "Copy to another phone", after "Copy to another day".
- **What travels:** the entries as logged, and the Library foods they were logged from (origin pack `custom`,
  MM-167): foods and recipes, with their numbers, servings, group, evidence and ingredients.
- **The Library foods are the receiving person's call:** after confirming the foods, the receiving phone asks
  whether to save the Library foods that came to its own Library.

Choices made without asking (say if any is wrong):
- **One link, two parcels.** The move's sender and receiver carry a `MoveParcel`: `everything` (the snapshot,
  photos and coach key, as MM-698 and MM-701) or `foods` (the copy's bytes). The opening exchange, the version
  check, the sealed frames and the one-time code are the same; a foods parcel is at most 16 MiB.
- **The copy's format** is JSON, `martian-macros-food-copy` version 1: the day, the entries and the Library
  foods, every enum checked on reading; a copy that does not read says "What arrived could not be read.
  Nothing on this phone was changed."
- **A same-name Library food is kept, not duplicated and not overwritten:** when the receiving phone already
  has a food of that name (MM-708's rule for a same-name food, without the choice), the arriving entries are
  linked to it. Declined, or with no match, an entry's link to a Library food is dropped: its numbers stay, it
  is just not "from" a saved food there.
- **Undo takes back everything the arrival added:** the entries and the Library foods saved for them, never a
  food the phone already had.
- **The sending phone's sheet is the move's** (`SendMoveSheet`), with the foods' words: "Sent. Your other phone
  has the foods. Confirm there to add them; this phone keeps its own." A failure says "The copy did not happen".
  The receiving sheet's instruction gains one sentence on where "Copy to another phone" is.
- **The photos' lock is not asked** on sending foods: no photo travels.
- **The privacy policy's sentence** on Move to another phone says foods copied this way travel the same way.

## Description
From any food, logged meal, meal or the chosen foods on the Food screen, "Copy to another phone" scans the other
phone's move code and sends those foods, with the Library foods they came from, sealed over the same Wi-Fi.
The other phone confirms, adds them on the same day and meal, asks whether to keep the Library foods, and
offers Undo.

## Acceptance Criteria
```gherkin
Scenario: The item on every surface
  Given dinner holds salmon
  Then salmon's ⋯ menu, a logged meal's, dinner's and the chosen foods' dialog each offer "Copy to another phone" after "Copy to another day"

Scenario: Sent as fresh copies with their Library foods
  Given dinner holds salmon at 7:00 PM, logged from the saved food "Mom's salmon", and rice from the pack
  When "Copy to another phone" is chosen for both and the other phone's code scanned
  Then the parcel sent holds two entries for that day at dinner, each with its time eaten (MM-717), and the one saved food
  And this phone's log is unchanged

Scenario: Received, confirmed, Library kept
  Given this phone shows its code and the other phone sends two foods for dinner, Oct 30, with one Library food
  When "Add" is confirmed and then "Save" for the Library
  Then dinner on Oct 30 holds both foods, the Library holds the food, and salmon is logged from it
  And Undo removes both entries and the saved food

Scenario: Library declined
  When "Add" is confirmed and "Not now" chosen for the Library
  Then the foods are added, none is linked to a saved food, and the Library is unchanged

Scenario: A same-name food is kept
  Given this phone already has "Mom's salmon"
  When the copy is saved to the Library
  Then there is still one "Mom's salmon", and the arriving salmon is logged from it

Scenario: A whole move still works
  When the other phone sends everything
  Then the confirmation is the move's, and the phone is replaced as MM-698 says
```

## UI/UX
All in apps/mobile/src/gallery/screens/MoveToAnotherPhone.stories.tsx unless said.
- The item — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: FoodEntryMenu, FoodEntryMenuSmallPhone).
- Sent — (Story: CopyFoodsSent). The foods' words on the sending sheet.
- Add? — (Stories: CopyFoodsConfirm, small phone with the longest names a meal holds; CopyFoodsLibraryAsk).

## Notes
- Built in `src/transfer/` (`MoveParcel`, `FoodCopy`, `foodCopyBytes`, `foodCopyOfBytes`; the sender and
  receiver carry either parcel), `src/settings/` (`useSendToAnotherPhone` shared by the move and the copy,
  `SendMoveSheet` with the foods' words, `useMoveToAnotherPhone` adding a foods parcel), `src/food/phone/`
  (`useCopyToAnotherPhone`, `addReceivedFoods`, `foodCopyWords`).
- Tests: `test/transfer/move.test.ts` (a foods parcel over the wire), `test/transfer/foodCopy.test.ts` (the
  format), `test/food/copyToAnotherPhone.test.tsx` (the menus, sending, receiving, the Library ask, Undo).
