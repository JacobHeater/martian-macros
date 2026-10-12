---
id: MM-210
status: done
component: developer-tooling
related: [MM-6, MM-102, MM-184, MM-166, MM-174]
---

# Task: HTML UI/UX assets are kept and linked in the requirements folder

## Context
A design can be shown as an HTML page: a screen prototype, an interaction
demonstration, an exploration, a visual specification. One existed,
`design/palette-preview.html`, mentioned in prose by MM-102 and by the design
documents but linked from no ticket in a way a tool or a reader could follow.
Nothing said where such a file belongs, what it stands for, or who keeps it in
step with the ticket it illustrates.

## Decisions (made with the product owner)
- **HTML UI/UX assets live in the requirements folder.**
- **A ticket lists the assets that support it under the exact heading
  `## UI/UX Assets`.**
- **New assets are tracked as part of the work that creates them; existing
  ones are tracked now; a material change to an asset brings its entries up
  to date.**
- **This is a standing agreement for every agent, not a one-time cleanup.**
- **An asset that cannot be confidently given to a ticket is recorded as
  unresolved, not guessed at.**
- **Statuses are exploratory, proposed, accepted and superseded.** MM-211
  added `current`, for a drawing of what is built.

Choices I made without asking (say if any is wrong):
- **The folder is `requirements/ui-ux-assets/`.** It is the one folder under
  `requirements/` that is not a component and holds no tickets. Its README is
  the convention, the unresolved list, and the list of HTML kept elsewhere.
- **An entry is one list item**: `- [Title](link) — Status. What it shows.`
  The status is the first word after the dash, so a tool can read it.
- **Every HTML file git does not ignore is accounted for**: it is in the
  folder, or the folder's README says what it is and why it is elsewhere. That
  is how a new asset dropped somewhere else gets noticed.
- **`mm req` does the checking**, so `mm check` and CI do too.
- **An asset may not load anything from the network.** The app is offline;
  its design sheets should open offline too.
- **The roadmap progress page and its template are not UI/UX assets.** They
  are a generated contributor report (MM-166), not a product screen.

## Description
- `requirements/ui-ux-assets/README.md` states the convention.
- `AGENTS.md` and `requirements/README.md` make it a working agreement; the
  panel roles each say their part (product designer: the assets and their
  design status; UX: the flows and states shown; product: which tickets they
  belong to; the implementation owner: assets and links updated with the
  work; QA: links, dependencies and the asset's behavior; the chair: that it
  is covered in review and at completion).
- `mm req` reports, naming the file:
  - a heading that means "UI/UX Assets" but is not exactly that;
  - a section with no entry, or an entry without a link, a known status or a
    description;
  - a link that is not relative, leads outside the folder, or leads to a
    missing file;
  - an HTML file in the folder that no ticket links and that is not listed as
    unresolved, or one that is both;
  - an unresolved entry that says nothing about what must be decided;
  - an asset that refers to a missing local file, or loads from the network;
  - two identical files in the folder;
  - an HTML file elsewhere in the repository that the README does not account
    for, and a README entry for a file that is gone.

## Acceptance Criteria
```gherkin
Scenario: A new asset
  Given an HTML UI/UX asset added to "requirements/ui-ux-assets/"
  And no ticket lists it and it is not recorded as unresolved
  When "mm req" is run
  Then it names the file and says to link it or record it, and exits non-zero

Scenario: A new asset put somewhere else
  Given an HTML file added outside "requirements/ui-ux-assets/"
  And the folder's README does not account for it
  When "mm req" is run
  Then it names the file and says where assets live, and exits non-zero

Scenario: An existing asset
  Given the palette preview that was at "design/palette-preview.html"
  Then it is at "requirements/ui-ux-assets/palette-preview.html" with its history
  And MM-102 and MM-184 list it under "## UI/UX Assets"
  And nothing in the repository still points at the old path

Scenario: An updated asset
  Given an asset whose entry gives a status that is not one of the four
  When "mm req" is run
  Then it names the ticket, the asset and the status, and exits non-zero

Scenario: An entry that says nothing
  Given an entry with a link and a status and no description
  When "mm req" is run
  Then it names the ticket and the asset

Scenario: A shared asset
  Given one asset linked from two tickets
  When "mm req" is run
  Then it reports nothing about that asset

Scenario: A copied asset
  Given two files in the folder with the same contents
  When "mm req" is run
  Then it names both and says to keep one

Scenario: A broken link
  Given an entry whose link leads to a file that does not exist
  When "mm req" is run
  Then it names the ticket and the missing file, and exits non-zero

Scenario: A missing dependency
  Given an asset that refers to a local stylesheet that does not exist
  When "mm req" is run
  Then it names the asset and the missing file

Scenario: An uncertain association
  Given an asset listed under "Unresolved assets" with what must be decided
  And no ticket links it
  When "mm req" is run
  Then it reports nothing about that asset

Scenario: The wrong heading
  Given a ticket with the heading "## UI/UX assets"
  When "mm req" is run
  Then it says the heading must be exactly "## UI/UX Assets"
```

## Notes (built and verified)
- `tool/src/ui_ux_assets.dart` (`uiUxAssetProblems`), called from
  `tool/src/requirements.dart`. The list of HTML files comes from
  `git ls-files`, so ignored build output is never looked at. Without git the
  check of HTML outside the folder is skipped and `mm req` says so.
- `tool/test/ui_ux_assets_test.dart` covers each scenario above against a
  temporary folder, and runs the check over this repository.
- Moved with `git mv`: `design/palette-preview.html` to
  `requirements/ui-ux-assets/palette-preview.html`. It has no local
  dependencies and loads nothing. The links in `design/README.md`,
  `design/color-and-theme-system.md`, `roadmap/ws-03-…` and MM-102 follow it.
- Inventory of HTML in the repository when this was built: the palette
  preview (an asset); `roadmap/progress.html` and
  `tool/assets/roadmap_report.template.html` (not assets, listed in the
  README); two Gradle problem reports under `build/` (ignored build output).
- **Not checked by any tool**: whether an asset belongs with the ticket that
  links it, how it looks, and whether its status is true.
- **Left open**: the palette preview also draws a mock of the Today screen.
  It is linked from the two color tickets it was made for and from no
  dashboard ticket, because nothing records it as the reference for that
  screen. Its entries say so.
