---
id: MM-386
status: done
component: food-database
related: [MM-384, MM-56, MM-55, MM-387]
---

# Bug: Re-opening the catalog after an install or a removal leaks the previous packs' handles

## Context
`AppState.packsChanged()` bumps a counter that re-runs the catalog stream, and on the phone `services.catalog` re-opens every
installed pack (`openInstalledCatalog`). `FoodCatalog` has no `close`, and `StreamCell.connect` drops the old subscription
without closing what it produced, so each install or removal leaves the previous `SqliteFoodPack` handles open natively. If
a second `packsChanged` arrives while the first re-open is in flight, the first result is discarded with its packs open.
Found by the panel's React role by inspection (`docs/agent-runs/mm383-sources-and-downloads/`, F3), not reproduced at runtime.
MM-384 coalesces two `packsChanged()` calls in one tick into one re-open, which halves the leak with two packs installing
together but does not close it.

## Decisions
Choices the author made without asking (2026-10-21), easy to overrule:
- The previous catalog is closed once the new one has settled, just before the new one is given to search, not the moment
  the re-open starts. The screens keep showing the previous catalog while the new one opens, so closing it earlier would
  let a search typed in that gap read a closed pack. At most two catalogs are open at once, for as long as a re-open takes.
- A catalog closes only the packs it opened. The foods found online (MM-58) are a pack lent to it and live in the user's
  own database, which it never closes.

## Description
`FoodCatalog.close()` closes the packs it opened; the catalog stream closes the previous catalog when it reconnects, and a
result superseded while in flight is closed, not dropped. When nothing watches the catalog any more, it is closed too.

## Acceptance Criteria
```gherkin
Scenario: Reconnect
  Given an installed catalog open on the phone
  When a pack is installed or removed
  Then the previous catalog's packs are closed before the new catalog is given to search
  And only the new catalog's packs stay open

Scenario: Superseded in flight
  Given a re-open still in flight when another change arrives
  Then the superseded catalog is closed when it settles

Scenario: Nobody watching
  Given the catalog open while search watches it
  When nothing watches it any more
  Then its packs are closed
```

## Notes
- Built 2026-10-21: `FoodCatalog.close()` (`src/foodCatalog/FoodCatalog.ts`) closes the handles it was given as owned;
  `openInstalledCatalog` hands it the packs it opened. `reopenEach` (`src/state/reopenEach.ts`) is a `Watched` that opens
  afresh for each subscription and closes what it opened: a replaced value once the newer subscription settles, a
  superseded one when it settles, and the last one when nothing follows. `installedCatalog` (`src/state/installedCatalog.ts`)
  joins them, and `openAppServices` gives it as the phone's `catalog`.
- Guarding tests: `test/state/catalogReopen.test.ts`, "MM-386: two packsChanged() calls leave only the newest catalog's
  packs open" (counts the open pack handles across two `packsChanged()` calls: three before the fix, one after, none once
  nothing watches) and "MM-386: a re-open superseded while still opening is closed when it settles".
- Not run locally; CI validates. Not checked on a phone: native handle counts were not observed.
