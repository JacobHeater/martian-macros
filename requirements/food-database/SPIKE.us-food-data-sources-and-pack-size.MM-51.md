---
id: MM-51
status: proposed
component: food-database
related: [MM-50, MM-52, MM-55, MM-56, MM-57]
---

# Spike: What the sources contain for the United States, and how big the packs are

## Context
The plan rests on guesses: that the United States slice of Open Food Facts plus USDA Branded Foods is about a million products, and that
it compresses to 30 to 60 MB. Neither has been measured. Pack size decides whether the barcode pack can ship inside the app or must be a
download, and what the first-run experience is.

## Description
Using DuckDB on the real files (the Open Food Facts Parquet export on Hugging Face, about 4.9 million products worldwide; USDA FoodData
Central's Foundation, SR Legacy, FNDDS and Branded downloads), answer:

1. How many Open Food Facts products are sold in the United States, and how many of those have calories, protein, carbohydrate and fat?
2. How many USDA Branded products are there, how many carry a barcode, and how many overlap with Open Food Facts?
3. Where both have a barcode, how often do their macros disagree by more than 10%? Which is right more often, on a hand-checked sample of
   fifty?
4. What share of each source fails the nutrition checks in MM-53?
5. How large is a pack holding name, brand, barcode, serving, and the nutrients in MM-49, as SQLite with a search index, before and after
   compression?
6. How many generic foods are worth shipping in the app, and how large is that pack?
7. Coverage test: of fifty barcodes from a real US pantry, how many are found?

## Acceptance Criteria
```gherkin
Scenario: Numbers, not guesses
  Then this ticket records an answer to each question above, with the query that produced it

Scenario: A decision on the barcode pack
  Then it states whether the US barcode pack ships in the app or is downloaded, and why

Scenario: A decision on conflicts
  Then it states which source wins when both have a barcode and they disagree
```

## Notes
- The Hugging Face dataset page lists the license as both AGPL-3.0 and ODbL. Establish which applies to the data (MM-57) as part of this.
- Planning suggested preferring USDA Branded on conflict (it is label data submitted by manufacturers); the product owner prefers Open Food
  Facts as primary. Question 3 is how to settle it with evidence.
