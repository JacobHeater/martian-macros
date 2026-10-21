---
id: MM-247
component: release
status: in-progress
related: [MM-94, MM-95, MM-242, MM-454]
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

Scenario: Both phones on one page
  Given a paragraph the terms or the policy say differently on Android and on an iPhone
  Then the page gives each, labelled "On Android" and "On iPhone", and every sentence the app shows on either phone is on the page

Scenario: Only the page is published
  Then the Pages artifact is one folder holding index.html and nothing else from the repository

Scenario: A draft says so
  Given the attorney's review is not recorded
  Then the page says above everything that the terms and the policy are a draft not in effect
```

## Notes

- Until a domain is chosen the address is the repository's github.io one.
- The licensor name, contact address, governing law and disputes stay as
  the attorney leaves them (MM-242); the page renders whatever the file
  says.

## Progress
**Page and workflow built (2026-10-21), the workflow awaiting the owner's merge.** `apps/mobile/src/terms/legalPageHtml.ts` renders
the terms and the privacy policy (MM-95), both phones on one page, with a Content-Security-Policy of `default-src 'none'`, inline
styles only, light and dark. `apps/mobile/scripts/legal-page.mjs` (`mm legal [out-dir]`, `npm run legal`) loads it through Vite's
runner and writes `index.html` alone into the folder. `.github/workflows/legal-pages.yml` builds that folder on a push to `main` that
touches the text (or by hand) and deploys only it with `actions/upload-pages-artifact` and `actions/deploy-pages`. Test:
`apps/mobile/test/terms/legalPage.test.ts`. Not run locally; CI validates the renderer, and the workflow runs only once merged.

**Waiting on the owner:** merging the workflow's pull request; turning on Pages with source "GitHub Actions" in the repository
settings (a private repository needs a plan that allows Pages); the address, expected to be
`https://jacobheater.github.io/martian-macros/`, entered in both store listings. The link to it from the app's About rows is MM-454.
