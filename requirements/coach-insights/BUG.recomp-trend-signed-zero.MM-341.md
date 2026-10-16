---
id: MM-341
status: done
component: coach-insights
related: [MM-133, MM-321]
---

# Bug: a change that rounded to none was signed ("+0.0%", "+0.0 kg")

## Context
Found drawing the Coach screen's undrawn states for MM-321 (story "Coach Recomp Review"). The trend weight's
sign was chosen before rounding, so a held trend read "+0.0%", and a fall was written with a hyphen instead
of the app's minus sign. The monthly report showed the same in weight, "+0.0 kg, against −0.3 kg intended": `Fmt`
signed weight changes and weekly paces before rounding too, as the Flutter app did.

## Description
A change as a percent is signed after it is rounded: "0.0%" for none, "+1.2%" and "−1.2%" otherwise
(`signedPercent`); `Fmt.weightDelta` and `Fmt.percentPerWeek` sign after rounding. The format parity test
with the Flutter app (MM-230) states this as a knowing departure.

## Acceptance Criteria
```gherkin
Scenario Outline: The trend weight in a recomp review
  Given a trend change of <fraction>
  Then the review says <shown>

  Examples:
    | fraction | shown  |
    | 0.00004  | 0.0%   |
    | -0.012   | −1.2%  |
```

## Notes
Guarded by `apps/mobile/test/coach/recompTrendSign.test.tsx`, which failed before the fix, and
`apps/mobile/test/format/signedPercent.test.ts`, and `apps/mobile/test/format/weightDeltaSign.test.ts`, which
failed before the fix.
