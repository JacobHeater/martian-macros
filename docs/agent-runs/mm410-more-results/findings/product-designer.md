# Product-designer review: "More results" at the end of a food search (MM-410)

**Role:** product-designer (review lens, not a credential). **Reviewer:** Claude Code read-only subagent of the parent session, 2026-10-19. **Audit mode:** change (brief). **Branch:** `feat/more-results`, uncommitted working tree; baseline `main` ce672d6. Input hashes as recorded in the brief (no shell). **Requirements inspected:** MM-410, MM-42, MM-408. **Direction:** `design/screen-direction.md` (rules 1, 6, 9; "Food logging flows"; notice family), `design/anti-cruft-and-anti-slop.md` (§2, §3, §6, §8). **Render:** none in a browser; everything below is read from the stories' source (`Food.stories.tsx:517-536`) and the components they draw. Light/Dark/Martian rendering, Ember-on-raised contrast and the row height with the two-line trust detail are unverified.

## Depth-target walkthrough (walked)

Person: someone a few weeks in, logging lunch, who has never seen the list go past its end. Task: type "yogurt", find a plain low-fat one, pick it.

1. **Open Add food, type "yogurt".** Headline, the field, rows once the typing pauses: title, "97 kcal per 100 g", source and tier caption, grade badge (`FoodSearchResults.tsx:70-81`). Passes.
2. **Scan the first twenty.** `MmListRow` at min 56 dp with a two-line detail; twenty run past the sheet's 90% max-height (`ui.css:1493-1499`), so the person scrolls the sheet. No hairlines (not in an `mm-list-group`). Passes, pre-existing.
3. **Reach the end.** Under row 20: a full-width centred Ember text button "More results" (`FoodSearchResults.tsx:84-86`; `.mm-button-text`), a 12 dp gap, then the outlined "Enter manually" (`AddFoodSheet.tsx:711-720`). The only Ember on the sheet in this step is this word (grade badges use `--grade-*`, trust text `--text3`/`--info`). "More results" under a list says the list went on. Passes.
4. **Press "More results".** Re-asks the catalog with `limit: 40`; with `keep: true` the old twenty stay. Until the answer lands nothing changes; the button stays enabled and identical; no busy sign. A second press is idempotent. **Fails on "no sign of the result" for the interval between press and answer** (PD-2). The interval on a phone is unknown to me.
5. **Read the new rows.** Seven rows join above the button, where the person is looking, because the sheet's scroll offset holds and rows keep stable keys. No seam marker, and none wanted: a "Results 21-40" header would be narration (anti-cruft §3). Passes.
6. **Button gone.** The page came back short, so the control is not drawn; "Enter manually" moves up. Passes for 27. **For a match count that is an exact multiple of twenty**, the press returns the same rows and the button vanishes under the finger: "that was all" cannot be told from "it did nothing" (PD-3).
7. **Pick a row.** The amount step; unchanged, surveyed.
8. **Type another letter.** `limit` falls back to one page (line 43); the list shortens and the button returns. Passes.

## Findings

**PD-1. Weight and kind: keep the text kind; not a row, not a second secondary.** Design judgment confirming the ticket's decision. Severity low; confidence medium. Evidence: `FoodSearchResults.tsx:85` vs `AddFoodSheet.tsx:711-714`; MM-410 Decisions; rule 6 (text actions the tier beneath the one fill) and rule 9 (sibling named, reason written). A `MmListRow` would look like a food and compete with the foods; `opens` would promise a pushed screen. Two stacked secondaries would be equal loudness for unequal decisions (anti-cruft §2). The text kind puts the only Ember of the step on "more", nudging towards a database food over a hand entry, the right nudge. The ticket's reason says the text kind is "lighter"; in colour it is the louder of the two, so the written reason should say the Ember word marks the continuation while the outline marks the exit. Recommend: no change to the control; one sentence in MM-410's Decisions.

**PD-2. No busy state between the press and the next page.** Usability problem by inspection. Severity medium on the code path, low if the gap is under about 150 ms on a phone (direction "Loading"). Evidence: `FoodSearchResults.tsx:43-51, 84-86`; `useAsync.ts:25-26`; `MmButton.tsx:36` (the only off state is `disabled`, which reads as "nothing more"). Recommend: while the question is pending, the app's own `MmSpinner` in the 48 dp slot, same height; never a faded button, never a native indicator (rule 8); a story for it, or it is a state no story draws (MM-292). Referral: UX-accessibility for what is announced; React-Capacitor or QA for the latency on the owner's phone.

**PD-3. The end is silent when a page comes back exactly full.** Usability problem by inspection, bounded frequency (one search in twenty that shows the button). Severity low; confidence high. Evidence: `FoodSearchResults.tsx:84`. Recommend the smallest truthful fix: after a press whose page came back with nothing new, one quiet caption in the vacated slot ("That's every match for "yogurt"."); not on a first page that is short. Alternative: accept the silence and record it.

**PD-4. The label's noun.** Design improvement, low, confidence medium. Evidence: the sheet's words are "Search foods" and `Nothing found for "..."`; the app's other "More …" controls are disclosures ("More about this day", "More about this week", "More nutrients (optional)"). "Results" appears nowhere else a person reads; "More foods" matches the field's noun. Counter: "results" is universally understood. Recommend: owner's call.

**PD-5 (surveyed, pre-existing).** The search rows carry their own 16 dp padding (`ui.css:425`) inside a sheet already padded 16 dp (`food.css:153-155`); `MmListRow` has `flush` for this and the rows do not use it, so row text likely sits 16 dp further in than the field and the two buttons. Unverified hypothesis requiring a render; low; track separately.

No finding on: the stack order, the 12 dp gap, the absence of a seam marker, the new-query reset.

## Audit coverage

- **Methods:** source inspection only; no browser, screenshots, commands or tests run.
- **Inspected:** `Food.stories.tsx:440-546`, `storyFoods.ts`, `FoodSearchResults.tsx`, `AddFoodSheet.tsx:600-730`, `MmButton.tsx`, `MmListRow.tsx`, `MmSheet.tsx`, `MmSpinner.tsx`, `DownloadStatusStrip.tsx`, `FoodGrade.tsx`, `FoodTrustMark.tsx`, `useAsync.ts`, `FoodCatalog.ts:33-38`, `SqliteFoodPack.ts:85-96`, `ui.css`, `food.css`, `app.css`; the tests by name; the three tickets; both design docs; every `kind="text"` use in `src/`.
- **Surveyed only:** `AddFoodSearching`, `AddFoodOwnAndRecent`, `AddFoodNothingFound`; the amount step; `MmTextField`; `MmGradeBadge`.
- **Not inspected:** ranking (MM-42), pack data (MM-409), debounce timing (MM-408), Ember-on-raised contrast in Light, text scaling, `hierarchy.test.tsx`, `unseen.json`.
- **Tests versus criteria:** "A second page" and "One page or less" trace to `searchMoreResults.test.tsx:51-71`; "A new query starts over" has no test (gap, low).
- **Referrals:** UX-accessibility (focus after the button is removed, live announcement, PD-2's spinner semantics, Ember contrast); React-Capacitor (the cost of re-fetching `limit: 40` rather than an offset).
- **Limitations:** code-only review of a visual question; one reviewer; no rendered palettes.

## Chair request (bounded)

To React-Capacitor or QA: on the owner's phone with the 2026-10-19 packs, how long does `catalog.search("yogurt", { limit: 40 })` take from press to rows? It decides PD-2's severity.

## Research

- **Status:** performed (WebSearch and WebFetch). Question: is a single "load more" control at the end of a mobile list, with the loaded rows kept, a recognised pattern, and what does the evidence say about end and loading signals?
- **Source:** Christian Holst (Baymard Institute), "Infinite Scrolling, Pagination Or 'Load More' Buttons? Usability Findings In eCommerce", Smashing Magazine, 2016-03-01, accessed 2026-10-19, https://www.smashingmagazine.com/2016/03/pagination-infinite-scrolling-load-more-buttons/. Supported: a "Load more" button at the end of the list with the loaded items staying solved the usability issues seen with pagination and avoided infinite scroll's superficial scanning; for mobile, a single large "Load more" button after about 15-30 items; never infinite scroll for search results. The article gives no guidance on busy or end signals, so PD-2 and PD-3 rest on the walkthrough.
- **Limits:** 2016, e-commerce, one source secondhand to Baymard's report; it supports the pattern and page size, not the Ember weight (a design judgment).

## Safety, decisions, verification

- Safety: none found; not clinical clearance.
- Unresolved owner decisions: PD-3 (quiet end line versus accepted silence); PD-4 (the noun).
- Verification: nothing executed. Requests to the edit owner: run `searchMoreResults.test.tsx`; render both stories in the three palettes; if PD-2 is built, add its story and a held-catalog test.
