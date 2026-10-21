---
id: MM-522
status: done
component: health-sync
related: [MM-70, MM-314, MM-489, MM-63]
---

# Bug: After "Erase all data", a new entry could replace a record written to the health app before the erase

## Context
Found while building the write path (MM-70, MM-314, MM-489), 2026-10-21. Each record the app writes carries the app's
own id for it (Health Connect's client record id, HealthKit's sync identifier), built from the entry's id, so writing
again replaces it. Entry ids start again after "Erase all data", and a restore (MM-63) takes them back to the backup's.
A new entry would then be written under the id of an unrelated one written before, and the platform would replace that
record: the person's history in the health app changed without a word.

## Decisions
Choices I made without asking (say if any is wrong):
- **A write namespace in every id.** A random namespace, made once by the health plugin and kept in its own preferences
  beside the writing switches, sits after the app's prefix in every id (`martian-macros-food-<namespace>-<id>`, and the
  same for water and workouts). The app renews it after every erase and every restore, so ids never repeat. Reinstalling
  the app clears the plugin's preferences, which gives a new namespace too.
- **The app's prefix still comes first**, so a workout written under any namespace is known as the app's own and never
  imported (`workoutFromPlatform`), and the plugins skip the app's own records by its package or source, whatever the id.
- **What was written before stays in the health app**, as the terms (sections 9 and 10) and the privacy policy say.

## Description
No record the app writes after an erase or a restore can share an id with one written before.

## Acceptance Criteria
```gherkin
Scenario: An erase does not reuse ids
  Given a food written to the health app as entry 1
  When all data is erased and a new food is logged, which is entry 1 again
  Then the health app holds both records

Scenario: The app still knows its own workouts
  Given workouts the app wrote before and after an erase
  When workouts are read from the health app
  Then none of them is imported as another app's
```

## Notes
- Regression tests: `test/healthWrite/mirroredLogs.test.ts` ("ids across an erase (MM-522)"), `healthWriteNamespaceContract`
  run against the plugin adapter, the fixture and no platform (`test/platform/nativeHealthWriting.test.ts`), and both
  plugins offering `writeNamespace` and `renewWriteNamespace` (`test/native/mmHealthWrites.test.ts`).
- Fixed in the same PR as the write path (#227), before anything was released. Not run locally; CI validates.
