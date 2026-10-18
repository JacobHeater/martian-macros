---
id: MM-386
status: proposed
component: food-database
related: [MM-384, MM-56, MM-55]
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

## Description
`FoodCatalog.close()` closes its packs; the catalog stream closes the previous catalog when it reconnects, and a result
superseded while in flight is closed, not dropped.

## Acceptance Criteria
```gherkin
Scenario: Reconnect
  Given an installed catalog open on the phone
  When a pack is installed or removed
  Then the previous catalog's packs are closed before the new one is read

Scenario: Superseded in flight
  Given a re-open still in flight when another change arrives
  Then the superseded catalog is closed when it settles
```

## Notes
Needs a regression test that counts open pack handles across two `packsChanged()` calls, failing before the fix.
