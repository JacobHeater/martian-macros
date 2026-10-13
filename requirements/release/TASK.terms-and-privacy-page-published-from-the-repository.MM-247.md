---
id: MM-247
component: release
status: proposed
related: [MM-94, MM-95, MM-242]
---

# Task: the terms and the privacy policy, published from the repository

## The decision

The owner's call (2026-10-13): the stores get the same terms the app shows,
from one source, at a public address on GitHub Pages from this repository;
the privacy policy (MM-95) is published beside it. No separate store page.

## What to build

- A small static page built from `apps/mobile/src/terms/termsOfUse.ts` and
  the privacy policy's source (MM-95), so the public text can never differ
  from the app's. The build is a script under `tool/` or `apps/mobile/scripts/`
  that renders the sections to HTML with no script, no font loading from a
  network, no analytics.
- A GitHub Actions workflow that publishes the page to GitHub Pages on a
  push to `main`. **A new workflow needs the owner's approval before it is
  pushed** (the standing rule); the pull request that adds it is for the
  owner to merge, not the agent.
- The address goes into the stores' listing fields and into the app's
  Settings, About rows (a link beside "Terms of use" and "Privacy policy"),
  opened in the phone's browser, since the app itself fetches nothing.

## Acceptance criteria

```gherkin
Scenario: One source
  Given the terms file changes
  When main is built
  Then the public page shows the new text, version and effective date

Scenario: Nothing fetched
  Then the published page loads no script, font or image from a network address

Scenario: The owner merges the workflow
  Given the pull request that adds the workflow
  Then it is merged by the owner, not by an agent

Scenario: The address is the stores' and the app's
  Then both store listings and the app's About rows carry the same address
```

## Notes

- Until a domain is chosen the address is the repository's github.io one.
- The licensor name, contact address, governing law and disputes stay as
  the attorney leaves them (MM-242); the page renders whatever the file
  says.
