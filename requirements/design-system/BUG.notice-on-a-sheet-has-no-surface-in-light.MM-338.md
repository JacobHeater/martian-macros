---
id: MM-338
status: done
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
Guarded by "MM-338" in `apps/mobile/test/ui/noticeOnSheet.test.ts`, which failed in Light before the fix (its token lookup also had a broken `\s`, fixed with it). Drawn in Storybook and reviewed by the panel's product designer and UX guard (2026-10-16), with MM-337, MM-338, MM-346 and MM-347 as one batch; their changes were built. A notice on a sheet or dialog is drawn on `sunken`, a well of the sheet, in every palette; the designer rejected a Light-only hairline, which would make Info look like Caution. The notice family in `design/screen-direction.md` says so, and that an action there is a secondary button. Measured on sunken: text 15.8 / 17.3 / 16.2, info icon 4.9 / 10.8 / 9.1 (Light / Martian / Dark).
