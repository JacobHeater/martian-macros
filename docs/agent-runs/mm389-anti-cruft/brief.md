# Brief: lines that narrate the layout, and cruft like them (MM-389)

## Question
The product owner, on the empty Food screen (2026-10-18): "'Nothing logged yet. Start with breakfast.'
violates the anti-cruft policy. It's text that fills up white space and is indicative of AI slop. Have
the UX and Product roles inspect the app for AI slop cruft." Which lines and controls across the app fail
`design/anti-cruft-and-anti-slop.md` §3 and §6 in the same way, which directions prescribe them, and what
must replace any of them, if anything, for a novice or a screen reader user?

## Inputs
- `design/anti-cruft-and-anti-slop.md` (§2, §3, §6, §7), `design/screen-direction.md`
- every screen under `apps/mobile/src`, with the gallery stories and tests that assert the strings

## Roles
- Audit (domain, at 6646354): product, ux-accessibility.
- Change review (working tree of `fix/anti-cruft-copy`): product-designer, ux-accessibility as the UX guard.
