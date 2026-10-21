---
id: MM-454
status: proposed
component: release
related: [MM-247, MM-95, MM-242]
---

# Task: Settings, About links to the public page of the terms and the policy

## Context
MM-247 asks for the public page's address in the app's About rows, beside "Terms of use" and "Privacy policy" (MM-95), opened in the
phone's browser since the app itself fetches nothing. The page and its workflow are built (MM-247); the address exists only once the
owner merges the workflow and turns Pages on. The app has no way yet to hand an address to the phone's browser: nothing in either shell
opens a link, and adding one is a new platform capability behind an interface (rule 2).

## Description
- A narrow `ExternalLink` port (open an address in the phone's browser) with the Android and iOS implementations and a fake.
- One row under "Privacy policy" in Settings, About: "On the web", with the address as its subtitle, that opens the public page.
- The address is one constant, the same one entered in both store listings.

## Acceptance Criteria
```gherkin
Scenario: The same address as the stores
  Then the About row's address is the one both store listings carry

Scenario: Opened in the browser
  When the person presses the row
  Then the phone's browser opens the public page, and the app itself fetches nothing

Scenario: Substitutable
  Then the link port has a fake for tests and stories, and the row is in a gallery story
```

## Notes
Waits on the owner: the merge of MM-247's workflow, Pages turned on, and the address confirmed.
