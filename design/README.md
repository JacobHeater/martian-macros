# Martian Macros design package

This folder is the product design direction for Martian Macros: how it looks,
how it moves, how screens are organized, and how to build it in Flutter without
it decaying into a generic health app.

**Status of this version:** it replaces an earlier direction ("warm, earthy
rust field instrument") that the product owner rejected as muddy, beige-brown,
low-energy and forgettable. That direction is now a documented negative
example (see [anti-cruft-and-anti-slop.md](anti-cruft-and-anti-slop.md)). The
product-safety, navigation and honesty rules from the earlier package were
sound and are kept.

**What has and has not been done.** This is design direction. Nothing here is
implemented in `apps/mobile` yet. The diagnosis of the current UI was made from
reading the code, not from screenshots. The palette was checked numerically
(contrast, grayscale lightness, color-blind separation) but **has not been seen
rendered on a device**. [palette-preview.html](palette-preview.html) is a
static rendering for judging it before anyone builds it.

**MM-184 update:** Light and Dark are implemented, and the owner approved
the retro '90s **Martian** palette as the default for new installations.
Its deep grape, cream, acid-lime, cyan and pink are intentional exceptions
to the original palette restrictions below. Existing installations retain
their settings; new users preview a theme before onboarding. See
[color-and-theme-system.md](color-and-theme-system.md) for the approved
tokens and rollout. All themes share semantic roles and contrast rules;
primary actions remain flat without glow.

## The direction in one paragraph

**Red planet, blue sunset.** A deep, cool ink-navy night canvas (not black, not
purple) and a clean, near-white day canvas (not cream). One hot **Ember** color
(a vivid Mars red-orange, never tinted or washed out) is reserved for the single
primary action and the current location. A cool **Ion** cyan, the color of a
Martian sunset, is the color of measurement: the trend line and anything the
engine has *estimated*. Three clearly separated macro colors (blue, gold,
violet) carry the food data. A restrained space signature (an orbital horizon
arc, a hairline orbit, one soft limb glow) gives the product an identity
without becoming a theme.

## How this relates to the repository

- [`requirements/`](../requirements/README.md) is authoritative for behavior.
  If this package conflicts with a ticket, follow the ticket and fix this
  package. The visual direction here **supersedes the proposal in MM-102**
  (which assumed a rust-seeded Material palette); MM-102 and MM-103 have been
  updated to match, and remain `proposed` until the rendered review.
- [`roadmap/`](../roadmap/README.md) is authoritative for order. WS-03 is where
  this package becomes code (tokens, components, shell, charts, gallery).
  Since 2026-10-08 the roadmap puts WS-03 first (milestone M0) so the UI lane
  starts from this system; the engine and safety lane (M1) runs in parallel and
  is not displaced by visual work.
- [`docs/architecture.md`](../docs/architecture.md) holds the product decisions
  this package must respect (offline-only, binary sex, no reward for
  restriction).
- The current UI is under `apps/mobile/lib/src/`. It is the starting point and
  is treated as provisional.

## Files

| File | Job |
|---|---|
| [design-principles.md](design-principles.md) | Decision rules, including the new "energy is a requirement" rule |
| [visual-language.md](visual-language.md) | The look: character, surfaces, type, icons, charts, the space signature |
| [color-and-theme-system.md](color-and-theme-system.md) | Exact colors, roles, light/dark structure, measured contrast |
| [interaction-and-motion.md](interaction-and-motion.md) | Feedback, motion, states, haptics, reduce-motion |
| [screen-direction.md](screen-direction.md) | Per-screen tone, density, hierarchy; the Today redesign in detail |
| [ux-architecture.md](ux-architecture.md) | Mental model, navigation, ownership (unchanged from the earlier package) |
| [anti-cruft-and-anti-slop.md](anti-cruft-and-anti-slop.md) | What is wrong today, hard limits, the review checklist |
| [design-system-implementation.md](design-system-implementation.md) | Flutter: `ThemeData`, tokens, components, fonts, tests |
| [design-map.json](design-map.json) | Machine-readable version of all of the above |
| [palette-preview.html](palette-preview.html) | Rendered palette and Today mock in both themes (open in a browser) |

## How agents should use it

1. Before changing any screen, read this README, the screen's section in
   [screen-direction.md](screen-direction.md), its ticket, and its roadmap
   workstream.
2. **Use tokens, not colors.** Never write a `Color(0x…)` in a screen file and
   never reach into `colorScheme.secondaryContainer` for a meaning. Ask the
   theme for a role (`mm.protein`, `mm.trend`, `mm.surface.raised`).
3. If you need something the system does not have, do not invent a local style.
   Propose the role or component in the WS-03 work, and record a temporary
   exception in the ticket.
4. Run the pre-ship checklist in
   [anti-cruft-and-anti-slop.md](anti-cruft-and-anti-slop.md) on every new or
   materially changed screen, in **both** themes.
5. When a durable cross-screen decision changes, change the prose **and**
   [design-map.json](design-map.json) in the same commit. Feature behavior
   belongs in `requirements/`, not here.

## Keeping light, dark and brand aligned

- Both themes are built from the **same role names** and the same hierarchy;
  only the values differ. Dark mode is designed (lighter surfaces mean closer),
  not inverted.
- Brand identity is carried by *relationships* that hold in both themes: Ember
  only on the primary action and current location, Ion only on estimates and the
  trend, macros always the same three hues, one orbital arc as the signature.
- Never fix a problem in only one theme. A change to a token is reviewed in the
  palette preview and the gallery (MM-105) in light and dark together.

## Enforcing discipline

The earlier package set the hard limits (one primary action, no cards in cards,
at most one prominent callout, five destinations). This version adds the color
rules that prevent a return to mud: **no tinted Ember, no brown, no beige, no
dusty pink, no Material seed palette**, and a fixed budget for the space
signature. All are checkable and are listed in the anti-slop file and the JSON
map. Prefer deleting an element to adding a variant to tolerate it.
