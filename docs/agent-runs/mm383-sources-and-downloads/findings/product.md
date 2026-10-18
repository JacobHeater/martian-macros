# Review: product

Handed back as text by the read-only product role (Claude Code subagent, claude-fable-5-1), 2026-10-18, run `docs/agent-runs/mm383-sources-and-downloads/`; written to this file by the chair verbatim.

## Scope and traceability
- **Role:** product and requirements (`agents/roles/product.md`), read-only, no shell, no edits, no delegation. `AGENTS.md`, `agents/panel-protocol.md`, `agents/review-contract.md`, `agents/templates/findings/role.md` and the run's `brief.md` were read first.
- **Subjects:** `requirements/food-database/STORY.a-third-source-and-the-reliability-score.MM-383.md`, `requirements/food-database/STORY.packs-download-together.MM-384.md`.
- **Requirement files inspected:** MM-42 (`requirements/food-logging/STORY.search-the-food-database.MM-42.md`), MM-153, MM-56, MM-51, MM-57, MM-43, MM-381, MM-346, MM-352, MM-267, MM-108, `requirements/README.md`, `requirements/HANDOFF.md` (lines 1-30, 256-297), `roadmap/roadmap.json` (lines 730-752, 2362-2389), `docs/non-goals.md` (lines 88-120), `docs/food-grades.md` (lines 115-139), `docs/evidence.md` (lines 100-170), the prior run's `docs/agent-runs/mm380-proprietary-grade/findings/integrations.md`.
- **Implementation inspected:** `apps/mobile/src/foodCatalog/{FoodCatalog,SearchHit,TrustTier,SqliteFoodPack,CatalogFood,FixturePack,SourceReliabilityRule,sourceReliability}.ts`, `apps/mobile/src/foodPipeline/{PackBuilder,packEntryFor,ConflictPolicy,PreferredSourcePolicy,MostRecentPolicy,DropReason,GenericPrecedencePolicy}.ts`, `apps/mobile/src/food/{AddFoodSheet,FoodSearchResults,FoodTrustMark}.tsx`, `apps/mobile/src/food/scan/BarcodeScanStep.tsx`, `apps/mobile/src/format/{foodSourceLabel,trustTierLabel}.ts`, `apps/mobile/src/foodPacks/{FoodDatabaseScreen,AvailablePackCard,PackDownloadCard,DownloadStatusHost}.tsx`, `apps/mobile/src/state/{PackDownloadController,PackDownloadsController,PackDownloadState}.ts`, `apps/mobile/src/foodCatalog/download/PackListing.ts`, `apps/mobile/src/ui/{DownloadStatusStrip,MmIconButton}.tsx`, `apps/mobile/src/about/{EvidenceQuestionScreen,EvidenceRowCard}.tsx`, `apps/mobile/src/domain/evidence/EvidenceRow.ts`, `apps/mobile/src/gallery/screens/{storyPackHost.ts,Settings.stories.tsx (FoodDatabase* stories),CoachingInsights.stories.tsx (SearchWithGrades)}`, `apps/mobile/src/domain/integration/FoodSearch.ts`, `apps/mobile/src/fixtures/InMemoryFoodCatalog.ts`.
- **Tests inspected (read, not run):** `apps/mobile/test/foodCatalog/foodPack.test.ts`, test names in `apps/mobile/test/settings/foodDatabase.test.tsx` and `apps/mobile/test/state/packDownloadController.test.ts`.
- **Commit:** branch `spike/proprietary-food-grade` at `42ce258`, with uncommitted work. **The inputs were not frozen:** during this review the chair's build was in flight. `AvailablePackCard.tsx` changed between my first and second read (from `MmButton` to `MmIconButton`); `FoodCatalog.ts` changed from tier-then-match to reliability-then-match; `SourceReliabilityRule.ts`, `sourceReliability.ts`, `GenericPrecedencePolicy.ts` and `PackDownloadsController.ts` appeared. **SHA-256 not computed** (no shell). Findings cite the tickets as drafted and the files at the moment read; the chair should re-hash before persisting.

## Existing facts versus proposals

### Repository facts (cited)
- **Search order as committed:** `FoodCatalog.ts:16-19, 32-38` at `42ce258` sorts the union of each pack's top `limit+offset` text hits by `TrustTier.code` ascending, then bm25 `score`; `byBarcode` (`:40-46`) returns the first pack's hit. The in-flight file sorts by `sourceReliability` descending then `score`, and `byBarcode` keeps the highest-scored record across packs, first pack on a tie.
- **Each pack returns its own top 20 by text** (`SqliteFoodPack.ts:85-96`, bm25 over `foods_fts`); the UI asks for 20 with no paging (`FoodSearchResults.tsx:28`); MM-42 Progress records "search results are not paged" and "Reference-first ordering holds across packs, not within one pack's top 20".
- **The person's own and recent foods are above the packs structurally**, not by score: `AddFoodSheet.tsx:665-694` renders matching custom foods, then matching recents, then `FoodSearchResults`. No change to catalog ordering can move them.
- **Barcode conflicts are decided at build time, once, in the barcode pack:** `PackBuilder.ts:96-120` keeps one record per GTIN via `ConflictPolicy`; the chosen policy is `MostRecentPolicy` (MM-51 Decisions, 2026-10-09: "the record its source changed most recently wins, with Open Food Facts winning a tie"; result on the real data: "Open Food Facts wins all 33,736 shared barcodes; 7,401 foods carry the disagreement mark"). Generic candidates carry no barcode (`PackBuilder.ts:70-73`). So the installed packs today never hold the same barcode twice.
- **Trust tier is a switch on source id** (`packEntryFor.ts:9-19`): every Open Food Facts record is `checkThis`; a disagreement overrides any source to `checkThis` with the sentence at `PackBuilder.ts:15`.
- **MM-153's rule** (`Decisions`): "Three trust tiers, shown as one quiet mark, not a score"; "Search ranks by tier within relevance"; "when several entries share a barcode the highest tier is used and the others are hidden". Its AC "One barcode, two sources ... scanning it returns the manufacturer entry" and its Notes say that assumption "is that spike's recommendation and not yet the product owner's decision"; MM-51 then decided the opposite (freshness, Open Food Facts on a tie). `FoodTrustMark.tsx:6-10`: "Nothing here is a score".
- **The evidence register shows every row's figure on screen:** `EvidenceRowCard.tsx:16` draws `Value: {row.value}` when a rule card is pressed in How this works; `docs/evidence.md:141-169` is the register with a Value column per row. No "How are foods ranked?" entry exists yet (grep of `docs/evidence.md` for "ranked|reliab": only an unrelated line 69).
- **In-flight score rule** (`SourceReliabilityRule.ts`): bases 95/90/80/65/40, by-tier 85/60/35, −15, +3, +2. `sourceReliability.ts:25` applies the −15 only when `food.tier === 'checkThis'` and the source's own tier is not `checkThis`, i.e. **an Open Food Facts record marked for a disagreement takes no penalty**.
- **Downloads as committed:** `PackDownloadController.ts` holds one state (`:16`), `start` returns while any download runs (`:35`); `AvailablePackCard.tsx:17-30` (committed) disables the button while anything runs; `FoodDatabaseScreen.tsx:59-77` and `DownloadStatusHost.tsx:14-32` read that one state; the strip has one `role="status"` line and one unnamed-beyond-"Cancel" button (`DownloadStatusStrip.tsx:22-30`). In flight: `PackDownloadsController.ts` keeps a list keyed by pack id with `cancel(id)`/`discard(id)`; `AvailablePackCard.tsx:31` uses `MmIconButton icon="download" label={`${verb} ${listing.title}`}`.
- **Manifest titles:** `packagePacks.ts:11` names the generic pack "Common foods"; the barcode pack is "Barcode foods, United States" (`storyPackHost.ts:70`). The real manifest lists two packs (HANDOFF line 21-22). `storyPackHost` lists one.
- **MM-56's owner decision (2026-10-09):** "show when it's downloading, and the user has a status indicator with a cancel button"; its Progress: "a Download button that is the only thing that starts a download"; a strip "stays at the bottom of every screen".
- **MM-267** is the pressed-state bug, not an icon-naming rule. "An icon alone is not enough" is written in MM-99 (`STORY.navigation-with-dashboard-first.MM-99.md:25`) and in `MmIconButton.tsx:8`.
- **Roadmap:** both tickets sit in WS-07 step 12 (`roadmap.json:750-751, 2373-2379`). Frontmatter `in-progress` is allowed while active (`requirements/README.md:113-114`).

### Approved requirements that bind
MM-42 "generic foods come first", own foods above database results, offline search; MM-153 three tiers, one quiet mark, no "verified", reference first, one barcode shows the highest tier; MM-56 user-initiated downloads with visible progress and Cancel, resume, verify, old pack untouched; MM-57 attribution; MM-108 voice; the owner's fixed constraints in the brief (an additional source; search ordered by the reliability score; the score is the author's; concurrent downloads; the button becomes an icon).

### Proposals
Everything under Findings, the proposed criteria and the owner decisions are proposals.

## Audit coverage
**Mode:** `change` (the two tickets plus the search, scan, pipeline-conflict and download behaviour they touch).
**Inspected:** listed above. **Not inspected:** `tool/src/foodSource.ts`, `extract.sql`, `BuildReport.ts`, `packTerms.ts`, `PackDownload.ts`, `PackStore.ts`, the native plugin, `apps/mobile/src/state/AppState.ts` beyond lines 428-432 and 971-973, the designer's and UX guard's areas (card layout, strip stacking, palettes, 48 dp, focus), the micronutrient data questions (covered by the prior run).
**Absent implementation:** no "How are foods ranked?" register entry; no per-pack `PackDownloadCard`/strip/screen yet (the committed screen reads one state; the controller is already plural in the tree); no `SourceReliability` tests found (glob for `sourceReliability|packDownloadsController|genericPrecedence` under `apps/mobile/test`: none).
**Evidence methods:** source inspection only; no command run, no build, no story rendered, no pack opened. Statements about which names SR Legacy and FNDDS actually carry ("Cheerios", "Bananas, raw" vs "Banana, raw") are recollection, marked as hypotheses.
**Cross-domain referrals:** integrations (P-6, P-4's pipeline side), ux-accessibility (P-7's Cancel naming and per-line status), react-capacitor (per-pack screen state), chair (P-11, stale register entry on the same branch).
"No findings" below is limited to this scope and method.

## Novice mobile experience
Not assigned to product in this run (designer and UX guard carry it). One product-level note only: the search list is a single 20-row list with no section headings, so a novice cannot tell where the generic block ends and the branded block begins; whether that matters is for the designer's walk, not asserted here.

## Findings

**P-1. The barcode rule as drafted cannot fire, and three tickets now hold two opposite rules for a shared barcode.** Confirmed requirement contradiction / requirement gap. Severity **high**; confidence high (inspection of `PackBuilder.ts:96-120`, `MostRecentPolicy.ts`, MM-51 Decisions, MM-153 AC "One barcode, two sources"). Expected: the owner left "the ranking of barcode scanning on source reliability" to the author, so the ticket decides which record a scan shows when sources disagree. Observed: MM-383 answers with "the most reliable record across the packs", but the packs on the phone carry one record per barcode (the generic pack has none; the barcode pack resolved every conflict at build time), so the rule chooses nothing until a second barcode pack exists. The decision that does govern a scan is MM-51's `MostRecentPolicy`, under which Open Food Facts (score 40, "a volunteer's transcription, unchecked" in the ticket's own table) won all 33,736 shared barcodes over USDA Branded (65). MM-153's acceptance criterion says the manufacturer entry is returned; MM-51 decided the opposite; MM-383 adds a third statement that agrees with MM-153 in words and with MM-51 in effect. User impact: a person scanning a box gets the record the ticket itself rates least reliable, and the new ticket says otherwise. Remediation: one rule, stated once, with the other tickets amended. Alternatives for the owner are under Unresolved decisions (1). Proposed wording for MM-383 Decisions whichever is chosen: "**Which record a scan shows is decided when the pack is built** (`PackBuilder`, the conflict policy), because the pack keeps one record per barcode. The app's `byBarcode` chooses across packs only when two installed packs carry the same barcode, which no published pack does today." Then either "The build-time policy stays `MostRecentPolicy` (MM-51): freshness, Open Food Facts on a tie; MM-153's scenario 'One barcode, two sources' is amended to match" or "The build-time policy becomes the reliability score: the higher-scored record is written, the other dropped as `lostConflict`, a disagreement still marks the winner 'check this'; MM-51's rule is superseded and its result table re-measured at the next build." Verification: inspection; the real-data figures are MM-51's, not re-measured.

**P-2. Ordering by score refines, and never inverts, the tier order, so MM-42's "generic first" and MM-153's "reference first" hold; the hiding of a typed branded food is pre-existing and FNDDS makes it more frequent.** Design/usability improvement plus documentation gap. Severity medium; confidence high on the arithmetic, medium on the frequency (needs the build). Calculation from `SourceReliabilityRule.ts`: reference scores lie in 80-100 (FNDDS 80 to Foundation 100; a generic food never takes the −15, since disagreement is barcode-only), label in 65-70 (other-source label 60-65), check-this at most 55 (Branded with a disagreement 50-55; Open Food Facts 40-45; other 35-40). Tier bands do not overlap, so the sort by score is the sort by tier with three refinements: Foundation above SR Legacy above FNDDS within reference; a Branded record marked for a disagreement above every Open Food Facts record (today both are `checkThis` and text decides); within Open Food Facts, completeness before text. For the USDA sources the +3/+2 are near-constant (all thirteen nutrients stated), so text match still decides within a source. What a person sees with FNDDS added (hypotheses on names until the build): "oats": Foundation's rolled and steel-cut oats, then SR Legacy's "Cereals, oats, ..." rows, then FNDDS, then Branded, then Open Food Facts; "banana": SR Legacy "Bananas, raw" and its babyfood rows, then FNDDS's "Banana, raw" and its dishes (bread, pudding, split), then Branded; "Cheerios": SR Legacy carries General Mills cereals as reference foods and FNDDS carries "Cheerios" and its variants, so several reference-tier Cheerios rows precede the Branded boxes. The owner's "Cheerios" worry is real but not new: because each pack returns its own top 20 by text and the UI shows 20 unpaged (`FoodCatalog.ts:36`, `FoodSearchResults.tsx:28`), a branded exact match is unreachable by typing whenever twenty or more generic names contain the word, under tier-first today exactly as under score-first tomorrow. FNDDS (about 5,400 foods, many dishes containing common words) raises how often the generic block fills all twenty rows. Remediation within the owner's fixed order: do not reorder; close MM-42's open "not paged" item with a "More results" step or paging (a separate ticket), and say in MM-383 that a packaged food in hand is reached by its barcode (MM-43) or Saved. Proposed MM-383 Decisions line: "**The order refines the tiers and never crosses them**: every reference food scores above every label food, and every label food above every 'check this' food, so MM-42's generic-first and MM-153's reference-first stand. A branded food whose name twenty generic foods share is reached by scanning it (MM-43), by Saved, or by paging once MM-42's paging is built." Verification: arithmetic on the rule's figures; the frequency is unmeasured.

**P-3. "Nothing here is a score" (MM-153) is kept on the food, but the figures will be on screen in How this works.** Documentation/requirement gap. Severity medium; confidence high (`EvidenceRowCard.tsx:16` draws `Value:` on press; MM-383 Decisions "Each figure has an evidence row"; MM-370's rule that every figure has a register row). MM-153's rule is about the mark beside a food: no badge, no number implying a check. An ordering score the person never sees beside a food does not breach it, and the register is where every figure of the app lives, so the figures there are consistent with MM-370's practice. But the ticket's AC "The score is never shown as a number" is narrower than its Decisions ("never shown as a number", unqualified) and the register entry is in the Description, not the AC. Remediation: say where the number may appear and where it may not. Proposed MM-383 Decisions wording: "**The score is never shown beside a food.** Search rows, the amount step and a scan result show the source in words and the tier mark (MM-153). The figures live only in the evidence register, as every figure does (MM-370), under 'How are foods ranked?', whose answer gives the order in words: 'Foods from analysed sources list first (USDA Foundation, then SR Legacy, then the survey foods), then manufacturer labels, then community entries; within a source, a record that states more of its nutrients lists first, then the closer match to what you typed. Your own and recent foods always list above the database. This is the app's judgement of each source, not a check of any food.'" Proposed AC under "Acceptance criteria" below.

**P-4. The in-flight rule exempts Open Food Facts from the −15 that the ticket applies to every record marked for a disagreement.** Requirement/implementation mismatch (in-flight code). Severity medium; confidence high (`sourceReliability.ts:25`: `disagreed = tier === 'checkThis' && own !== undefined && own !== 'checkThis'`; MM-383 Decisions: "−15 when the record was marked 'check this' for disagreeing with another source by more than 10%"). On the published pack 7,401 Open Food Facts winners carry the disagreement mark (MM-51); under the code they score as any other Open Food Facts record. The code's reason is plain: a `CatalogFood` cannot tell an Open Food Facts record's own `checkThis` from a disagreement except by its `tierReason` text (`PackBuilder.ts:15`). Remediation: either the ticket says "−15 for a Branded or reference record marked 'check this' by a disagreement; an Open Food Facts record is already at its floor" (and the scenario "The score" gains an Open Food Facts disagreeing case at 40), or the pipeline writes the disagreement as something the catalog can read (a column, or a stable reason code) and the −15 applies to every source. Author's call; record it.

**P-5. The "Search orders by reliability" scenario tests today's behaviour, not the change; the register entry and the tier property have no criterion.** Documentation/requirement gap (acceptance criteria incomplete). Severity medium; confidence high. The scenario (an Open Food Facts "Oats" against an SR Legacy "Oats, rolled, dry") is the existing test at `foodPack.test.ts:148-175`, which passes under tier-first. Nothing in the AC distinguishes score-first from tier-first, protects MM-42/MM-153 from a future change of the figures, or covers the register entry named in the Description. Proposed scenarios are listed under Acceptance criteria.

**P-6. One-name-one-food will catch few SR Legacy/FNDDS pairs, and "higher base wins" can drop the fuller record.** Unverified hypothesis requiring investigation; severity low-medium; referred to integrations and micronutrients. `GenericPrecedencePolicy.key` (`:13-15`) equates names only after trim, lower-case and space-collapse. SR Legacy names are plural commodity names ("Bananas, raw"), FNDDS singular as-eaten names ("Banana, raw"), and FNDDS adds "NFS"/"NS as to ..." suffixes (my recollection; the build measures it), so the person will still see two near-identical reference rows from two sources, which MM-42 ("one plain, trustworthy entry ... not twelve conflicting rows") argues against. Separately, `prefer` (`:18-23`) takes the higher base, so a Foundation record wins over an SR Legacy record of the same name even if it states fewer of the thirteen nutrients the grade reads. Proposed MM-383 wording if integrations agrees: "the record from the source with the higher base, unless it states fewer of the grade's inputs (fiber, sodium, sugars, saturated fat, the ten micronutrients) than the other, in which case the fuller record is kept"; and "`report.txt` counts `lostDuplicateName` per source so the owner can see how many pairs the rule found".

**P-7. MM-384's criteria cover two running downloads but not the states its Decisions promise per pack.** Documentation/requirement gap. Severity medium; confidence high. Decisions say "cancel, discard and resume act on that pack alone" and "A finished pack says so itself and leaves the others' progress in place", and the UI/UX section names FoodDatabaseOneDone, but there is no scenario for: one paused while the other runs (Resume/Discard on the paused one only); one failed (bad checksum) while the other runs (the notice for one, the old pack untouched, the other continuing: MM-56 "Corrupt file"); one finished while the other runs (listed under On this phone, its card says it is on the phone, the other's card and strip line stay); a pack that is running or paused is not offered as a card below (`FoodDatabaseScreen.tsx:59-63` filters by the single state today); "See what is available" while downloads run (`:77` hides it when anything runs; per pack or any?); and two Cancel buttons in the strip with the same accessible name "Cancel" (`DownloadStatusStrip.tsx:30`; the existing story already has to pick `getAllByRole('button', { name: 'Cancel' })[0]`, `Settings.stories.tsx:500`). The last is the UX guard's to rule on; product's ask is that the ticket names the control: "Cancel downloading <pack>". Proposed scenarios below.

**P-8. MM-384 cites MM-267 for the icon-name rule; MM-267 is the pressed-state bug.** Documentation gap; severity low; confidence high. Proposed: "since an icon alone says nothing (MM-99's rule for the navigation bar, applied by `MmIconButton`); its pressed state is MM-267's".

**P-9. MM-383's UI/UX section says SearchWithGrades shows the new order; it cannot.** Documentation gap; severity low; confidence high. The story searches "chicken" over the fixture pack (`CoachingInsights.stories.tsx:317-325`), whose every food has `source: 'fixture'` (`FixturePack.ts:57`), so all score 85 or 60 by tier and the order is tier-then-text as before. No screen state changes, so no new story is required by the Storybook rule; the ticket should say "the search screens do not change; the order is proved by tests over packs of several sources", or add a story over a two-source pack if the designer wants to see the blocks.

**P-10. MM-42's Progress is stale on own foods.** Documentation gap, out of this run's scope; severity low. MM-42 "Not done: the user's saved foods and recipes (MM-45) ranking first, only recents do" is contradicted by `AddFoodSheet.tsx:665-678`, which lists custom foods first. Worth a one-line correction when MM-383 cites MM-42.

**P-11. `docs/evidence.md`'s "How is a food graded?" still describes the Nutri-Score tables** (`:126-137`) while MM-380/382 on this same branch replace the method. Out of scope here; referred to the chair so the new "How are foods ranked?" entry is written against the replaced text, not the stale one.

**P-12. MM-153's "Label" tier for complete community data is not built, and the score bakes the gap in.** Documentation gap (existing); severity low. MM-153 Decisions put "community data that is complete and passes every check comfortably" in Label; `packEntryFor.ts:17-18` makes all Open Food Facts `checkThis`, and MM-153 Progress admits the pipeline rules are provisional. The score's flat 40 for Open Food Facts follows the code, not MM-153's text. Not a new defect; MM-383 should say "Open Food Facts records are 'check this' as the pipeline marks them today (MM-153's finer tiering is not built)" so the two tickets agree.

No other findings within this scope and method.

## Sources and evidence
No external source consulted. Repository evidence is cited inline. The prior run's integrations report (S1-S9 there) supplies the FNDDS facts the ticket relies on; nothing here re-verifies them.

## Research
**Status: unnecessary** for the product questions, which the repository answers. Two hypotheses (which brand-named cereals SR Legacy and FNDDS carry; the plural/singular naming gap in P-6) could be settled by a DuckDB query at the owner's first build rather than by web research; no search was performed and none is claimed.

## Confidence and limitations
- High: the arithmetic on the score bands (P-2), the contradiction between MM-153's scenario, MM-51's decision and MM-383's rule (P-1), the in-flight −15 exemption (P-4), the AC gaps (P-5, P-7).
- Medium: how often the generic block fills twenty rows after FNDDS; the names SR Legacy and FNDDS use.
- Limits: inputs changed during the review and were not hashed; nothing run or rendered; self-review only; the designer's and UX guard's areas untouched.

## Acceptance criteria and edge cases
**Existing criteria traced:** MM-383 "FNDDS foods are reference foods", "An unknown source fails the build", "One name, one food", "The score", "Coverage per source": testable in the pipeline suite (no tests exist yet in the tree). "Search orders by reliability": duplicates `foodPack.test.ts:148-175` (P-5). "A scan takes the most reliable record": testable with two fixture packs, but describes no shipped situation (P-1). "The score is never shown as a number": testable only as "no screen imports `sourceReliability`" plus the words shown; as worded ("no reliability number appears") it is not checkable. MM-384: all five scenarios testable with `PackDownloadsController` and the screen tests; gaps in P-7. MM-42 "My own foods rank first" and MM-153 "Reference first" still hold under the score (P-2) and should be named as traced.

**Proposed criteria, MM-383 (replace "Search orders by reliability" and add):**
```gherkin
Scenario: Sources within one tier
  Given a Foundation "Oats, rolled" and an SR Legacy "Oats" that match "oats" equally well
  When "oats" is searched
  Then the Foundation food lists first

Scenario: Text match decides within a source
  Given two SR Legacy foods stating the same nutrients
  When a query matches one more tightly
  Then that one lists first

Scenario: The order never crosses a tier
  Then every reference food scores above every label food, and every label food above every "check this" food, whatever the modifiers (the lowest reference score exceeds the highest label score, which exceeds the highest "check this" score)

Scenario: Marked for a disagreement
  Given a USDA Branded record marked "check this" for a disagreement and an Open Food Facts record not so marked
  Then the Branded record lists first

Scenario: Own foods stay above the packs
  Given a saved food "Protein oats" and a recent "Oats with milk"
  When "oats" is searched
  Then both list above every pack result, whatever the packs' scores

Scenario: Never beside a food
  When a search row, the amount step or a scan result is drawn
  Then the source is in words and the tier is the mark, and no screen module imports sourceReliability (architecture test)

Scenario: The register answers "How are foods ranked?"
  Then the evidence register has that question, its answer gives the order in words, and every figure of SourceReliabilityRule has a row it names
```
Plus, per P-1, one scenario for the chosen barcode rule (build-time), and per P-4 the Open Food Facts disagreeing case in "The score".

**Proposed criteria, MM-384 (add):**
```gherkin
Scenario: One paused, the other running
  Given two downloads running
  When the first is cancelled
  Then its card says Paused with Resume and Discard for it alone, and the second's progress card and strip line stay

Scenario: One fails, the other continues
  Given two downloads running and the first's file has the wrong checksum
  Then the first says what happened and that the pack on the phone is untouched, and the second keeps going

Scenario: One finishes while the other runs
  Then the finished pack is listed on this phone and its card says so, and the other's progress card and strip line stay

Scenario: Offered once
  Given a pack that is running or paused
  Then no download card is drawn for it below, and "Nothing new to download" is not shown while any listed pack is still offered

Scenario: Each strip line is told apart
  Given two downloads running
  Then each strip line is its own status with the pack's name and percent, and each Cancel is named "Cancel downloading <pack>"
```
**Edge cases:** the same pack started from the card and the strip; a pack whose manifest listing disappears while it runs; both packs on mobile data at once (MM-56 warns per card; no new warning is proposed); a format 2 pack installed beside a format 1 pack (scores differ by the +2 only once sugars are stated, so a format 1 pack's foods never take it).

## Dependencies
- **integrations:** P-1 (whether the build-time policy changes and what `lostConflict` then counts), P-4 (a readable disagreement mark), P-6 (the name key and the fuller-record tie-break; the `lostDuplicateName` count per source).
- **micronutrients:** P-6 (does "higher base wins" ever drop grade inputs between Foundation and SR Legacy).
- **ux-accessibility:** P-7 (Cancel naming and per-line status with two downloads; "See what is available" while downloads run).
- **react-capacitor:** the screen, card and host reading the list per pack (the committed screen reads one state).
- **chair:** P-11 (the register's grade entry is stale on this branch); re-hash inputs; MM-42 and MM-153 amendments if the owner decides under (1).
- Tickets: MM-42 (paging, stale progress), MM-153 (scan scenario), MM-51 (conflict rule), MM-56 (per-pack states), MM-57 (credit line naming FNDDS).

## Safety concerns
None found in this scope. Ordering by source reliability changes which record a person logs, not what is said about them; MM-108's voice is unaffected by the proposed register wording ("judgement of each source, not a check of any food"). Not clinical clearance.

## Unresolved product decisions (handed up through the chair; the owner delegated the barcode rule to the author, so (1) may be the author's to decide and record "say if wrong")
1. **Which record a shared barcode shows** (P-1): (a) keep `MostRecentPolicy` (freshness; Open Food Facts wins the 33,736 shared barcodes) and amend MM-153's scenario; (b) switch the build to the reliability score (USDA Branded wins; the disagreement mark stays on the winner) and re-measure at the next build; (c) write both records into the pack and let `byBarcode` choose by score at scan time, which makes the app-side rule real. Impact: (b) and (c) flip what a scan shows for tens of thousands of products; (a) leaves the ticket's own score saying the shown record is the less reliable. Evidence either way is MM-51's: Open Food Facts newer in every case, USDA self-consistent 4.7 times as often, the fifty-product hand check still undone.
2. **Where the figures may appear** (P-3): in the register's rows as every figure does (recommended), or words only.
3. **Paging or "More results" in search now** (P-2), given FNDDS enlarges the generic block, or accept that a packaged food in hand is reached by scan or Saved.
4. **The −15 for an Open Food Facts record marked for a disagreement** (P-4): ticket (yes) or code (no).

## Verification
Nothing run. Source inspection of the files listed; no story rendered; no test executed. Requested of the edit owner: the pipeline and catalog tests for the proposed scenarios; an architecture test that no screen imports `sourceReliability`; the screen and controller tests for the five MM-384 additions; re-hash of inputs after the in-flight edits settle.

## Targeted challenges
None yet; this is the initial independent report.

---

**Verdict: build with the listed changes.** Both tickets stand within the owner's fixed constraints. Before merge: MM-383 states one barcode rule in the place it is actually decided (P-1) and gains criteria that test the new order rather than the old (P-5), says where the figures may and may not appear (P-3), and reconciles the −15 with the code (P-4); MM-384 adds the per-pack paused, failed, finished and offered-once scenarios and names the Cancel per download (P-7), and corrects the MM-267 citation (P-8). Owner decisions handed up: (1) the shared-barcode rule, (2) figures in the register, (3) paging now or later, (4) the Open Food Facts penalty.
