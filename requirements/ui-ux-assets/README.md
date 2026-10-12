# UI/UX assets

This folder is the HTML reference for how the app looks and behaves: a
drawing of every view and reusable component as built, with its states
(MM-211), and any design sheet that proposes something new (MM-210). It is
not a component folder and holds no tickets.

Open [index.html](index.html) in a browser. Nothing is fetched and nothing
needs building. If the browser will not load local fonts or scripts from a
file, run `python -m http.server` in the repository root and open
`/requirements/ui-ux-assets/`.

Every agent keeps it, as part of the work, not as a later cleanup.

## What is here

| Path | Holds |
| --- | --- |
| `index.html` | The way in: every sheet, and how to read them |
| `views/` | One sheet per destination or group of screens, a frame per state |
| `components/index.html` | The component catalog: every design-system component and chart, each with a stable address `#<id>` |
| `flows/index.html` | The navigation map and the main paths through the app, each step linked to its frame |
| `shared/mm.css`, `shared/mm.js` | The app's tokens and components as CSS, and the script that draws frames and answers taps |
| `coverage.json` | Every widget file in `apps/mobile/lib/src`, the frame that draws it, the states drawn, its tickets, how it was checked, and what limits it |
| `palette-preview.html` | An earlier design sheet (see MM-102, MM-184) |

A frame is addressed as `views/<sheet>.html#<frame-id>`; the id is printed
under each frame.

## The rules

- **One copy, here.** An HTML UI/UX asset lives in this folder and nowhere
  else. Sheets share `shared/mm.css` and `shared/mm.js` and do not copy
  them. Nothing is loaded from the network. The one thing read from outside
  the folder is the app's two fonts, from `apps/mobile/assets/fonts/`, so
  that there is one copy of those too.
- **Linked from the tickets it supports**, under the exact heading
  `## UI/UX Assets`. Several tickets may link the same sheet; none copies it.
- **A new view or component gets its drawing in the same pull request.**
  Draw it with its states, add its entry to `coverage.json`, link the sheet
  from `index.html` if it is a new sheet, and add the entry to its tickets.
  `mm req` fails until the widget file is in the manifest.
- **A material change to a screen changes its drawing in the same pull
  request**, and the manifest entry and ticket entries with it.
- **A removed screen leaves no drawing behind.** Take out its frames and its
  manifest entry, or mark a sheet `Superseded` and say what replaced it, if
  it is still worth reading.
- **Current and proposed stay apart.** A `Current` sheet draws what is built
  and nothing else. A redesign is a separate sheet marked `Exploratory` or
  `Proposed`. A drawing never makes a broken screen look finished: draw what
  is there and write the bug ticket.
- **Not sure which ticket?** Do not guess. Put the sheet under "Unresolved
  assets" below, or the surface under `unresolved` in `coverage.json`, with
  what has to be decided.
- **The ticket is the requirement.** A sheet adds no requirement and
  overrules none. A link is not approval, and it is not evidence that the
  app matches. Where a sheet and its ticket disagree, say so and settle it
  in the ticket.

## An entry in a ticket

```markdown
## UI/UX Assets

- [Title](../ui-ux-assets/views/sheet.html#frame-id) — Status. What it
  shows, and for which screen, flow or interaction. What limits it: how it
  was checked, who has or has not approved it, and where it differs from
  what is built.
```

The status is one word, straight after the dash:

| Status | Means |
| --- | --- |
| `Current` | A drawing of what is built. It claims nothing about whether that is what was wanted |
| `Exploratory` | An idea being tried. Nobody has been asked to accept it |
| `Proposed` | Offered as the direction; the owner has not accepted it |
| `Accepted` | The owner accepted it, and the entry says where that is recorded |
| `Superseded` | No longer the direction. The entry links what replaced it, if anything did |

Never write `Accepted` without something written down to point to.

## An entry in `coverage.json`

```json
{
  "source": "apps/web/src/ui/MmButton.tsx",
  "symbol": "MmButton",
  "kind": "component",
  "requirements": ["MM-104"],
  "asset": "components/index.html#mm-button",
  "states": ["primary", "off", "secondary"],
  "verification": "screenshot-compared",
  "status": "covered",
  "limits": "Optional when covered: what the drawing leaves out."
}
```

- `kind`: `view`, `part` (a card or section of a view), `component`,
  `sheet`, `dialog`, `navigation`, `painter`, `host` (draws nothing itself).
- `verification`: `screenshot-compared` (compared by eye with a screenshot
  test of the built screen), `source-only` (drawn from the code alone),
  `not-drawn`.
- `status`: `covered`, `incomplete`, `not-drawn`. Anything but `covered`
  must say why under `limits`.
- A component's hooks and helpers belong to its entry and have none of their own.

## What `mm req` checks, and what it cannot

For tickets: that every entry has a link, a known status and a description;
that the link is relative, leads to a file in this folder, and names a frame
that exists. For this folder: that every HTML file is linked from a ticket
or listed as unresolved, refers to nothing missing, links no frame that does
not exist, and loads nothing from the network; that no two files are the
same; and that every other HTML file in the repository is accounted for
below. For the manifest: that every widget file is listed once, that each
entry's file, symbol, frame and tickets exist and its fields are filled, and
that `index.html` links every sheet the manifest uses.

It cannot tell whether a drawing looks like the screen, whether every state
that matters is drawn, whether a sheet belongs with the ticket that links
it, or whether anything was approved. Those take a person or a reviewer
looking, in a browser, beside the app.

## Unresolved assets

Assets here that no ticket could be confidently given. Each says what it
seems to show and what has to be decided.

None.

## HTML that is not a UI/UX asset

Every other HTML file in the repository, and why it stays where it is.
Generated and ignored files (build output, coverage) need no entry.

- `roadmap/progress.html`: the roadmap progress page that `mm roadmap`
  writes (MM-166). A generated report for contributors, not a product screen.
- `tool/assets/roadmap_report.template.html`: the template `mm roadmap`
  fills to write that page. Tooling, not a product screen.
- `apps/web/index.html`: the page the React app starts from (MM-228). It is
  the app itself, not a drawing of it.
