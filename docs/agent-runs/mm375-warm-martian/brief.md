# Run brief

- **Task ID and requested outcome:** `mm375-warm-martian`. The product owner, 2026-10-17: "the martian theme suffers
  from purple washout. Please have the UX designer and Product team work together to research 90s color schemes and
  include what I believe is a deficit of warm colors." Outcome: a researched, numerically checked proposal for a revised
  Martian palette (hex values for every role that changes, with the reason), which the chair draws in Storybook and the
  UX guard then reviews before anything ships (MM-293).
- **Audit mode:** `planning`, then `change` once the chair draws the proposal.
- **Existing facts:**
  - The Martian palette (MM-184) is the new-install default, approved by the owner as "retro '90s"
    (`design/color-and-theme-system.md` §1, `apps/mobile/src/theme/tokens.css` `.theme-martian`).
  - Every neutral is a grape-violet: canvas `#120B29`, surface `#20143D`, raised `#2C1B4C`, overlay `#382558`, track
    `#40305E`, selected `#423261`, outline `#594576`, outlineStrong `#A18BBE`, text2 `#D8C7EF`, text3 `#BAA4D3`. The
    accents are acid lime `#C4FF48` (action, positive), aqua `#43F5E0` (ion, protein), pink `#FF80BB` (carbs), violet
    `#9170ED` (fat), gold `#FFD166` (caution), sky `#85CFFF` (info), blue `#4F9DFF` (water), coral `#FF938E` (danger).
    Warm hues appear only as carbs pink, caution gold and danger coral; the action colour is a cool-leaning lime.
  - The doc's rules: one hot accent used as a solid; Ember never tinted or washed; forbidden list (beige, cream, sand, tan,
    brown, clay, terracotta, dusty pink, salmon, peach, olive, desaturated warm neutrals, purple-to-blue gradients, pure
    black, pure white text, neon glows); per-screen budget (one Ember element, one Ion group); text 4.5:1, graphics 3:1;
    at least 10 L* between macros; macro colours only for macros. Note the cream text (`#FFF8E9`) is already an
    owner-approved exception.
  - Also in flight, owner's same message: inline coach insight text moves to `--ion`; food grades get colour fills (the
    chair designs them; no red, MM-108). A warm palette must leave room for four grade fills that are not red.
  - `apps/mobile/test/tokens.test.ts` and `apps/mobile/test/support/flutterTheme.json` hold the tokens steady; the
    contrast tests in the repo check text on every surface level, filled controls, tracks and macro L* gaps.
- **Requirements:** MM-184 (Martian), MM-102/MM-103 (tokens), MM-106 (accessibility), MM-108 (no red for intake),
  MM-370 (grade fills), MM-375 (this work, being written by the chair).
- **Questions to answer together** (product frames, designer proposes; each challenges the other's draft in a second
  round):
  1. What is "purple washout" here, measured: the share of the screen in violet neutrals, the chroma and hue spread of
     the neutrals against the accents, and where the warm deficit shows (renders below).
  2. Which 90s colour schemes fit a fitness and nutrition app for novices that the owner called "retro '90s"? Research
     real references with sources (for example Memphis Group, early-90s sportswear and "windbreaker" colourways, 90s
     Nickelodeon and MTV identities, Windows 95/Mac OS 8 era UI, arcade and Saturday-morning palettes, "Trapper Keeper"
     and Lisa Frank). Say what each contributes, and what dates badly.
  3. Where should warmth enter, by role: canvas and neutrals (warmer violet, plum, aubergine, or a non-violet ink),
     the action colour, a new warm accent, the macro set, or state colours. Respect or explicitly propose overruling each
     doc rule touched, with the reason.
  4. Proposed hex values for every changed role, with WCAG contrast against canvas/surface/raised/overlay, L* gaps
     between macros, and the colour-blind check, worked out (not estimated), or marked unverified.
  5. Room for the four grade fills (A to D, no red) and for ion as small text (coach insight lines at caption size).
- **Renders:** `C:/Users/jacob/AppData/Local/Temp/claude/c--Users-jacob-dev-martian-macros/5768f982-f0cb-404d-8707-4c5ae277fee9/scratchpad/shots2/`,
  the `-martian.png` files (Food, Dashboard, Workout, Coach, Settings at 412 by 915).
- **Roles:** product (scope, brand fit, acceptance criteria) and product-designer (palette and numbers). The UX guard
  (ux-accessibility) reviews the drawn result afterwards.
- **Writer:** the parent session (Claude Opus 5.5), single edit owner. Reviewers are read-only.
