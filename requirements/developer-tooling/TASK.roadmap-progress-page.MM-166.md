---
id: MM-166
status: done
component: developer-tooling
related: [MM-6, MM-1]
---

# Task: A roadmap progress page that opens from disk

## Context
The roadmap (`roadmap/roadmap.json`) and the tickets (`requirements/`) say what is planned and built, but reading them to answer "how
complete are we?" means counting by hand. The product owner asked for one HTML file that opens in a browser straight from disk (the
`file://` protocol) and shows how complete the roadmap and the application are.

## Description
- `mm roadmap` writes `roadmap/progress.html`: one self-contained file, no network, no build step, nothing loaded from elsewhere.
  A browser blocks a page opened from disk from reading a neighbouring JSON file, so the data is written into the page itself;
  that is why the page is generated and has to be regenerated (`mm roadmap`) to show newer status.
- **Ticket status comes from the tickets in `requirements/`** (the authoritative source), not from the `built` and `remaining` lists
  in `roadmap.json`. The structure (milestones, workstreams, order, dependencies) comes from `roadmap.json`.
- The page shows: overall completeness; each milestone with its required tickets; each workstream in recommended order with its
  tickets and what it depends on; completeness per component (the application's feature areas); and a list of places where
  `roadmap.json` disagrees with the tickets.
- `mm roadmap --check` fails when the committed page is out of date with the tickets and roadmap.

## Honest limits
Completeness here is a count of tickets by the status written in them. It does not weigh effort, and "done" means the ticket says
done, not that the work has been tested on a device or reviewed by a professional.

## Acceptance
- Opening `roadmap/progress.html` by double-click shows the page with no console errors and no external requests.
- The numbers equal `mm req`'s totals.
- A test builds the page data from sample tickets and a sample roadmap and checks the ticket map, the status source and the
  escaping of a closing script tag.
