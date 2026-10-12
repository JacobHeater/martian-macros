# Run brief: Add food, walked

- Task ID and requested outcome: `mm212-add-food-walkthrough`. Review the
  usability of adding and correcting a food as the app is built today, under
  the task-walkthrough rule of `agents/review-contract.md` (MM-212). Findings
  only; no change to the app is requested or authorized.
- Audit mode (change/feature/domain/panel-baseline), bounded coverage and
  unreviewed areas; planning's existing-behavior audit: `feature`. In scope:
  the Add food sheet and every step reached from it. Out of scope: the
  Dashboard, the Food screen's own layout, Coach, Progress, onboarding,
  nutrition arithmetic (audited in `pr79-food-feature-audit`), the food
  database download.
- For screens: depth targets, the count that chose them, and the render
  supplied for each (or why none); what is only surveyed: one depth target,
  the Add food sheet. Counted from the source on 2026-10-11 (controls a
  person can act on; branches in the build code): add food 67 and 155;
  workout logging 39 and 70; settings 29 and 39; onboarding 19 and 34;
  progress entry 11 and 30; coach 11 and 34; pause 6 and 14; the Food
  screen 5 and 19. Renders of the built sheet, 360 by 800 logical pixels,
  dark palette, from the screenshot tests added for this run:
  `apps/mobile/test/goldens/images/add_food_opened_dark.png` (as it opens),
  `add_food_form_end_dark.png` (the rest of the typed form),
  `add_food_search_dark.png`, `add_food_amount_dark.png`,
  `add_food_estimate_dark.png`, `add_food_edit_dark.png`. No render exists of
  barcode scanning, saved foods, recipes or the label reader: walk those from
  source and say so, or leave them surveyed. Nothing else is surveyed.
- Baseline branch/commit and working-tree changes:
  `feature/mm212-usability-by-inspection` at `ca3ff57`, with uncommitted
  changes to `agents/` and `requirements/` that do not touch the app.
- Requirement IDs and exact files (or tooling-only explanation): MM-38,
  MM-39, MM-42, MM-43, MM-44, MM-45, MM-46, MM-48, MM-150, MM-151, MM-153,
  MM-167 under `requirements/food-logging/` and `requirements/food-database/`
  (find each with a search for its id).
- Architecture/design/roadmap inputs and hashes: `design/screen-direction.md`,
  `design/ux-architecture.md`, `design/interaction-and-motion.md`,
  `design/voice-and-wording.md`. Hashes are in `state.json`.
- Existing facts, non-goals and approved owner decisions: the app is offline;
  an entry records how it was measured and what its numbers are for (MM-167).
  A requirement that asks for a field does not settle whether a person can
  use it. Do not redesign; say what fails and what would have to be true.
- Acceptance criteria and proposed criteria (separate): each reviewer returns
  the shared report with a step record for each task below, each area marked
  walked or surveyed, and findings classed under the contract.
- Relevant core/selective role assignments and reasons for omissions:
  UX & accessibility and Product designer, independently, neither seeing the
  other's report. Tasks to walk, for a person in their first week with the
  app, on a 360-wide phone, with a food database installed:
  1. Log a packaged food by typing what its label says.
  2. Find a food by searching and log how much was eaten.
  3. Log a restaurant meal without knowing its numbers.
  4. Correct an entry logged earlier today.
  Omitted: training, nutrition, micronutrients, coaching, measurement, safety,
  product, architecture, Flutter, integrations, privacy-security, QA. No
  domain rule, data handling or code is under review.
- Dependencies, safety/privacy constraints and unresolved choices: reviewers
  are read-only and cannot run the app. `requirements/ui-ux-assets/views/add-food.html`
  is a drawing made from the source; it may orient and is not the render.
  Synthetic fixture data only.
- Actual writer identity and ownership paths (or no owner): the chair, Claude
  Code session `9c9d02ab`, owns `docs/agent-runs/mm212-add-food-walkthrough/`.

## Record of omissions (added by the chair after the reviews; the assignment above is unchanged)

Each omitted role is recorded with the reason: "Outside a usability walkthrough of built screens; no rule of this domain is proposed or changed."
The chair is recorded with the reason: "The chair synthesizes; it did not write an independent review."
