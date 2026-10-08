---
id: MM-50
status: proposed
component: food-database
related: [MM-51, MM-52, MM-53, MM-54, MM-55, MM-56, MM-57, MM-58, MM-37, MM-42, MM-43]
---

# Epic: The food database

## Context
The established apps have a decade of accumulated food data. Licensed nutrition APIs charge per query, which an app with a one-time price
cannot carry, and need a network, which an offline app cannot assume. Crowdsourced databases are large and full of errors.

## Decisions (made with the product owner)
- **Open data only**: Open Food Facts, USDA FoodData Central, and any other openly licensed source.
- **Open Food Facts is the primary source for packaged foods and barcodes** (the product owner has used it before and was happy with it);
  USDA supplies generic foods and fills gaps in branded ones.
- **United States only at launch.**
- **Built with DuckDB over Parquet** in an offline pipeline; the app has no backend.

## Narrative
A pipeline that runs on a developer's machine (MM-52) reads the sources, throws out entries that fail basic nutrition checks (MM-53),
puts every barcode in one form (MM-54), and writes compact SQLite "food packs" the app reads (MM-55): a small pack of generic foods shipped
inside the app, and a larger United States barcode pack downloaded once from static hosting (MM-56). Because part of the data is under the
Open Database License, the packs are published openly with attribution (MM-57).

When a barcode is missing from the pack, the app may ask Open Food Facts directly if the user allows it (MM-58), and otherwise reads the
label (MM-44).

Before building, a spike measures what the sources actually contain for the United States and how large the packs come out (MM-51).

## Acceptance Criteria (narrative)
The Epic is done when the common generic foods and the large majority of packaged foods in a US supermarket can be found by search or
barcode with no network, every entry in a pack has passed the nutrition checks, the packs can be rebuilt from the sources with one command,
and the licensing obligations are met.
