---
id: MM-29
status: proposed
component: adaptive-coach
related: [MM-22, MM-11, MM-28, MM-96, MM-110, MM-112, MM-143]
---

# Task: Professional review of the safety limits and screening rules

## Context
The limits in MM-28 and the screening rules in MM-11 were assembled from published guidance and judgement by people who are not clinicians.
They decide the lowest calories the app will ever tell someone to eat. That needs a qualified signature before anyone outside the project
relies on it.

## Description
A registered dietitian, and where relevant a physician, reviews:
- every row of the limits table, and the protein rules;
- the change that restricts the energy-availability floor to lean users;
- the screening rules, especially pregnancy, breastfeeding (the 400 kcal figure), eating-disorder history, and kidney disease;
- the wording of every caution and safety note shown to users;
- what is missing (conditions not screened for, such as diabetes treated with insulin).

Their changes are made in `safety_bounds.dart`, `screening.dart` and the tests, and recorded here with their name and the date.

## Acceptance Criteria
```gherkin
Scenario: Review recorded
  Given the review is complete
  Then this ticket names the reviewer, their credential and the date, and lists each change they required

Scenario: Changes are in the code
  Given a limit the reviewer changed
  Then the engine's value and its test match the reviewed value
```

## Notes
- This blocks public release (MM-94), not development.
- Later tickets add to the review's scope: the safeguards that act after onboarding (MM-110), the wider and repeated health check
  (MM-112), and the evidence register (MM-143), which lists every constant with its source and is the document to review against.
