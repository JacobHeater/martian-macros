---
id: MM-411
status: proposed
component: food-logging
related: [MM-410, MM-42, MM-334]
---

# Story: A failed page of search results says so

## Context
The panel's UX guard, reviewing MM-410 (F3): when a page of search results
fails to read, `useAsync` drops the error and the rows already shown stay with
"More results" still offered, so nothing happens under the finger. A failed
first page already renders nothing (pre-existing). The direction says a failed
read is never shown as zero or as an empty success (`design/screen-direction.md`,
"Loading"), and `ReadFailedNotice` exists for it.

## Description
When a pack read fails during a search, the rows already shown stay and a
`ReadFailedNotice` beneath them says the read failed and offers "Try again",
announced as an alert (MM-334). The first page failing says the same in place
of the list.

## Acceptance Criteria
```gherkin
Scenario: The next page fails
  Given twenty results are shown
  When "More results" is pressed and the read fails
  Then the twenty stay, a notice says the read failed, and "Try again" asks again

Scenario: The first page fails
  When a search's first read fails
  Then a notice says so in place of the list, and "Try again" asks again
```

## Notes
`useAsync` would need to give the failure back (today it swallows it), or the
search would take its own read state. A rare path on local SQLite, which is
why it is proposed rather than built with MM-410.
