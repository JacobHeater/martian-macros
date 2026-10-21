# The app (`apps/mobile/`)

Read with the root [AGENTS.md](../../AGENTS.md). These rules apply to any
change in this folder.

## Layers

`src/` folders are layers, and `test/layers.test.ts` enforces who may import
whom:

- `lang/` small language helpers (no imports);
- `domain/` entities, units, repository interfaces, screening;
- `engine/` weight trend, adaptive TDEE, partition, safety bounds, targets,
  coach;
- `healthIngest/` what is read from a health platform;
- `sql/` the `SqlDatabase` interface (`sql/wasm/`, `sql/native/`);
- `foodCatalog/` packs, search and the pack download (native adapters in
  `foodCatalog/download/native/`);
- `foodPipeline/` the pack build (file steps under `node/`);
- `fixtures/` in-memory implementations of every interface;
- `data/` SQL repositories over `SqlDatabase` (see `src/data/AGENTS.md`);
- `format/` labels and text;
- `platform/` the shell's plugins behind interfaces;
- `healthWrite/` the food, water and workout logs, told to the health platform
  as they change (MM-70, MM-314, MM-489);
- `state/` cells and controllers; then the screen folders.

`src/ui/` is the design-system library: screens use it, never raw HTML
controls. `test/contracts/` holds the contract suites. `tool/` (at the root)
is the dependency-free `mm` runner. Domain and engine logic stay independent
of React and persistence.

## What the tests enforce

You don't run these locally, but CI fails on them, so write code that passes:

- `test/architecture.test.ts` (MM-246, MM-261, MM-278): one declaration per
  file, named for it (a component may carry its `<Name>Props`; barrels only
  `export`); libraries imported only in the folders it lists; no raw control
  in a screen; no native date, time or select control anywhere; `<button>`
  only in its listed homes; a composite writes no control of its own; no prop
  named `color`, `className` or `style`; no screen draws a row's chevron
  (`MmPressable` is the component for content pressed as a whole). Components
  take meaning (`kind="primary"`), never a color, radius or padding.
- `test/gallery/stories.test.tsx`: every `*Screen.tsx`, `*Sheet.tsx` and
  `*Step.tsx` has a story in `src/gallery/screens/` (`screenStory({ covers,
  shows, open, walk })`), and every story draws and walks.
- `npm run unseen` (MM-321): markup that no story reaches fails, unless
  `test/gallery/unseen.json` names it with a reason. Never add to that
  register to get past the check: draw the state. A state that needs the
  phone is brought with `screenStory`'s `device` (MM-320).
- A stylesheet rule that removes an outline must name `:focus-visible`
  (MM-239). A slider in a list group is an `MmSliderRow` (MM-240).
- A test or story has agreed to the terms unless it says otherwise
  (`renderApp`'s `terms`, `screenStory`'s `terms`).

## Design

- **Storybook is the design register (MM-237).** When you add or change a
  component or a screen, change or add its story in the same PR. A ticket that
  needs a design decision links the story under `## UI/UX`. Never add HTML
  drawings of screens.
- **The panel pass is proportional (owner, 2026-10-20, amending MM-293).** A
  new screen or a new component is drawn in a story in every state it can be
  in (first day, not done yet, done, empty, error), then reviewed by the
  product-designer and UX-accessibility roles within the subagent budget, and
  built once the UX guard has no open blocking finding. Removals, bug fixes
  and changes the owner dictated skip the panel. Their stories are still
  updated.
- **Build a new part like its siblings (MM-318, rule 9 of
  `design/screen-direction.md`).** Before drawing a new section, row or
  control, open the nearest one on that screen and reuse it. Name that sibling
  in the ticket's Decisions, and give a written reason for any different
  pattern. Read the direction at the top of `design/screen-direction.md`
  before touching a screen, and `design/design-system-implementation.md`
  before adding a component.
- **Nothing native shows (MM-262).** No native picker, select list,
  engine-drawn checkbox, slider thumb, tap highlight or focus ring. The design
  system draws every control in every state, in every palette. Each control
  kind has one home (MM-261).
- Words are the domain's own ("split", never an invented "share"), and
  nothing that holds a control sits bare on the canvas (MM-291).
- Rows that are windows into a measurement take it in place (MM-301). Snacks
  stand above the navigation bar (MM-302): use `--mm-navigation-bar-height`
  and `--mm-snack-clearance` for anything placed at the bottom.
- Food is added only from a meal's "+" on Food (MM-438); no screen has an
  "Add food" button.
- Device and emulator screenshots verify native behavior only, never the
  design.

## Tests

- Test helpers are in `test/support/` (`renderApp`, `openTab`,
  `openAddFood`, ...). Reuse them.
- The test clock is noon unless a test sets `hour`.
