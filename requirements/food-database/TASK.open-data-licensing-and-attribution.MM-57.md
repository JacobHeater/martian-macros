---
id: MM-57
status: proposed
component: food-database
related: [MM-50, MM-51, MM-52, MM-56, MM-95]
---

# Task: Meet the open-data licenses

## Context
USDA FoodData Central is public domain (CC0). Open Food Facts' database is under the Open Database License (ODbL), which is share-alike: a
database derived from it must be offered under the same license, with attribution. Its product images are under a different license
(CC BY-SA). Getting this wrong puts the app's main data source at risk.

## Decisions (made with the product owner)
- **The merged packs are published openly under ODbL, with attribution.** That is acceptable: the packs are not the product's secret.
- **Product images are not shipped.**

## Description
- A written reading of the obligations, checked by someone qualified: what counts as a derived database, whether the app itself is a
  "produced work", what attribution must say and where it must appear, and whether the Hugging Face listing's AGPL-3.0 tag applies to the
  data or only to tooling.
- The packs carry their license and attribution in the header (MM-55) and are published with the pipeline's source.
- The app shows attribution ("Food data from Open Food Facts, available under the Open Database License, and USDA FoodData Central") in
  Settings and wherever the license requires.
- Foods a user creates on their own device are theirs and are not part of any published database.

## Acceptance Criteria
```gherkin
Scenario: Attribution in the app
  Then Settings has a data sources screen naming each source and its license, with links

Scenario: The packs are available
  Then each published pack is downloadable by anyone, states its license, and names the sources and versions it was built from

Scenario: Reviewed
  Then this ticket records who reviewed the licensing reading and when
```

## Notes
- I am not a lawyer and neither is the pipeline. This ticket is not done until a qualified person has read the conclusion.

## Progress (facts gathered by the MM-51 spike; nothing built; status stays proposed)
Open Food Facts' terms of use (fetched 2026-10-09) state ODbL for the database, the Database Contents License for contents and CC BY-SA for images, require crediting Open Food Facts with a link, and require derivative works to be shared under the same conditions. The Hugging Face listing tags the dataset both agpl-3.0 and odbl and I could not establish which governs the data. USDA's public-domain status is not confirmed here. The spike found the barcode pack would be about 88% USDA data and 12% Open Food Facts data by barcode count, which matters to what must be published. None of this has been read by a qualified person.

## Progress (data repository published; status stays proposed)
- On the product owner's instruction the packs are **published publicly** in [martian-macros-food-data](https://github.com/JacobHeater/martian-macros-food-data) (release 2026-10-09) **before any review**. The repository has the official ODbL 1.0 text as its LICENSE, a README stating that the licensing is provisional and unreviewed, an ATTRIBUTION file crediting Open Food Facts and USDA FoodData Central, no product images, and release notes naming the source versions and the pipeline commit. Each pack's header carries a provisional license and attribution text.
- The app's Food database screen credits both sources and links the repository. A data-sources screen with links to each license, as the acceptance criteria ask, is not built.
- **Open and for a qualified reader**: whether publishing the merged packs under ODbL meets Open Food Facts' terms (attribution form, share-alike scope for a merged database, the Database Contents License for individual records); which license governs the Hugging Face copy (the page tags both agpl-3.0 and odbl; the files used here came from Open Food Facts' own export); USDA's public-domain statement, which I could not read this session; and whether the app counts as a produced work. The ticket stays proposed until someone qualified has read it.
