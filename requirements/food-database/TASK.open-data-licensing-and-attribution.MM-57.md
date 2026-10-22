---
id: MM-57
status: done
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
- **Addresses are shown as text, not links (builder, 2026-10-20; kept 2026-10-21).** The app has no component that opens a
  browser and the owner's rule keeps native surfaces out, so "with links" in the first scenario is met by each source's
  address beside its licence. Revisit if the qualified reader says a live link is required.
- **Built like its sibling (MM-318).** The data-sources screen reuses the Food database screen's parts: `GroupHeader`,
  `MmListGroup` of `MmListRow`s (one per source: name, licence, address), muted paragraphs under each group; it is opened
  from a `MmListRow` that `opens`, from Settings, Data and from the Food database screen.

## Description
- A written reading of the obligations, checked by someone qualified: what counts as a derived database, whether the app itself is a
  "produced work", what attribution must say and where it must appear, and whether the Hugging Face listing's AGPL-3.0 tag applies to the
  data or only to tooling.
- The packs carry their license and attribution in the header (MM-55) and are published with the pipeline's source.
- The app shows attribution ("Food data from Open Food Facts, available under the Open Database License, and USDA FoodData Central") in
  Settings and wherever the license requires.
- Foods a user creates on their own device are theirs and are not part of any published database.

## UI/UX
- FoodSources, FoodSourcesNoneOnline, SettingsOpensFoodSources, FoodDatabaseOpensSources —
  apps/mobile/src/gallery/screens/Settings.stories.tsx. The screen with the online sources and without, and the two ways in.

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
- I am not a lawyer and neither is the pipeline. On the owner's direction (2026-10-21) the ticket is done with the
  qualified reading recorded as owed by the owner (below), as phone checks are; the screen keeps saying the reading has not
  been reviewed by a lawyer until it has.

## Progress (history: facts gathered by the MM-51 spike; nothing built then, status was proposed)
Open Food Facts' terms of use (fetched 2026-10-09) state ODbL for the database, the Database Contents License for contents and CC BY-SA for images, require crediting Open Food Facts with a link, and require derivative works to be shared under the same conditions. The Hugging Face listing tags the dataset both agpl-3.0 and odbl and I could not establish which governs the data. USDA's public-domain status is not confirmed here. The spike found the barcode pack would be about 88% USDA data and 12% Open Food Facts data by barcode count, which matters to what must be published. None of this has been read by a qualified person.

## Progress (history: data repository published; status was proposed)
- On the product owner's instruction the packs are **published publicly** in [martian-macros-food-data](https://github.com/JacobHeater/martian-macros-food-data) (release 2026-10-09) **before any review**. The repository has the official ODbL 1.0 text as its LICENSE, a README stating that the licensing is provisional and unreviewed, an ATTRIBUTION file crediting Open Food Facts and USDA FoodData Central, no product images, and release notes naming the source versions and the pipeline commit. Each pack's header carries a provisional license and attribution text.
- The app's Food database screen credits both sources and links the repository. A data-sources screen with links to each license, as the acceptance criteria ask, is not built.
- **Open and for a qualified reader**: whether publishing the merged packs under ODbL meets Open Food Facts' terms (attribution form, share-alike scope for a merged database, the Database Contents License for individual records); which license governs the Hugging Face copy (the page tags both agpl-3.0 and odbl; the files used here came from Open Food Facts' own export); USDA's public-domain statement, which I could not read this session; and whether the app counts as a produced work. The ticket stays proposed until someone qualified has read it.

## Progress (history: 2026-10-20, feat/m2; status was in-progress, a qualified reader still owed)
- **USDA's status is now read from USDA's own words** (its API guide, fetched 2026-10-20): "USDA FoodData Central data are
  in the public domain and they are not copyrighted. No permission is needed for their use, but we request that users list
  FoodData Central as the source of the data", with the citation "U.S. Department of Agriculture, Agricultural Research
  Service. FoodData Central, 2019. fdc.nal.usda.gov." That closes the spike's open point on USDA; the app names FoodData
  Central as the source wherever it names Open Food Facts.
- **A data-sources screen is built** (Settings, Data, "Food data sources", `FoodSourcesScreen`): each source with its
  licence and address (USDA FoodData Central, public domain; Open Food Facts, Open Database License 1.0 and the Database
  Contents License, images not used), the packs on the phone, the published files' repository, the online lookup's sources
  and what is sent to them (MM-58), and the attribution text. Addresses are shown as text: the app has no component that opens
  a browser, and the owner's rule keeps native surfaces out (a decision to revisit if a reviewer asks for live links).
- **The online sources** (MM-58) fall under the same licences: a product fetched from Open Food Facts is ODbL/DbCL data, a
  food from FoodData Central public domain; the screen says so. Open Food Facts' API etiquette (a named User-Agent, its rate
  limits) is followed in code (`OnlineSourceRule`).
- **Still open, and for a qualified reader**: whether publishing the merged packs under ODbL meets Open Food Facts' terms
  (attribution form, share-alike scope, the Database Contents License for records); which licence governs the Hugging Face
  copy (unused here); whether the app is a produced work. The screen says the reading has not been reviewed by a lawyer.
  The ticket cannot be done by an agent: its last acceptance scenario needs a person qualified to read it.

## Progress (2026-10-21; done, the qualified reading owed by the owner)
- **Each source's terms on its own row** (`FoodSourcesScreen`): USDA FoodData Central "Public domain, with a citation
  requested · fdc.nal.usda.gov"; Open Food Facts "Database: Open Database License 1.0 · contents: Database Contents License
  1.0 · openfoodfacts.org". The attribution paragraph now carries USDA's requested citation in its words ("U.S. Department of
  Agriculture, Agricultural Research Service. FoodData Central, 2019. fdc.nal.usda.gov.").
- **Reachable from the Food database screen** ("Where the foods come from", "Food data sources") as well as Settings, Data.
- **The packs** (second scenario): published in `JacobHeater/martian-macros-food-data` for anyone to download; each pack's
  header carries `license` and `attribution` (`foodPipeline/packTerms.ts`) and the `sources` with the version each was
  built from (`writePacks`), and the release notes name them.
- Tests: `test/settings/foodSources.test.tsx` (each source, its licence and address; the requested citation; no link that
  opens a browser), `test/settings/foodDatabase.test.tsx` (the row from the Food database screen). Not run locally; CI
  validates.

## Progress (2026-10-21, panel review of PR #287)
- **USDA's citation, one form everywhere.** USDA gives two forms, both read on 2026-10-21: the API guide
  (fdc.nal.usda.gov/api-guide/) "U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, 2019.
  fdc.nal.usda.gov."; the FoodData Central home page (fdc.nal.usda.gov, CC0 1.0) "U.S. Department of Agriculture,
  Agricultural Research Service, Beltsville Human Nutrition Research Center. FoodData Central. [Internet]. [cited (enter
  date)]. Available from https://fdc.nal.usda.gov/.". The app and the packs use the home page's current form with the access
  date 2026-10-21 (`usdaFdcCitation` in `foodPipeline/packTerms.ts`, shown on the screen and inside `packAttribution`). The
  home page also asks, "when possible", to be told of products that use the data; the screen says so.
- **FNDDS cited as ARS asks** (ARS's FNDDS download page, read 2026-10-21): "U.S. Department of Agriculture, Agricultural
  Research Service. 2024. USDA Food and Nutrient Database for Dietary Studies 2021-2023. Food Surveys Research Group Home
  Page, http://www.ars.usda.gov/nea/bhnrc/fsrg" (`fnddsCitation`), on the screen and in `packAttribution`.
- **Licence addresses as text**: the Open Food Facts row and the Attribution paragraph give
  opendatacommons.org/licenses/odbl/1-0/ and opendatacommons.org/licenses/dbcl/1-0/; `packAttribution` gives the ODbL
  address. Open Food Facts' terms (world.openfoodfacts.org/terms-of-use) read 2026-10-21.
- **"Not been reviewed by a lawyer" stays** on the screen: the coordinator's decision (2026-10-21), until the reading below
  is recorded.
- **The pack header** is tested: a written pack's `license`, `attribution` and `sources` equal `packLicense`,
  `packAttribution` and the build provenance's sources (`test/foodPipeline/packBuilder.test.ts`). Not run locally; CI
  validates.

## Owed by the owner
A written reading by a person qualified in data licensing (a lawyer, or someone the owner trusts with open-data licences),
arranged by the owner. When it is done, record here who read it and on what date (the third scenario), and remove "has not
been reviewed by a lawyer" from the screen. The reader confirms, or corrects:
1. **Derived database.** That the merged barcode pack (the 2026-10-19 build, release tag `2026-10-19` in
   `martian-macros-food-data`: 399,950 USDA Branded and 121,038 Open Food Facts records, about 77% and 23% by barcode,
   chosen per barcode by `ReliabilityPolicy`; `docs/food-packs-data.md`) is a derivative database of Open Food Facts under ODbL 1.0, and that
   publishing the whole pack under ODbL 1.0 in `martian-macros-food-data`, with the pipeline's source, meets the share-alike
   term; or which part must be offered and how.
2. **Produced work.** Whether the app, which shows foods from the packs and from Open Food Facts' live API, is a "Produced
   Work" under ODbL section 4.3, and so needs only the notice it shows, not to be published under ODbL itself.
3. **Attribution.** That the attribution text (`packAttribution` in `apps/mobile/src/foodPipeline/packTerms.ts`, and the
   Attribution paragraph of the Food data sources screen) and where it appears (Settings, Data; the Food database screen;
   each pack's header; the data repository's ATTRIBUTION file; each food's source label, `format/foodSourceLabel.ts`, shown
   through `FoodTrustMark` in search, in online results and on the amount step) are enough for ODbL 4.3, for USDA's
   requested citation and for ARS's FNDDS citation.
4. **Contents.** That individual records are correctly described as under the Database Contents License 1.0, and that not
   shipping product images keeps CC BY-SA out of scope.
5. **Live lookups.** That a product fetched live from Open Food Facts and kept on the phone (MM-58) is covered by the same
   terms, and that the user's own foods are not part of any published database.
6. **Text, not links.** Each source's address and each licence's address (opendatacommons.org/licenses/odbl/1-0/,
   .../dbcl/1-0/) are now shown as text. Whether text alone, with no link that opens a browser, satisfies "with a link" in
   Open Food Facts' terms; and whether a single Open Food Facts food shown in the app must also name its product page
   (world.openfoodfacts.org/product/<code>). If not, what must be linkable.
7. **The Hugging Face tag.** That the AGPL-3.0 tag on the Hugging Face listing does not bear on this data (the packs are
   built from Open Food Facts' own export, never from the Hugging Face copy).
8. **Telling USDA (optional).** FoodData Central's home page asks, when possible, to be told of products that use its data.
   The owner may notify USDA FDC that Martian Macros uses it; nothing in the licence depends on it.
