---
id: MM-58
status: done
component: food-database
related: [MM-50, MM-43, MM-44, MM-56, MM-95]
---

# Story: Look up an unknown barcode online, if I allow it

## Context
The installed pack is a snapshot. A product launched last month is not in it. Open Food Facts has a public API that can answer for a
single barcode.

## Decisions (made with the product owner)
- **A live lookup is opt-in.** The app is offline by default and health data never leaves the device.

Choices I made without asking (say if any is wrong):
- **The question is asked the first time it would help** (an unknown barcode with a network available): "Look this up online? Only the
  barcode number is sent." with Always, Just this once, and Never. The choice can be changed in Settings.
- **Only the barcode is sent.** No identifier, no account, nothing about the user.
- **A product found online passes the nutrition checks** (MM-53) before it is offered, and is cached on the device so it is found offline
  next time.

## Description
On an unknown barcode, if allowed and online, the app asks the Open Food Facts API for that barcode, validates the answer, and continues to
the amount step as if it had been in the pack. If it is not found, or fails the checks, or there is no network, the app falls through to
reading the label (MM-44).

## Acceptance Criteria
```gherkin
Scenario: First unknown barcode
  Given the user has not been asked before
  When an unknown barcode is scanned with a network available
  Then the app asks, and says only the barcode number is sent

Scenario: Never
  Given the user chose Never
  When an unknown barcode is scanned
  Then no request is made and the label scan is offered

Scenario: Found and remembered
  Given a product was found online
  When its barcode is scanned again with no network
  Then it is found

Scenario: A bad online entry
  Given the online entry fails the nutrition checks
  Then it is not offered, and the label scan is
```

## Notes
- Follow Open Food Facts' API etiquette: a descriptive User-Agent and their rate limits.

## Progress (2026-10-20, feat/m2)
Built, closing the ticket. The owner asked on 2026-10-20 for a food-data solution with additional sources; the live lookup is
how the app reaches beyond its packs, so the ticket joined M2.
- **Two online sources behind one interface** (`OnlineFoodSource`, in a new `foodOnline` layer): **Open Food Facts** over its
  public API (`OpenFoodFactsSource`: one product by barcode, or a name search on request; requests spaced to its published
  limits of 15 product reads and 10 searches a minute and carrying the app's User-Agent, as its etiquette asks) and **USDA
  FoodData Central** over its API (`UsdaFoodDataCentralSource`: a barcode is a search of the Branded foods for its digits,
  matched exactly on the normalized code; a name search asks every data type). FoodData Central needs a key the build is given
  (`MM_FDC_API_KEY`, from the environment or the git-ignored `config/prod.local.json`); a build without one has Open Food
  Facts alone. Each answer is mapped onto the pipeline's own candidate (`offCandidate`, `fdcCandidate`: the same nutrient ids,
  unit conversions, US-label carbohydrate rule and refused vitamins as the pack build's extract) and passes the same nutrition
  checks (MM-53) and trust tiers (`packEntryFor`), so a food found online is judged exactly as one in a pack. The request is
  made through the shell's own HTTP stack (`CapacitorJsonHttp` behind `JsonHttp`, a domain seam with an in-memory fixture).
- **Consent** (`OnlineLookupChoice`: ask, always, never; `user_preferences.online_lookup`, schema 12): the first unknown
  barcode with a source to ask shows the question in the scan step's own notice, "Look this up online? Only the barcode
  number is sent to Open Food Facts…, nothing about you. You can change this in Settings." with Just this once (this run
  of the app), Always and Never. Never means no request, ever, and the label is offered as before. The choice is also in
  Settings, Data, "Look foods up online" (a listbox like Units), and a build with no source shows no such row.
- **Order on a scan**: the person's own foods, the installed packs, then online if allowed. Every source is asked at once; the
  most reliable answer wins (`sourceReliability`, as between packs); not found only when a source said so, "could not be
  reached" when none answered. The product found opens the same amount step as a pack's, marked "found online".
- **Kept on the phone** (`OnlineFoodCache`: `online_foods` table, schema 12, SQL and in-memory under one contract): a food
  found online is a record of the catalog's "online" pack from then on, so the next scan of that barcode needs no connection,
  and it is searched with the packs. Erased with everything else; copied by the backup, like every table.
- **Search online, on request** (`OnlineSearchResults`): a "Search online" action under the phone's results, never as the
  person types (Open Food Facts asks that search not be used that way); the first time it asks the same question, saying the
  words typed are what is sent; what is found is listed under "Found online" with each food's source and tier, and the one
  picked is kept.
- **Said in the terms** (section 9, version 2, with the change note shown to someone who agreed to version 1) and on the new
  Settings screen "Food data sources" (MM-57).
- Tests: `openFoodFactsSource.test.ts`, `usdaFoodDataCentralSource.test.ts` (mapping from real answers of 2026-10-20, not
  found, failed checks, unreachable, spacing), `onlineFoodCacheContract.ts` (both implementations), `onlineLookup.test.ts`
  (consent, every source asked, the most reliable kept), `scanOnline.test.tsx` (each acceptance scenario: asked first, never,
  found and remembered offline, a bad entry not offered), `searchOnline.test.tsx`, `foodSources.test.tsx`, schema 12 upgrade.
  Stories: ScanAsksOnline, ScanFoundOnline, ScanNeverOnline, ScanNotFoundOnline, ScanOnlineUnavailable, SearchOnlineOffered,
  SearchOnlineAsks, SearchOnlineFound, SearchOnlineNothing, SearchOnlineUnavailable, FoodSources, SettingsOnlineLookup.

Decided here (say if wrong):
- **USDA FoodData Central is the second online source**, not only Open Food Facts as the ticket names: it is public domain,
  needs only a free key, and its Branded set is the pack's main source, so a product launched since the pack was built is
  found there with label figures rather than crowd ones. The key is the owner's to obtain (api.data.gov); until it is set,
  the build asks Open Food Facts alone.
- **A name search online exists too**, on request only: the ticket is about barcodes, but a food with no barcode (a
  restaurant dish, a new generic) is the other gap in the packs, and the same consent covers it with the same words.
- **The User-Agent names the repository**, not a person: Open Food Facts asks for a contact, and the app has no account or
  person to name.
- **"Just this once" lasts for this run of the app**, not for one lookup: asking again on the next scan of the same session
  would be nagging.
- Not built: the online answer is not written back to a pack, and nothing is contributed to Open Food Facts (MM-44 lists
  that as undecided).
