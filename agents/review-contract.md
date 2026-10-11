# Shared review contract

Every role uses this contract and its canonical definition. Read-only reviewers
return Markdown; only the current write owner saves it. Use the
[`findings/role.md`](templates/findings/role.md) template, saved under the actual
role slug, including an explicit “none” rather than omitting a section.

## Required report

- **Scope and traceability:** role, reviewer/session identity, requirement IDs
  and exact requirement files inspected; other inputs, inspected commit and
  input SHA-256 hashes. Say “no behavior ticket; tooling only” where applicable.
- **Existing facts versus proposals:** separate repository behavior, approved
  requirements, observed results, hypotheses and new recommendations. Cite file
  and line for repository claims. Do not silently promote design proposals.
- **Findings:** stable local finding ID, severity (blocker/high/medium/low),
  impact, precise location, explanation, actionable recommendation and whether
  confirmed, risk, or question. A no-findings report still records scope.
- **Sources and evidence:** verified URL/title/date or DOI where applicable,
  exact supported claim, population, intervention, outcome, strength of evidence
  and applicability. Link to existing `docs/evidence.md` where it actually
  supports the claim. Never invent authors, citations, credentials or a search
  you did not perform. With no research tools, mark external evidence unverified.
- **Confidence and limitations:** high/medium/low with reasons; missing inputs,
  uncertainty, conflicting evidence, platform/tool constraints and self-review.
- **Acceptance criteria and edge cases:** trace existing criteria to findings
  and tests; label proposed criteria separately. Include missing/partial data,
  edits/deletes, unit/time boundaries and relevant vulnerable populations.
- **Dependencies:** other role slugs, interfaces, requirements and blocking
  decisions; identify who should challenge each cross-domain assumption.
- **Safety concerns:** harm, contraindications, misleading certainty, restricted
  intake, compulsive behavior, privacy and escalation; explicitly “none found”
  is not clinical clearance.
- **Unresolved product decisions:** question, alternatives, impact and actual
  decision authority. Do not pick a vendor/product policy merely to finish.
- **Verification:** actual tests inspected or run, command, result and commit;
  distinguish recommendations from executions. Read-only roles cannot run tests
  with their restricted tools; request execution by the edit owner.

## Evidence and safety boundaries

The panel provides general wellness/product engineering review, not diagnosis,
personalized treatment, medical clearance or medication/supplement prescriptions.
Safety reviewers identify needs for qualified clinician/dietitian review; they
are not substitutes for it. Record population exclusions, screening and referral
gaps. Do not claim a numerical threshold is medically validated merely because
it already exists in the repository. Never use agreement among simulated
personas as scientific evidence. Prefer relevant guidelines and systematic
reviews; explain when only mechanistic, observational or indirect evidence is
available and distinguish association from causation.

Safety or privacy conflicts remain blocked until evidence or an authorized
decision resolves them; convenience and majority vote cannot waive safeguards.
Reports and portable artifacts contain only public/sanitized development
material, synthetic examples and minimum necessary context.
