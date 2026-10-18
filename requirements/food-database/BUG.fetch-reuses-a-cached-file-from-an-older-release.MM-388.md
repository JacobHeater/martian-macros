---
id: MM-388
status: done
component: food-database
related: [MM-383, MM-52, MM-51]
---

# Bug: `mm food fetch` reused a cached file from an older release and dated it today

## Context
`mm food fetch` kept each source under a fixed file name (`usda_branded.zip`) and reused the file when it existed, whatever
address it had come from, and `provenance.json` said every source was "downloaded <today>". When MM-383 moved the USDA pins
from the 2025-04-24 releases to 2026-04-30, a machine that had fetched in October would have built the old data under the
new description and a false date, and the pack header would have named a release whose bytes were not in the cache. Found
by the panel's integrations role by inspection (`docs/agent-runs/mm383-sources-and-downloads/`, IN-11).

## Description
The cache records each file's address and the day it arrived (`downloads.json`); a file is reused only when it came from
the same address, otherwise it is downloaded again and its unpacked folder replaced; the provenance names the day each
file was really downloaded.

## Acceptance Criteria
```gherkin
Scenario: Same address
  Given a file fetched on an earlier day from the configured address
  When fetch runs again
  Then the file is reused and the provenance keeps the earlier day

Scenario: The pin moved
  Given a file fetched from an older release's address
  When the source is pinned to a newer release and fetch runs
  Then the newer file is downloaded, its folder replaced, and the provenance names the newer release and today

Scenario: No record
  Given a file left by the older tool with no record of its address
  Then it is downloaded again
```

## Notes
Guarded by `tool/test/foodFetch.test.ts`, which failed before the fix (the second run reused the file and reported it as
downloaded today). Fixed in `tool/src/food.ts`.
