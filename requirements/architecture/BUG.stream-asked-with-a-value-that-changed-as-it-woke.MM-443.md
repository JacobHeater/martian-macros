---
id: MM-443
status: done
component: architecture
related: [MM-232, MM-233, MM-71]
---

# Bug: A stream that read a cell waking with a value was never asked again

In the app's state (MM-232), a cell over a repository's watch (`StreamCell`) asks its question again whenever a cell the
question read changes. It starts watching those cells only after the question is asked. A cell read while asleep holds its
old value (another stream cell holds "loading"); being watched wakes it, and a store that answers at once (every in-memory
fixture) changes it inside `subscribe`, where the change is deliberately not passed on. So the question had been asked with
the old value and was never asked again.

What it did: with a primary scale chosen (MM-71) and the app opened, the day's imported weigh-in read the choice as still
loading, fell back to the automatic scale, and stayed there. The SQL store answers later, so a phone happened to escape it;
the in-memory fixture did not.

The fix: once a stream cell watches what its question read, it compares each with the version it was read at, and asks
again if any has changed.

## Acceptance Criteria
```gherkin
Scenario: A cell read asleep answers as it wakes
  Given a stream whose question reads another stream that is asleep
  And the other stream's store answers at once when watched
  When the first stream is watched
  Then it holds the answer to the question asked with the other stream's woken value
  And it follows later changes of that value

Scenario: The primary scale chosen before the app opens
  Given a scale chosen as primary with fewer weigh-ins than another
  When the app opens
  Then today's weigh-in is the chosen scale's
```

## Notes
- Guarding tests: `test/state/cells.test.ts` ("asks again when a cell its question read changes as it wakes") and
  `test/settings/primaryScale.test.tsx` ("a scale chosen counts first, even with fewer weigh-ins"). Not run locally; CI
  validates.
