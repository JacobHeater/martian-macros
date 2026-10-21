---
id: MM-501
status: proposed
component: adaptive-coach
related: [MM-34, MM-156, MM-35]
---

# Story: The Navy tape method joins my body-fat range

## Context
Split from MM-34, which built the range from height, weight, age, sex and waist. The owner's decision there was that without a smart
scale the fallback is a tape: weekly waist, and the Navy method. The Navy method needs neck, and hip for a female profile, which nothing
stores until MM-156 adds more measurement sites.

## Description
Once MM-156 stores neck and hip, the Navy formula (sex-specific; neck and waist for men, neck, waist and hip for women) joins
`estimateBodyFat` as a third estimate, combined by how reliable it is and with its error allowed to go together with the other formulas'.
It uses recent entries' middle values, as the waist does. Every new figure gets an evidence row.

## Acceptance Criteria
```gherkin
Scenario: Neck and hip entered
  Given three or more waist, neck and (for a female profile) hip entries in the last four weeks
  Then the range rests on the Navy method as well, and is no wider than without it

Scenario: Only some sites
  Given waist entries but no neck entries
  Then the range is MM-34's, unchanged

Scenario: One mistyped neck entry
  Given a settled range
  When one neck entry is mistyped
  Then the shown range does not move
```

## Notes
- Depends on MM-156. No schema change of its own.
