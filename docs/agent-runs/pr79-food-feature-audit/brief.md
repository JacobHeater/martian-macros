# Brief: actual food quantity/unit and scaling audit

Audit mode: `feature`. Owner acceptance MM-201; audit existing behavior rather
than an old reported defect. Tooling PR #79 does not authorize application fixes.
Baseline: `copilot/implement-expert-panel`,
`999d32887778f656080e788a1c9aa556e354ec8c`; dirty panel edits and merge of main.
Application inputs unchanged from main. Independent native Claude invocations
received the same bounded feature/baseline scope with role-specific assignments,
canonical loading instructions and no peer conclusions; this brief records
those actual prompts, not a claim they loaded a pre-existing run file.

## Assignments
- Nutrition: reference versus consumed nutrition, serving/gram/ounce arithmetic,
  calories and consistency of logged totals; inspect relevant code/tickets/tests.
- QA: quantity/unit entry/edit/save/read traceability, test validity and missing
  integration/edge cases across relevant layers.
- Chair parent: inspect execution/coverage, deduplicate by cause, route findings
  and request targeted verification. No independent chair review.

Recorded omissions:
Chair synthesizes; no independent chair review.
No training/coaching/adaptation/clinical rule is proposed.
Training, coaching, measurement and clinical safety review omitted because this
bounded arithmetic/traceability audit proposes no training/coaching/adaptation
or clinical rule. Other domain/UI/platform/security reviews remain unreviewed;
two specialists are not whole-app certification.

## Boundaries and acceptance
Reviewers are native read-only profiles with no CLI tool overrides. No commands,
edits or delegation. Existing source inspection is distinct from reproduction.
Use current implementation, actual line references and the shared contract's
classifications; never invent IDs, hashes or outcomes. Owner persists reports,
hashes and actual requested checks. Research uses shared triggers where necessary;
no public queries contain code or private data. Inspect unaffected surrounding
paths only where needed. If no implementation exists, record searched scope.

The owner records coverage, unreviewed areas, findings, verification limits,
referrals and dissent. Confirmed bugs receive allocated tickets/regression guards
without automatically fixing application behavior in this development-tool PR.
