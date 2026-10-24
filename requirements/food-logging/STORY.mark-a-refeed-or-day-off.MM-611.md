---
id: MM-611
status: done
component: food-logging
related: [MM-604, MM-612, MM-605, MM-27, MM-108, MM-124, MM-92]
---

# Story: Mark a day as a Refeed or a Day off

## Context
The owner wants single days judged by the coach (MM-612). A planned high day or a day off should not be picked apart as if it
were a lapse. On 2026-10-24 the owner asked that the person can mark such a day in the Food tab and "let it be on record", and
chose the names **Refeed** and **Day off**. "Cheat" is banned by MM-108 and the voice test.

## Decisions
By the product owner, 2026-10-24: two marks, Refeed and Day off.

Choices made without asking (say if any is wrong):
- **A Refeed** is a day eaten higher on purpose. **A Day off** is a day away from the plan: a holiday, a party, travel. Both work
  the same for the coach. They differ in name, in the day's record, and in reports ("2 refeeds and 1 day off this month").
- **A mark is separate from completeness** (MM-27). A Day off may be partly logged, and it is still partial if it is.
- **A mark changes no calculation.** The day's intake counts in the energy-use estimate, the weight trend and the targets exactly
  as it would unmarked. It changes only how the coach speaks:
  - no single-day finding for the day (MM-612);
  - in trends it is counted and named in the evidence;
  - it never contributes a food to a trade.
- **Any day up to today** can be marked or unmarked, from the Food day's header. No future days, since a plan is not a record.
- **No judgement of how often.** No rule counts marks to warn about them, and no streak or reward involves them (MM-92).
- **Built like its sibling (MM-318).** The mark sits beside the completeness mark in the Food day's header
  (`FoodDayHeader`), and "Mark day" opens the same options dialog the completeness row uses (`FoodCompletenessRow`):
  Refeed, Day off, No mark. The chip is the design system's `MmStatusChip`, neutral and the same for both marks.
- **Stored apart from completeness**: its own table, `day_kinds` (schema version 27), a row only for a marked day;
  clearing a mark removes the row.

## Description
A per-day mark (none, refeed, day off) stored with the day. It is set and cleared from the Food day's header and shown there as a
chip. It is read by the coach engine and the monthly report. It needs a repository, a SQL implementation, an in-memory fixture, a
contract suite and a migration.

## Acceptance Criteria
```gherkin
Scenario: Marking a day
  Given the Food tab on 18 Oct
  When the person chooses "Mark day" and then "Refeed"
  Then the day shows a "Refeed" chip, and the mark survives a restart

Scenario: Unmarking
  Given a day marked "Day off"
  When the mark is cleared
  Then the chip is gone and the coach treats the day as any other

Scenario: Calculations unchanged
  Given the same logs with and without a mark
  Then energy use, the weight trend and the targets are identical

Scenario: Not judged alone
  Given today marked "Refeed" with fat at twice its target
  Then the coach's 1d analysis shows the day's totals and no fix

Scenario: Named in trends
  Given a fat trend spanning a marked day
  Then its numbers say the span includes 1 refeed

Scenario: Not today's future
  Then tomorrow cannot be marked

Scenario: Report
  Given 2 refeeds and 1 day off in a month
  Then the monthly report states them as counts, with no comment
```

## UI/UX
- The day header's mark menu and chip, in the Food stories. Both marks use the same neutral chip.

## Progress

Built 2026-10-24. Not run locally; CI validates.

- **Domain**: `DayKind` (`none`, `refeed`, `dayOff`) in `apps/mobile/src/domain/DayKind.ts`, mirroring
  `DayCompleteness`; `DayKindReader` (`watchDayKind`, `watchMarkedDays`), `DayKindWriter` (`setDayKind`, `none`
  clears) and `DayKindRepository` in `src/domain/repositories/`.
- **Data**: `SqlDayKindRepository` (`src/data/`), `InMemoryDayKindRepository` (`src/fixtures/`), both in their
  repository sets and in `AppServices` as `dayKinds` (`openAppServices.ts`, `fixtureServices.ts`). Schema version 27:
  the `day_kinds` table in `currentSchema.ts`, `tables.ts` (so erase and restore cover it) and the 26-to-27 step in
  `migrationSteps.ts`.
- **State**: `DayKindController` (`src/state/`) marks a day up to today and refuses a day still to come;
  `AppState.dayKind(date)` reads a day's mark and `AppState.markedDays` feeds the monthly report.
- **UI**: `FoodDayHeader` shows the mark as a neutral `MmStatusChip` and a "Mark day" `MmIconButton` (flag) that opens
  the options dialog "Mark this day". No action on a day still to come; the stepper already stops at today. The
  header wraps on a narrow phone.
- **Report**: `MonthlyReport.refeeds` and `daysOff`, counted in `buildMonthlyReport` from the marked days in the
  period, and stated by `MonthlyReportText` as "Refeeds" and "Days off" counts after "Whole days", only when non-zero,
  with no comment.
- **No calculation reads the mark**: energy use, the weight trend and the targets are unchanged. The coach's use of
  it (no single-day finding, named in trends, no trades) is MM-612's.
- **Tests**: `test/contracts/dayKindRepositoryContract.ts`, run in memory (`test/fixtures/inMemoryContracts.test.ts`)
  and on SQLite (`test/data/sqlContracts.test.ts`); erase (`test/contracts/dataEraserContract.ts`) and restore
  (`test/data/restore.test.ts`); the migration (`test/data/upgrade.test.ts`, version 26), the fingerprint
  (`test/data/schemaFingerprint.test.ts`) and the table list (`test/data/schema.test.ts`); state
  (`test/state/dayKind.test.ts`: marking up to today, tomorrow refused, calculations identical with and without marks,
  the report's counts); the report (`test/engine/monthlyReport.test.ts`, `test/format/reportDayKinds.test.ts`); the UI
  (`test/food/markDay.test.tsx`: marking, unmarking, persistence across a restart, a past day, no step to tomorrow).
- **Stories**: `Screens/Food` DayMarkedRefeed, DayMarkedDayOffSmallPhone and MarkDay.
- The scenarios "Not judged alone" and "Named in trends" wait on MM-612.
