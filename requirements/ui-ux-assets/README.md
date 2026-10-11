# UI/UX assets

This folder holds the HTML that shows what a screen or a flow is meant to
look like or do: screen prototypes, interaction demonstrations, design
explorations and visual specifications (MM-210). It is not a component
folder and holds no tickets.

Every agent keeps it, as part of the work, not as a later cleanup.

## The rules

- **One copy, here.** An HTML UI/UX asset lives in this folder and nowhere
  else. What it needs to render (CSS, scripts, images, fonts) lives here
  beside it, referred to by relative path. It loads nothing from the
  network.
- **Linked from the tickets it supports**, under the exact heading
  `## UI/UX Assets`. Several tickets may link the same file; none copies it.
- **In the same change.** Whoever adds an asset adds its links in that pull
  request. Whoever changes one materially brings its entries up to date:
  what it shows, its status, and where it differs from what is built.
- **Not sure which ticket?** Do not guess. List it under "Unresolved assets"
  below, with what it seems to show and what has to be decided.
- **The ticket is the requirement.** An asset adds no requirement and
  overrules none. A link is not approval, and it is not evidence that the
  app looks like the asset. Where an asset and its ticket disagree, say so
  and settle it in the ticket.

## An entry in a ticket

```markdown
## UI/UX Assets

- [Title](../ui-ux-assets/file.html) — Status. What it shows, and for which
  screen, flow or interaction. What limits it: who has or has not approved
  it, and where it differs from what is built.
```

The status is one word, straight after the dash:

| Status | Means |
| --- | --- |
| `Exploratory` | An idea being tried. Nobody has been asked to accept it |
| `Proposed` | Offered as the direction; the owner has not accepted it |
| `Accepted` | The owner accepted it, and the entry says where that is recorded |
| `Superseded` | No longer the direction. The entry links what replaced it, if anything did |

Never write `Accepted` without something written down to point to. A
superseded asset is kept only while it is still useful to read.

## What `mm req` checks, and what it cannot

It checks that every entry has a link, a known status and a description;
that the link is relative and leads to a file in this folder; that every
HTML file here is linked from a ticket or listed as unresolved; that what
an asset refers to exists and that it loads nothing from the network; that
no two files here are the same; and that every other HTML file in the
repository is accounted for below.

It cannot tell whether an asset belongs with the ticket that links it,
whether it looks right, whether its status is true, or whether the app
matches it. Those take a person or a reviewer looking.

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
