---
id: MM-338
status: proposed
component: design-system
related: [MM-321, MM-291]
---

# Bug: in Light, a notice on a sheet has no surface

## Context
Found drawing the states no story drew, for MM-321 (story "Scan Unknown Code" in Light). A notice is drawn
on `--surface` and a sheet on `--overlay`; in Light both are white, so a notice on a sheet is bare text on
the sheet, while in Martian and Dark it sits on its own panel. Every notice on a sheet is affected: the
barcode step, the custom food form, the estimate step, an entry without an amount.

## Description
A notice keeps a visible surface wherever it is drawn, in every palette: on a sheet it stands apart from
the sheet as it stands apart from the canvas.

## Acceptance Criteria
```gherkin
Scenario Outline: A notice on a sheet
  Given the <palette> palette
  When a sheet shows a notice
  Then the notice's surface differs from the sheet's

  Examples:
    | palette |
    | Martian |
    | Dark    |
    | Light   |
```

## Notes
Guarded by "MM-338" in `apps/mobile/test/ui/noticeOnSheet.test.ts`, skipped with this ID until the fix
lands. A design fix (which surface a notice takes on a sheet): drawn in Storybook, reviewed by the panel's
designer and UX guard, then built (AGENTS.md).
