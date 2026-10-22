---
id: MM-555
status: done
component: design-system
related: [MM-554, MM-375, MM-184, MM-437, MM-106]
---

# Story: Martian on the art's near-black, with the brights lit

## Context
The owner, 2026-10-22, on MM-554's Dashboard: "where the fuck is that deep dark that you see behind the text? i want that
to be the base bg color and the brights to be the accents, button bg colors, etc."

MM-554 took the canvas from the night sky's indigo (`#0E0233`) and climbed the levels into the mountains' purple, so the
app read as purple, not as the art. Behind the "MARTIAN MACROS" lettering the art is a near-black blue-violet, sampled at
`#0A081B` (the owner's crop), with the brights on it: the lettering's lime-yellow, the stripes' lime and hot magenta, the
"MACROS" tangerine.

## Decisions
- **The canvas is the art's near-black** (`#0A081B`). Surface, raised and overlay step up from it in the same hue at
  L* 2.9 / 7.2 / 12.4 / 17.6 (MM-554: 3.4 / 11.7 / 18.6 / 25.7), low chroma, so no level reads purple. Cards stand off
  the canvas by their outline and the 1 dp top highlight, as in Dark.
- **The brights are the fills.** The action stays the lettering's lime-yellow (`#DFF701`). A chosen segment and the
  current tab's plate are lit in the stripes' lime (`#C4F24F`, new tokens `chosen` / `on-chosen`), with the ink on them;
  the current tab's label stays in the action colour. In Dark and Light `chosen` is their `selected` and `on-chosen`
  their text, so neither changes (owner-dictated, so no panel pass; MM-437's check mark still marks the chosen segment
  without colour).
- **The macro and meaning colours stay MM-554's** (tangerine carbs, magenta fat, cyan protein and ion, the planet's red
  for danger). On the darker levels every one gains contrast; fat on overlay rises from 3.0 to 3.9.
- **Every ink is the new canvas** (on-ion, on-danger, on-grade, on-chosen).

| Token | MM-554 | MM-555 | L* | text on it |
|---|---|---|---|---|
| canvas | `#0E0233` | `#0A081B` | 2.9 | 18.7 |
| surface | `#1F0B5F` | `#16122E` | 7.2 | 17.1 |
| raised | `#2E187B` | `#211B3F` | 12.4 | 15.4 |
| overlay | `#3E2697` | `#2C2550` | 17.6 | 13.3 |
| sunken | `#070120` | `#050410` | 1.4 | 19.3 |
| track | `#372182` | `#2E2752` | 18.5 | 13.0 |
| selected | `#4B31A8` | `#3A3166` | 23.9 | 11.0 |
| outline | `#5F43B5` | `#3F3670` | 26.3 | 10.1 |
| outline-strong | `#B49BFF` | `#A99BE6` | | 5.7 on overlay |
| chosen / on-chosen | (none) | `#C4F24F` / `#0A081B` | | ink 15.2 |

The minimum of each rule in `apps/mobile/test/tokens.test.ts` (threshold in brackets): text3 on overlay 8.5 (4.5);
ion 9.5 (4.5); outline-strong on raised 6.6 (3); the action as text 11.7, danger 6.0, caution 8.8, info 8.0,
positive 8.7 on overlay (4.5); on-chosen 15.2, on-danger 8.4 (4.5); bars on the track: fat 3.8, water 4.6 (3); grade
letters 9.3 (4.5); macro L* gaps unchanged.

## Description
The Martian block of `apps/mobile/src/theme/tokens.css` moves its levels to the art's near-black; the recorded theme
(`apps/mobile/test/support/flutterTheme.json`), `design/color-and-theme-system.md` and `design/design-map.json` follow.
`chosen` and `on-chosen` join every palette; a chosen segment and the current tab's plate wear them.

## Acceptance Criteria
- [x] Martian's canvas is `#0A081B` and the levels step up from it as tabled above, in the CSS, the record and the design docs.
- [x] A chosen segment is `on-chosen` on `chosen`, never Ember (`test/ui/textActions.test.tsx`).
- [x] `on-chosen` holds 4.5:1 on `chosen` in every palette, and every MM-554 contrast rule still holds (`test/tokens.test.ts`).
- [x] Dark and Light draw as before: their `chosen` and `on-chosen` equal their `selected` and text.

## UI/UX
Every story in Martian (Storybook is the register, MM-237); the Dashboard's hero, Grams/Split segment and tab bar show
the change.
