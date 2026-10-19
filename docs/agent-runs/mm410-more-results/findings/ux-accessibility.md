# UX-accessibility review: "More results" at the end of a food search (MM-410)

**Role:** ux-accessibility (UX guard). **Reviewer:** Claude Code read-only subagent (claude-fable-5-1), 2026-10-19. **Audit mode:** change (per brief). **Baseline:** `main` ce672d6; inputs are the uncommitted working tree of `feat/more-results`. I could not compute SHA-256s (no shell); I relied on the hashes recorded in the brief and read the files as they are on disk. **Requirements inspected:** MM-410, MM-42, MM-408. **Render:** the two stories read from source only (`Food.stories.tsx` lines 516-536); **no browser capture was available**, so everything below about layout, scroll position, contrast and what a screen reader says is source inspection, not observation.

## Task walkthrough (depth target, walked)

Person: a novice on a phone, first week with the app, looking for a yogurt. Task: Add food, type "yogurt", read twenty rows, press "More results", read seven more, choose one. Count from the brief: 1 field + 27 pressable rows + 2 buttons.

1. **Sheet opens.** Sees headline "Add food", field "Search foods" (`AddFoodSheet.tsx:648-649`), three secondary chips Scan/Saved/Estimate (650-656), and "Enter manually" (711-720). Nothing new here; passes.
2. **Types "yogurt".** Chips disappear once the query is non-empty (650); after the 150 ms pause (`FoodSearchResults.tsx:23,40`) twenty rows appear, each a button whose name is the title plus "97 kcal per 100 g" plus the trust mark, with a separate grade button at the end (70-82, `MmListRow.tsx:90-102`). The list ends in "More results", ember text, full width (`FoodSearchResults.tsx:85`, `ui.css:39-43,51-54`), an `app-gap-small`, then outlined "Enter manually" (`AddFoodSheet.tsx:710-720`). Must interpret: that the list continues. The label says so plainly; there is no count (a non-goal). Passes for a sighted reader. A screen-reader user has no count either: the rows are a run of buttons, not a list (pre-existing).
3. **Presses "More results".** Pressed feedback: background `--selected` (`ui.css:1943-1976`). Then nothing changes until the answer arrives; the button stays enabled and a second press is idempotent (85 recomputes `count` from the kept `answer.limit`). When the answer comes (27 rows), seven rows are inserted above the button's position and the button is removed because `27 !== 40` (84). Sighted: the new rows appear where the finger was; by reasoning from the sheet being the scroll container (`ui.css:1493-1503`) the scroll offset holds. Not confirmed without a render. **Screen reader: fails** (F1): no announcement; if the page is short the focused button is unmounted and focus falls to the document body; if the page is full the button survives but now sits below twenty new rows.
4. **Chooses a row.** `onPick` (79) opens the amount step; out of scope.
5. **Recovery, new query.** Typing again keeps the 27 rows until the new answer (`useAsync` `keep`) and then lists one page (`FoodSearchResults.tsx:42-43`). Correct by inspection; no story or test exercises it (F4).
6. **Recovery, a page that fails.** `useAsync` swallows the rejection (`useAsync.ts:17`); with `keep`, the old 20 rows and the enabled button remain. The person sees nothing happen (F3).

## Findings

**F1. Screen reader gets no sign the list went on, and loses or misplaces focus.** Severity **high**. Confidence high for the DOM behaviour, medium for exact VoiceOver/TalkBack handling (unobserved). Evidence: `FoodSearchResults.tsx:84-86` renders the button conditionally with no ref, no focus move and no status region; `MmButton.tsx:29-43` and `MmListRow.tsx:96,107` forward no ref; siblings use `role="status"` (`ui/MmOverlays.tsx:220`; `ui/DownloadStatusStrip.tsx:29` visually hidden). WCAG 2.2 SC 4.1.3 gives "5 results returned" as the canonical status message. Recommend: (a) after the answer arrives with more rows, move focus to the first new row (index = previous `limit`); and (b) a polite status with the delta ("7 more results", or "No more results" when the page came back short). Proposed criterion: "When 'More results' is pressed and the next page arrives, a screen reader is told how many rows joined and reading resumes at the first new row." Not blocking.

**F2. A match count that is an exact multiple of twenty offers "More results" that adds nothing, and a second tap can land on "Enter manually".** Severity **medium**. Confidence high. Evidence: `FoodSearchResults.tsx:84` `hits.length === answer.limit`. Recommend asking the catalog for `limit + 1`, rendering `hits.slice(0, limit)` and showing the button only when `hits.length > limit`; MM-410 "while there may be more" becomes "while there are more", with a scenario for exactly twenty.

**F3. No loading or failure state for the next page.** Severity **medium** for failure, **low** for loading (local reads under about 150 ms show nothing, `design/screen-direction.md:344-346`). Evidence: `useAsync.ts:17` drops errors; the button stays enabled while pending. Recommend a MM-410 scenario for a failed page (rows stay, `ReadFailedNotice` beneath them) and a QA measurement of second-page latency on the owner's phone. Do not disable the button while pending. A failed first page already renders nothing (pre-existing, outside this change).

**F4. Acceptance criterion "A new query starts over" has no story and no test.** Severity **low**. Evidence: `searchMoreResults.test.tsx:51-71` covers scenarios 1 and 2 only. Recommend a third test, and a story if every state is to be drawn. Referral: QA.

**F5. Weight of the control beside its sibling.** Severity **low**. Confidence medium (unrendered). Routed to product-designer. Evidence: text kind at `FoodSearchResults.tsx:85`, secondary at `AddFoodSheet.tsx:711-714`. From the novice's seat, the cheaper and likelier-right next step is drawn lighter than the costlier fallback. Text kind has sibling precedent in the same sheet ("Back to food choices", line 724), and a list row would read as a food, so no row. Whether both should share a kind, and whether ember text on `--raised` in Light meets the contrast table, is for the product designer.

**Label.** "More results" is the search's word; "More foods" would read as "add more foods"; "Show more" says less. No finding.

**Large text.** Short label, `min-height: 48px`, wrapping row text. No defect by inspection; unrendered.

## Verdict

Pass, no blocking finding. F1 (high) should be fixed in the same change before build; F2 and F3 are cheap and recommended with it.

## Chair request (out of remit, bounded)

To **product-designer**: should "More results" and "Enter manually" share one kind, and does ember text on `--raised` in Light meet the contrast table? Changes F5 only. To **react-capacitor**: can `MmListRow` take a ref or an autofocus prop so focus can move to the first new row (MM-261)? Changes F1's remedy. To **QA**: measure second-page latency on the phone with the MM-409 packs (F3's loading half).

## Audit coverage

- **Methods:** source inspection; analytical walkthrough of the depth target; two normative web sources. No runtime, render, device, assistive technology or contrast measurement.
- **Walked:** the depth target (steps 1-6). **Surveyed:** `AddFoodSearching`, `AddFoodOwnAndRecent`, `AddFoodNothingFound`; `FoodCatalog.search` paging; `ui.css` pressed/focus rules.
- **Not inspected:** ranking (MM-42), pack data (MM-409), the debounce beyond its hook, `FoodGrade`/`FoodTrustMark` internals, the gallery contrast test, `unseen.json`, the amount step.
- **Pre-existing, out of change scope:** rows carry no list semantics; a failed first search renders nothing.
- **Referrals:** product-designer (F5), react-capacitor (F1 remedy), QA (F3 latency, F4 test).
- **Limitations:** no browser or device; assistive-technology behaviour inferred from DOM removal; hashes not recomputed.

## Research

- **Status:** performed, directly.
- **Question:** when "More results" adds rows and may remove itself, what does current normative guidance ask for so a screen-reader user learns the result and keeps a place?
- **Sources:** (1) W3C WAI, "Understanding SC 4.1.3: Status Messages", WCAG 2.2, https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html, updated 11 May 2026, accessed 2026-10-19: a brief text about a search outcome is a status message that must be programmatically determinable without moving focus. (2) W3C WAI, "Understanding SC 2.4.3: Focus Order", WCAG 2.2, https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html, updated 09 March 2026, accessed 2026-10-19: inserted content should follow its trigger in the focus order; neither page prescribes where focus goes when the focused element is removed (inference, confidence medium).
- **Not researched:** the label wording (product call); the latency bound (needs measurement).
