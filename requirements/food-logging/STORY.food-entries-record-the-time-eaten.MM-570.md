---
id: MM-570
status: done
component: food-logging
related: [MM-441, MM-48, MM-47, MM-70, MM-150, MM-152, MM-167, MM-262, MM-222]
---

# Story: Food entries record the time they were eaten

## Context
A food entry kept its day and its meal, never the time. The health platform was told each meal at a fixed time of day (MM-70),
and nothing in the app could draw a day over the clock. The owner (2026-10-22) decided that entries record when they were eaten,
so the calorie hero can become a running total over the day. The chart itself is MM-571, built on another branch; this ticket is
the data and the editor only.

## Decisions
With the owner (2026-10-22):
- **Entries record when they were eaten**, so the hero can draw a running total over the clock (MM-571).
- **`FoodEntry.eatenAt: number | undefined`**: minutes after local midnight of the entry's own `date`, 0 to 1439, undefined when
  not known. The name and unit are fixed; MM-571 depends on them. The minute belongs to the entry's day, so moving an entry to
  another day (MM-48) keeps its minute.
- **A new entry logged for today takes the time it is now** on the app's clock (`Clock`, the one the tests control). Anything
  else has no time until the person gives one: an entry logged for an earlier day, a copy from another day (MM-47), the demo
  seed, and every entry logged before this version. Nothing is invented for them.
- **Untimed entries will be drawn by MM-571 at their meal's usual time, with a hollow dot**, so a missing time is said, not hidden.
- **Times are not drawn on any chart here, and the Food screen's rows say nothing new.**

Choices I made without asking (say if any is wrong):
- **The row is `TimeEatenRow`**, under the meal chips in the typed form (`AddFoodSheet`), the amount step (`FoodAmountStep`) and
  the estimate step (`EstimateMealStep`): every place a food is logged. Its nearest sibling for a time is Settings > Reminders'
  time row ("At 8:00 AM", `RemindersSection`): an `MmListRow` with the timer icon that opens the design system's
  `overlays.timeOfDay` clock. It is laid out the same way, titled "Time eaten", with the time or "Not set" under it. It offers
  every minute, as the weigh-in window does (MM-441), so a time taken from the clock is never rounded.
- **A time can be changed, never cleared**, as the owner asked. An entry without one opens the clock at its meal's usual time.
- **Each meal's usual time moved into the domain** (`mealUsualMinute`: breakfast 8:00 AM, lunch 12:30 PM, snack 3:30 PM, dinner
  6:30 PM), the times the health platform was already told (MM-70), so MM-571 can place untimed entries the same way.
- **The health platform is told the time eaten** when an entry has one: its adapter already took a start time, so no new platform
  field is added. An entry without one is written at its meal's usual time, as before.
- **The cooking fat logged with a food (MM-152) takes the food's time**: it was eaten with it.
- **An entry being corrected keeps its time**: opening, editing and saving never moves it to now.
- **`FoodEntry` refuses a time outside its day** or not on a whole minute (`ArgumentError`), and the database column has the same
  check, so the in-memory store and the database agree.
- **A narrow read of a run of days**, `FoodRangeReader.watchFoodBetween(first, last)`, for the hero's "your usual day" line, which
  reads past days' meal times (asked for on 2026-10-22 with this ticket). `FoodRepository` extends it. The food log gains an
  index by day so the read is one indexed query. Nothing here reads it yet; MM-571 does.
- The panel pass is skipped: the change was dictated by the owner (apps/mobile/AGENTS.md, "Design").

## Description
`FoodEntry` has `eatenAt`. The database keeps it in `food_entries.eaten_at_minute` (schema version 25, nullable, 0 to 1439); the
upgrade from version 24 keeps every entry with no time, and adds the index `food_entries_epoch_day`. A backup is the database
file, so a backup made before this version is restored through the same upgrade with no time for its entries. The SQL
repository and the in-memory fixture read and write it, and `watchFoodBetween` gives every entry dated `first` to `last`, both
included, by day and then in the order added, again after each change, and nothing when `last` is before `first`.

The add and edit food sheet shows a "Time eaten" row under the meal chips: the time for a new food logged for today, "Not set"
for an entry without one. Pressing it opens the clock; the time chosen is the one saved. The amount and estimate steps show the
same row.

## Acceptance Criteria
```gherkin
Scenario: A food logged for today takes the time it is now
  Given the app's clock says 8:00 AM today
  When the person types a food for today and logs it
  Then the "Time eaten" row said 8:00 AM
  And the entry is stored eaten at minute 480

Scenario: A food logged for another day has no time
  Given the Food screen shows yesterday
  When the person logs a food there
  Then the "Time eaten" row said "Not set"
  And the entry is stored with no time eaten

Scenario: Changing the time eaten
  Given the add food form is open
  When the person presses "Time eaten" and chooses 1:45 PM
  Then the row says 1:45 PM
  And the entry is stored eaten at minute 825

Scenario: An edit keeps the time
  Given an entry eaten at 11:20 AM and the clock at 6:00 PM
  When the person corrects its protein and saves
  Then it is still eaten at 11:20 AM
  When they change its time to 12:05 PM and save
  Then it is eaten at 12:05 PM

Scenario: An entry without a time
  Given an entry logged before times were recorded
  When the person opens it to edit
  Then the "Time eaten" row says "Not set"
  And saving it keeps no time

Scenario: A copy has no time
  Given yesterday's dinner was eaten at 7:00 PM
  When it is copied to today
  Then the copy has no time eaten

Scenario: A database from before times were kept
  Given a version 24 database holding a food entry
  When the app opens it
  Then the entry is kept with no time eaten
  And a time given after is kept, and one outside the day is refused by the database

Scenario: The health platform is told when it was eaten
  Given writing food to the health platform is on
  When a food eaten at 1:07 PM is logged
  Then its record starts at 1:07 PM on its day
  And a food with no time still starts at its meal's usual time

Scenario: Reading a run of days
  Given entries on the day before, the first day, the second day and the day after a range
  When the range from the first day to the second is read
  Then it holds the entries of both days, by day and then in the order added, and none outside
  And a range that ends before it starts is empty
  And an entry added inside the range gives the list again
```

## UI/UX
- AddFoodTimeEaten — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: AddFoodTimeEaten). The typed form with the time
  it is now in the "Time eaten" row, and the clock it opens. Laid out like Reminders' time row (`RemindersSection`).
- EditFoodTimeNotSet — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: EditFoodTimeNotSet). An entry with no time:
  "Not set".
- AddFoodAmount, AddFoodEstimate — the same row on the amount and estimate steps.

## Notes
Progress (2026-10-22):
- Domain: `FoodEntry.eatenAt` (checked to a whole minute of the day), `mealUsualMinute`, and the narrow read
  `FoodRangeReader` (`watchFoodBetween`), which `FoodRepository` extends.
- Persistence: schema version 25 (`eaten_at_minute` and the index `food_entries_epoch_day`), the step from 24 in
  `migrationSteps`, `foodFromRow`, `SqlFoodRepository` (and its `watchFoodBetween`), `InMemoryFoodRepository`, and
  `MirroredFoodLog` passing the range read through.
- Health platform: `nutritionRecordOf` starts at the time eaten, or the meal's usual time.
- Food: `eatenAtWhenLogged`, `TimeEatenRow`, and the row in `AddFoodSheet`, `FoodAmountStep` and `EstimateMealStep`;
  `entriesCopiedTo` gives copies no time.
- Construction paths of `FoodEntry` and what each sets: `AddFoodSheet` (new: now for today, none otherwise; edit: the entry's
  own, or the one chosen), `FoodAmountStep` and its cooking fat (now for today, none otherwise, or the one chosen),
  `EstimateMealStep` (the same), `entriesCopiedTo` (none), `foodFromRow` (the stored one), `InMemoryFoodRepository.addFood`
  (the entry's own), `DemoSeed` and the gallery's scenarios (none).
- Tests: `test/domain/foodEntryEatenAt.test.ts`; the round trip and the range read in `test/contracts/foodRepositoryContract.ts`
  (run against the SQL repository, the in-memory fixture and the health-platform mirror); the version 24 upgrade in
  `test/data/upgrade.test.ts`, with `schema.test.ts` and `schemaFingerprint.test.ts`; the platform's start time in
  `test/healthWrite/mirroredLogs.test.ts`; and the sheet in `test/food/timeEaten.test.tsx` (today at a controlled clock,
  yesterday untimed, a changed time saved, an edit keeps it, an old entry "Not set", a copy untimed).
- Not run locally; CI validates. Not yet seen on a phone.

Out of scope: drawing times anywhere (MM-571), showing a time on the Food screen's rows, and asking for a time when copying.
