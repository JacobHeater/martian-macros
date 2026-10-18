# Brief: a third food source and a reliability score (MM-383); packs downloading together behind an icon (MM-384)

## Question
The product owner has asked, by message and without questions (2026-10-18): add an additional food data source, chosen
with the panel; derive a reliability score for the sources and order search by it, with the author deciding how a barcode
scan ranks on it; let the packs download concurrently; and change the download button to an icon. The chair has drafted
the design in the two tickets. Does each part stand, and what changes before it is built or merged?

## Why now
The owner wants it on main with the grade's replacement (MM-380, MM-382). The grade counts sugars, saturated fat and ten
vitamins and minerals, which the published packs do not carry, so the next pack build with a fuller source is what makes
the grades whole.

## Inputs
- `requirements/food-database/STORY.a-third-source-and-the-reliability-score.MM-383.md` (the source, the score, the ordering)
- `requirements/food-database/STORY.packs-download-together.MM-384.md` (the concurrent downloads and the icon)
- the prior run's integrations and micronutrients findings: `docs/agent-runs/mm380-proprietary-grade/findings/{integrations,micronutrients}.md`
- the pipeline: `tool/src/foodSource.ts`, `apps/mobile/src/foodPipeline/node/extract.sql`, `apps/mobile/src/foodPipeline/{PackBuilder,packEntryFor,packTerms,BuildReport,DropReason,ConflictPolicy,PreferredSourcePolicy,MostRecentPolicy}.ts`
- the catalog: `apps/mobile/src/foodCatalog/{FoodCatalog,SearchHit,TrustTier,CatalogFood,SqliteFoodPack}.ts`, `apps/mobile/src/format/{foodSourceLabel,trustTierLabel}.ts`, `apps/mobile/src/food/FoodTrustMark.tsx`, `apps/mobile/src/food/scan/BarcodeScanStep.tsx`
- the downloads: `apps/mobile/src/state/{PackDownloadController,PackDownloadState}.ts`, `apps/mobile/src/foodCatalog/download/{PackDownload,PackHttp,PackStore}.ts`, `apps/mobile/src/foodCatalog/download/native/{NativePackHttp,MmPacksApi}.ts`, `apps/mobile/android/app/src/main/java/com/martianmacros/martian_macros/demo/MmPacksPlugin.kt` (`httpGet` runs each request on its own thread)
- the screen: `apps/mobile/src/foodPacks/{FoodDatabaseScreen,AvailablePackCard,PackDownloadCard,DownloadStatusHost}.tsx`, `apps/mobile/src/ui/{DownloadStatusStrip,MmIconButton,MmButton}.tsx`, `apps/mobile/src/gallery/screens/Settings.stories.tsx` (FoodDatabase* stories), `apps/mobile/src/gallery/screens/storyPackHost.ts`
- the rules that bind: MM-42 (generic foods first; the person's own foods above the packs), MM-153 (three tiers, one quiet mark, "nothing here is a score"), MM-57 (licences), MM-267 (icon buttons carry a name), MM-108 (voice)

## Roles
- integrations: the FNDDS wiring as drafted (source entry, URL form, the third `UNION ALL` branch, the `survey_fndds_food`
  data type, portions, retired codes); the thrown error for an unknown source; the generic precedence policy on a normalised
  name (which source wins a tie, how `preparationLinks` is affected, whether FNDDS's "NFS" names collide); the coverage rows
  and whether a publish gate should fail the build; the terms text with USDA's citation; the reliability score's bases and
  modifiers as a provenance statement (are 95/90/80/65/40 defensible, is −15 for a disagreement right, do +3/+2 for stated
  fields reward the right thing); the owner's next commands.
- product: the search order by reliability against MM-42's "generic foods first" and the person's recents above the packs;
  what a person searching "Cheerios" or "oats" now sees; whether ordering by reliability over text match ever hides the
  food they typed; MM-153's "not a score" with a score that orders but is never shown; the barcode rule (most reliable
  record across packs) against the pipeline's own conflict policy; acceptance criteria.
- product-designer: the icon button on the pack card (its place, size, the card as a row), two download cards and two
  strip lines stacked, the three palettes, against the nearest siblings (MM-267's icon buttons, the Remove text button on the
  installed rows, the existing strip); whether a stacked strip steals too much of a small screen.
- ux-accessibility (the UX guard): the icon's accessible name, its 48 dp target, focus after pressing it, the strip lines'
  status roles when two run, Cancel per download, 200% text and 320 px, the state when one finishes while the other runs;
  PASS or BLOCK with the reasons. The chair builds first and renders the stories; the guard reads the renders.
- react-capacitor: the controller as a map of states in one cell (re-render cost, identity, `useCell` consumers), two
  `PackDownload`s sharing `PackStore` and `NativePackHttp` (the arrivals map keyed by request; partial files per pack id),
  memory of two concurrent base64 streams, cancel and discard per id, the `onInstalled` signal firing twice, the tests.

Omitted: nutrition, micronutrients, measurement (the grade's run covered the data questions), safety, coaching, training.

## Output
`findings/<role>.md` using `agents/templates/findings/role.md`, read-only, handed back to the chair as text, with a
verdict and the owner decisions handed up (the chair takes them and records "say if any is wrong"). The designer and the
UX guard review the renders the chair places under this run's folder once the build exists; until then they review the
source and the stories.
