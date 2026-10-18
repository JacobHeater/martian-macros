# UX and accessibility: cruft across the app (audit at 6646354), then the change (UX guard)

## Audit (source inspection, no render)
- **UX-1 (must-fix, remove)** the Food line; nothing must replace it: the hero already says the day is empty. At 7 pm "Start with breakfast" also points at the wrong meal, since Add picks the meal by time.
- **UX-2 (must-fix)** `screen-direction.md` prescribes it.
- **UX-3 (must-fix)** "Press to change." on the completeness row; the row is announced as a button.
- **UX-4 (should-fix, a11y)** empty meal and water sections draw a fold over nothing, heard as "Breakfast, button, expanded".
- **UX-5 (should-fix, a11y)** the hero's figure spoken twice on Food and Coach, by the arc's label and the text; keep the arc's label on the Dashboard, where the press's name replaces the figure.
- **UX-6 (should-fix, a11y)** the welcome arc described as decoration.
- **UX-7, UX-8, UX-9, UX-11** Train intro, Coach and Progress empty lines, "Encrypted backup is coming".
- **UX-10 (should-fix)** two routes to the weekly check-in on Coach, explained twice: needs the product designer.
- Referral: on a past day Food still says "today" (hidden headings, the disclosure).

## The change (UX guard, working tree)
- **B1 (blocking)** the past-day test asserted no button names today, but "Copy breakfast to today" rightly does. Narrow the test and MM-390's criterion.
- Checks passed: empty sections keep their heading and Add button; no screen loses its only spoken figure; the Food page heading is the shown day; the theme chooser's headings are in order.
- **UX-1 (low)** a meal folded on one day stays folded, unseen, on a day it is empty, and hides its first food.
- **UX-2 (low)** the unmarked day's "Mark it complete or partial." needs a food-logging ticket of its own.
