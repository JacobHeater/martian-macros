# Decisions: actual PR #79 smoke

- D1 accepted (owner's PR scope): install all native Copilot adapters; cloud
  omission was execution-environment restriction, not repo policy.
- D2 accepted (official sources and actual smoke): discovery is separate from
  retrieval; use native tools or bounded chair research. No new provider added.
- D3 accepted (owner's allocation process): provisional panel MM-195 conflicted
  with upstream training ticket; `mm req next` allocated MM-197, then MM-198.
- D4 accepted (protocol): preserve independent source findings; challenge only
  changed native docs and overstrong interpretations. Source/renderer duplicates
  and agreement between tools are not independent evidence.
- D5 accepted (owner): do not merge #79. Local validation and CI must be actual;
  untested Copilot picker/CLI/cloud runtime remains an explicit limitation.

No health/product policy decision, dissent waived by majority, or invented
review completion. Baseline is a dirty-tree smoke; commit alone is insufficient.
