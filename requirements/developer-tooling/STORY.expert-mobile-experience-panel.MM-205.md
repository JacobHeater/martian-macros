---
id: MM-205
status: done
component: developer-tooling
related: [MM-198, MM-201, MM-101]
---

# Story: Expert mobile-experience panel for novice fitness users

## Context
The owner reports that the app feels like card-heavy, analysis-heavy views
designed for an expert rather than a novice. UX and product-design roles must
provide expert, evidence-aware mobile guidance and collaborate across boundaries,
not merely audit visual tokens or accessibility checklists.

## Description
Require product design and UX specialists to audit the existing novice fitness
journey, research relevant modern mobile/fitness experience evidence, separate
their remits, and request bounded cross-domain consultation from the chair.
They should prioritize comprehension and everyday task completion over surface
count or metric density while preserving visible safety, uncertainty and user
agency. This changes panel guidance, not app behavior.

## Acceptance Criteria
```gherkin
Scenario: Specialists audit the current novice experience before proposing
  Given a bounded UX or product-design assignment
  When a specialist reviews or plans changes
  Then it traces an existing novice journey across relevant screens and states
  And records user intent, decisions, hierarchy, cognitive burden and coverage
  And distinguishes observed behavior from design hypotheses

Scenario: The chair commissions a novice-experience panel audit
  Given visual density and novice task-flow are both within the audit scope
  When the chair assigns the product-design and UX reviews
  Then both roles independently inspect the same bounded task before seeing
       the other's findings
  And the product designer reports visual hierarchy and density
  And UX reports task choices, comprehension, recovery and accessibility

Scenario: Material mobile-experience claims are externally researched
  Given a claim about current mobile, fitness or accessibility best practice
  When applicable current evidence is not already recorded
  Then the specialist discovers and retrieves authoritative or methodologically
       appropriate sources
  And records applicability, limitations, conflicts and uncertainty

Scenario: Questions outside a specialist's remit are routed
  Given a cross-domain question encountered during a UX/design audit
  When it requires another domain's expertise
  Then the specialist sends the chair a bounded consultation question
  And the relevant read-only role answers independently
  And the requesting specialist records whether the answer changed its
      recommendation
  And the chair persists that response with the consultation

Scenario: Guidance reduces cognitive burden without hiding risk
  Given a proposed simplification to a novice-facing experience
  When it is synthesized
  Then routine priorities are clearer and secondary detail is deliberately
       disclosed
  And material uncertainty, safety instructions and destructive consequences
       remain available and understandable
```

## Notes
User feedback is a problem signal, not proof that every card is harmful.
Inspect current implementation and relevant design requirements; do not
redesign screens or change product behavior under this role-guidance ticket.
Distinct Product Designer and UX audits, delegated research, bounded
cross-domain challenges, findings, decisions, and verification limits are
persisted in `docs/agent-runs/mm205-novice-mobile-experience/`. The audit's
three reproducible app findings were implemented and completed separately
under MM-206, MM-207, and MM-208. No Simple-mode chart policy change was made.
Validated with `mm panel`, focused and full mobile widget tests, and the
repository-wide `mm check`. Native accessibility/platform behavior and novice
task performance remain unverified.
