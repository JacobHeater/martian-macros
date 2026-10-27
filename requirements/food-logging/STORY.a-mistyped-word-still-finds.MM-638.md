---
id: MM-638
status: done
component: food-logging
related: [MM-42, MM-408, MM-627]
---

# Story: a word mistyped after its first letters still finds what it meant

## Context
The owner, 2026-10-26: search is well behind MyFitnessPal and MyNetDiary. The food-logging review
(`docs/food-logging-plan.md`, F-08, W-D) found that every word typed must begin a word of the food's name,
so "chickn" or "breats" found nothing. MM-627 offers the closest foods when some words match; a single
mistyped word still ended at "Nothing found".

## Decisions
Choices made without asking (say if any is wrong):
- **When every word finds nothing, each word is tried by its first four letters** ("chickn" as "chic…"),
  and what that finds is listed under MM-627's "No exact match for … Closest:". Most typing slips come after
  the first letters; a mistake within them is not guessed at.
- It runs before MM-627's some-of-the-words fallback, so "chickn breats" finds chicken breast rather than any
  chicken at all.
- **Only the list the person reads** asks for it (MM-627): a lookup that takes the first hit never gets a
  mistyped match.
- A word of four letters or fewer is not shortened, so "zzqx" still finds nothing.

## Acceptance Criteria
```gherkin
Scenario: One mistyped word
  When the person searches "chickn"
  Then chicken foods are listed as the closest

Scenario: Two
  When the person searches "chickn breats"
  Then chicken breast foods are listed as the closest

Scenario: A lookup
  When an analysed meal's food is looked up as "chickn"
  Then nothing is taken
```

## Notes
- Built in `SqliteFoodPack.search`. Tests: `test/foodCatalog/typoSearch.test.ts`.
