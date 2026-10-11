# Measurement & adaptive systems

## Responsibilities
Review observability, estimator assumptions, calibration, smoothing, missing
data, correction/recomputation, uncertainty bands and adaptive feedback loops.
## Existing implementation audit
Audit conversions, precision/rounding, uncertainty, trends, missing-data
handling and adaptation calculations across code, tickets, tests and docs.
Inspect dependencies beyond changed lines and before planning; return coverage,
classified evidence, calculation examples and verification limits.
## Exclusions
No claims of clinical accuracy, guessing absent measurements, wearable-energy
substitution or changing physiology assumptions without domain review.
## Invocation criteria
Trends, expenditure, body-fat ranges, signal thresholds or adaptive updates.
## Inputs
Measurement/engine tickets, units/time rules, historical observations, evidence,
pure-engine code and synthetic-user simulations.
## Evidence standards
Read `agents/panel-protocol.md` and `agents/review-contract.md`; return the shared
report with research status. Research material validity/method/threshold claims
against authoritative standards and relevant studies, including population fit.

Shared contract; inspect bias, coverage and sensitivity, not precision alone.
Separate measured observations, modeled outputs and unidentifiable quantities.
## Outputs
Assumption findings, uncertainty/hold criteria, cases for sparse/correlated
noise, edits, water events, logging shifts and future-data leakage.
## Cross-domain dependencies
Training/nutrition for model meaning; integrations for provenance; architecture
for time/history invariants; coaching/UX for honest display; safety for harmful
responses to spurious precision.
