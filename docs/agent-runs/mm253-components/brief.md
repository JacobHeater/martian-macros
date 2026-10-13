# Run brief

- **Task ID and requested outcome:** `mm253-components`. The owner
  (2026-10-13), after the date dialog took three prompts to become a
  design-system component: "Why did it take me, the non-expert, three
  prompts to get a design-system component? This can't happen. You're the
  panel. Get these experts doing shit right." Outcome: every component of
  the design system walked one by one by three roles, every finding with
  an outcome, and the findings turned into tickets with regression tests
  (MM-253's component walk).
- **Audit mode:** `domain`: the design-system library (`apps/mobile/src/ui/`
  and `ui.css`), its register stories and catalogs under
  `apps/mobile/src/gallery/`, the dialogs, sheets and the overlay host, and
  the architecture test that polices them. Unreviewed: the screens beyond
  spot checks, `src/charts/`, the Android shell, `tool/`. Planning's
  existing-behaviour audit: MM-260 and MM-261 record the defect that
  started this and the first two fixes.
- **For screens:** no screen depth targets; this is a component walk.
  Three bounded task walkthroughs were done from source (product-designer:
  change daily activity, log a weight event, delete an entry;
  UX-accessibility: change the weigh-in reminder time with a refusal). No
  render was available to any reviewer; the chair had looked at the date
  dialog's story in Martian and Light the same day (MM-260).
- **Baseline:** `feature/mm260-own-chevron` at `1b70959` for the
  product-designer and UX-accessibility reviewers; the React-Capacitor
  reviewer saw the tree change under it to the MM-261 state (`MmOption`,
  `controlHomes`), merged as `f63ec38` on `main`, and reviewed the later
  state.
- **Requirement IDs and files:** MM-253 (`requirements/usability/`), MM-260
  (`requirements/design-system/`), MM-261 (`requirements/architecture/`).
  Written from this run: MM-262 to MM-282 (less MM-269 and MM-270, folded).
- **Architecture, design and roadmap inputs:** `AGENTS.md` rule 8,
  `design/visual-language.md`, `design/design-principles.md`,
  `design/anti-cruft-and-anti-slop.md`, `design/interaction-and-motion.md`,
  `design/voice-and-wording.md`, `design/color-and-theme-system.md`,
  `design/design-system-implementation.md`, `apps/mobile/src/theme/tokens.css`,
  `apps/mobile/src/theme/base.css`. SHA-256 of the key inputs per role is in
  `state.json`, computed by the chair on the tree the tickets were written
  from; the reviewers had no shell.
- **Existing facts, non-goals and owner decisions:** screens never use raw
  controls (rule 8); one declaration per file; Storybook is the register;
  Material Outlined icons, no custom glyphs until MM-109; the date and time
  fields had just been given `MmPickerField` (MM-260) and the checker a
  control map (MM-261). Owner decisions made in this run: nothing native
  shows (MM-262); a quiet destructive button kind (MM-280); the Ember
  switch stays; 48 dp for everything pressable (MM-281).
- **Acceptance criteria:** MM-253's "Every component was looked at", added
  the same day; each new ticket carries its own, marked as this run's
  proposals until built.
- **Role assignments:** product-designer, ux-accessibility and
  react-capacitor, each independent, in parallel, read-only. Omitted
  (training, nutrition, coaching, measurement, safety, and the selective
  roles privacy-security, micronutrients, integrations, qa, product,
  architecture), each with this reason:
  Nothing in a component walk of the design system touches a health rule, a coaching message or a measurement; the tickets are visual and structural.
  QA's render checks are listed as the chair's pending work.
- **Dependencies, safety/privacy constraints and unresolved choices:**
  none health-related. Unresolved: four verifications that need a device
  or a render (`decision.md`).
- **Actual writer identity and ownership paths:** the parent session
  (Claude Fable 5.1) as chair and single edit owner, on
  `feature/mm262-own-every-control`: `requirements/`, `roadmap/`,
  `AGENTS.md`, `docs/agent-runs/mm253-components/`.
