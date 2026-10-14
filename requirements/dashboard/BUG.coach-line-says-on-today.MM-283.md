---
id: MM-283
component: dashboard
status: done
related: [MM-253, MM-254, MM-98]
---

# Bug: the coach line says "on Today" and "on Yesterday"

## What the panel found

The Dashboard's status row read "Targets went down 100 kcal on Today."
(product-designer PD-6, UX-accessibility UX-3, 2026-10-13, from the
render): `coachLineText` joined "on" to `Fmt.day`, which gives "Today" and
"Yesterday" for the nearest days.

## The fix

A near day is said as a word: "today", "yesterday"; any other day keeps
"on Sat, Oct 10".

## Regression test

`test/format/dartMessages.test.ts`, "says a change in the last week":
a change effective yesterday reads "went up 50 kcal yesterday." and one
effective today "went up 50 kcal today."; both failed before the fix.

## Acceptance criteria

```gherkin
Scenario: A change today
  Given targets changed today
  Then the line ends "kcal today." and never contains "on Today"

Scenario: A change on another day
  Given targets changed five days ago
  Then the line says "on" and the day's short name
```

## Progress

Fixed 2026-10-13 with the hierarchy rebuild (MM-254).
