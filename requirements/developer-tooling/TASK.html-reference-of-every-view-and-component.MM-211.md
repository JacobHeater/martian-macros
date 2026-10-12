---
id: MM-211
status: done
component: developer-tooling
related: [MM-210, MM-104, MM-105, MM-6, MM-174]
---

# Task: An HTML reference of every view and component, kept with the requirements

## Context
MM-210 said where HTML UI/UX assets live and how tickets link them, and found
one such file in the repository. The owner's intent was larger: every screen,
view and component of the app drawn as HTML, retroactively for what is built
and from now on for whatever is added. Screenshot tests show a handful of
screens in one state each; nothing showed the rest, their states, or how they
connect, without building and running the app.

## Decisions (made with the product owner)
- **Every existing view, reusable component, sheet and dialog has an HTML
  drawing, with its meaningful states.** An inventory alone is not coverage.
- **The first library draws what is built**, not what might be better. A
  redesign is a separate sheet, marked as a proposal.
- **A coverage manifest maps every UI source file to its drawing**, with the
  states drawn, its requirements, how it was checked and what limits it.
- **Tickets link the drawings under `## UI/UX Assets`** (MM-210).
- **New views and components are drawn in the pull request that adds them;
  changed ones are redrawn in the pull request that changes them.**
- **A drawing never makes a broken screen look finished.**

Choices I made without asking (say if any is wrong):
- **Eight view sheets, not one file per screen.** A sheet covers a
  destination and the screens that open from it, one frame per state, each
  frame with its own address (`views/coach.html#target-change-sheet`). The
  manifest names the frame for every source file, so nothing is ambiguous.
- **One component catalog**, a specimen per component with its states, each
  addressed `components/index.html#<id>`.
- **One flows sheet**: the navigation map and eight paths, each step linked
  to the frame that draws it.
- **Frames are drawn by a small shared script** (`shared/mm.js`) from the
  app's tokens copied into `shared/mm.css`. No framework, nothing fetched.
  The app's fonts are read from `apps/mobile/assets/fonts/`.
- **A new status, `Current`**, for a drawing of what is built. It is added to
  MM-210's four, which describe designs.
- **"Draws something" is decided by the code**: a file that declares a widget
  or a painter, or a top-level `show…` function. `mm req` fails when such a
  file is not in the manifest. A `State` class belongs to its widget.
- **Hosts and platform surfaces are listed as `not-drawn`, with the reason**:
  six files that draw nothing themselves or open something that belongs to
  the phone (the camera view, the time picker, notifications).
- **Text size is shown by scaling the whole frame**, which is close to and
  not the same as the app scaling only text.

## Description
- `requirements/ui-ux-assets/index.html` is the way in.
- `views/`: dashboard, food, add-food, train, progress, coach, settings,
  onboarding. `components/index.html`. `flows/index.html`.
- `coverage.json` lists every drawing source file once: `source`, `symbol`,
  `kind`, `requirements`, `asset` (sheet and frame), `states`,
  `verification`, `status`, and `limits` where the drawing leaves something
  out.
- Every sheet has a theme switch (Martian, Dark, Light) and a text-size
  switch; segments, chips, switches, check boxes, choice cards and folded
  sections answer a tap; some frames open a sheet or a dialog.
- Each ticket a drawing supports lists it under `## UI/UX Assets`.
- `AGENTS.md` and the panel roles make keeping it part of every UI change.
- `mm req` reports, naming the file:
  - a widget file that the manifest does not list;
  - a manifest entry for a source file, a symbol, a sheet, a frame or a
    ticket that does not exist, or one listed twice;
  - an entry with an unknown kind, verification or status, with no states,
    with no requirement, or not `covered` and silent about why;
  - a sheet the manifest uses that `index.html` does not link;
  - a link, in a ticket or in a sheet, to a frame that does not exist.

## Acceptance Criteria
```gherkin
Scenario: A new view or component
  Given a new file under "apps/mobile/lib/src" that declares a widget
  And "coverage.json" has no entry for it
  When "mm req" is run
  Then it names the file and says to draw it, add its entry and link its tickets, and exits non-zero

Scenario: An existing view
  Given any file under "apps/mobile/lib/src" that declares a widget, a painter or a show function
  Then "coverage.json" has exactly one entry for it
  And the entry's frame exists in the sheet it names

Scenario: A removed view
  Given a manifest entry whose source file no longer exists
  When "mm req" is run
  Then it names the file and says to remove the entry or point it at what replaced it

Scenario: An updated view whose frame was renamed
  Given a manifest entry naming a frame its sheet does not have
  When "mm req" is run
  Then it names the source file, the sheet and the frame

Scenario: A shared drawing
  Given two source files whose entries name the same frame
  And two tickets linking the same sheet
  When "mm req" is run
  Then it reports nothing about them

Scenario: A broken link in a ticket
  Given a ticket entry linking "views/coach.html#no-such-frame"
  When "mm req" is run
  Then it names the ticket, the sheet and the frame, and exits non-zero

Scenario: A broken link between sheets
  Given the flows sheet links a frame that a view sheet does not have
  When "mm req" is run
  Then it names the flows sheet and the link

Scenario: Something that cannot be drawn
  Given an entry with status "not-drawn"
  Then its "limits" says why
  And an entry without that explanation is reported

Scenario: An uncertain association
  Given a surface that fits no ticket
  Then it is recorded under "unresolved" with what must be decided
  And an entry that lists no requirement is reported

Scenario: A ticket that does not exist
  Given an entry naming a requirement id no ticket has
  When "mm req" is run
  Then it names the entry and the id

Scenario: A sheet missing from the index
  Given a sheet used by the manifest that "index.html" does not link
  When "mm req" is run
  Then it names the sheet

Scenario: Reading the library
  When "requirements/ui-ux-assets/index.html" is opened in a browser from the repository
  Then every sheet opens from it with nothing fetched from the network
  And each sheet says it is a drawing of what is built, what it was drawn from and what limits it
```

## Notes (built and verified)
- Inventory, from the code: 165 source files draw something
  (37 views, 50 parts of views, 48 components,
  12 sheets, 6 dialogs, 2 navigation, 4 painters,
  6 hosts). All are in the manifest. 159 are drawn; 6
  are `not-drawn` with the reason. Eight flows.
- How each was checked: 76 compared by eye with a screenshot test of the
  built screen (23 of the 60 test images were opened, at least one for every
  screen that has one; the collapsed-meals image was not); 83 drawn from the source alone; 6 not drawn.
- Opened in headless Edge at 1240 px and looked at: every sheet, the catalog,
  the flows sheet and the index. The comparison found and corrected, among
  others: the download strip sits at the bottom of the screen, not under the
  app bar; a lift's history is titled with the lift's name; the explanation
  sheet states what changed as one sentence; a confirming button is the
  primary button, not a red one; the rest-target options are a dialog.
- `tool/src/ui_ux_coverage.dart` (`uiUxCoverageProblems`,
  `uiSurfaceSources`), called from `tool/src/requirements.dart`;
  `tool/test/ui_ux_coverage_test.dart`.
- Taps were exercised by a scripted page in headless Edge: segment, single
  and multiple chips, switch, check box, choice card, folded section,
  stepper, opening and closing a dialog, the theme and text-size switches,
  and Enter on a focused switch. All thirteen did what they should.
- **Not verified**: nothing was compared with the app running on the
  emulator or a phone; the comparison was with the screenshot tests, which
  are renders of the built app. Dark and Light were looked at on the Train
  sheet only; every other sheet was looked at in Martian. A 420 px wide
  window was looked at on the Train sheet only. Only Edge was used. The
  sheets were not read with a screen reader.
- **Known differences from the app**, also stated on the sheets: charts are
  schematic and not plotted from data; the hero's drawn backdrop is a plain
  gradient; icons are simplified line drawings, not the Material icons;
  Flutter's ink and focus rings are not reproduced; the camera view is a
  placeholder; the phone's own date and time pickers, the Health Connect
  permission screen and notifications are not drawn; numbers are fixture
  data and do not reconcile across cards.
- **Partly drawn**, each recorded under `limits` in the manifest: only some
  of the wordings of the insight, stall, relief-offer and recomp-review
  cards; the per-meal protein marker; the second form of the Dashboard's
  weight card; metric units in onboarding.
- **No defect in the app was found while drawing.** Had one been, it would
  have a BUG ticket and the drawing would show the defect.

## UI/UX Assets

- [Library index](../ui-ux-assets/index.html) — Current. Draws the library
  index as built on 2026-10-11: every sheet. Drawn from the source alone; not
  compared with the running app. It shows what exists and approves nothing.
- [Component catalog](../ui-ux-assets/components/index.html#tokens) — Current.
  Draws the component catalog as built on 2026-10-11. Drawn from the source
  alone; not compared with the running app. It shows what exists and approves
  nothing.
- [Flows](../ui-ux-assets/flows/index.html#navigation-map) — Current. Draws
  the flows sheet as built on 2026-10-11. Drawn from the source alone; not
  compared with the running app. It shows what exists and approves nothing.
