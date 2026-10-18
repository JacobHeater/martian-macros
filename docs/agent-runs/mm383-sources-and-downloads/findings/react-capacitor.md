# Review: react-capacitor

Handed back as text by the read-only role (Claude Code subagent, claude-fable-5-1) on 2026-10-18; written to this file by the chair verbatim.

## Scope and traceability
- Role: react-capacitor (React, Capacitor and application implementation), review lens only. Reviewer: Claude Code subagent for run `docs/agent-runs/mm383-sources-and-downloads/`, read-only, no commands run, no edits.
- Requirement files inspected: `requirements/food-database/STORY.packs-download-together.MM-384.md` (subject), `requirements/food-database/TASK.pack-download-and-update.MM-56.md` (the download as built and the owner's 2026-10-09 ruling on the status indicator with Cancel), `requirements/food-database/STORY.a-third-source-and-the-reliability-score.MM-383.md` (grep only, for the third pack; nothing in it changes the download).
- Brief: `docs/agent-runs/mm383-sources-and-downloads/brief.md`.
- Implementation inspected (all under `apps/mobile/`): `src/state/PackDownloadController.ts`, `src/state/PackDownloadState.ts`, `src/state/AppState.ts` (lines 356-433, 970-973), `src/state/Cell.ts`, `src/state/ValueCell.ts`, `src/state/DerivedCell.ts`, `src/state/StreamCell.ts`, `src/state/once.ts`, `src/state/PackManifestCheck.ts`, `src/app/useCell.ts`, `src/app/useLoaded.ts`, `src/app/App.tsx` (lines 79-90), `src/app/openAppServices.ts` (lines 42-78), `src/foodCatalog/download/{PackDownload,PackStore,PackListing,InMemoryPackHttp,InMemoryPackStore,openInstalledCatalog}.ts`, `src/foodCatalog/download/native/{NativePackHttp,NativePackStore,MmPacksApi,PackHttpChunk,mmPacks}.ts`, `src/lang/{bytesOfBase64,base64OfBytes}.ts`, `src/foodPacks/{FoodDatabaseScreen,AvailablePackCard,PackDownloadCard,DownloadStatusHost}.tsx`, `src/foodPacks/foodPacks.css`, `src/ui/{DownloadStatusStrip,MmIconButton}.tsx`, `src/ui/MmIconName.ts` (line 32), `src/gallery/screens/storyPackHost.ts`, `src/gallery/screens/Settings.stories.tsx` (lines 91-95, 354-562), `src/gallery/screens/StoryApp.tsx` (lines 91-96), `android/app/src/main/java/com/martianmacros/martian_macros/demo/MmPacksPlugin.kt`.
- Tests inspected: `test/state/packDownloadController.test.ts`, `test/settings/foodDatabase.test.tsx`, `test/foodCatalog/packDownload.test.ts`, `test/foodCatalog/nativePackHttp.test.ts`, `test/support/fixtureDownload.ts`.
- Commit: HEAD `42ce258` on branch `spike/proprietary-food-grade`; the working tree carries uncommitted MM-380/MM-382 changes. None of the files above is in the modified list except the two untracked tickets, so the download inputs are as committed at `42ce258`. Input SHA-256 hashes: not computed (no execution surface in this role); the chair should record them when persisting.

## Existing facts versus proposals

Repository facts (source inspection):
- One download at a time is enforced in `PackDownloadController.start` (`src/state/PackDownloadController.ts:35,37`) by a single `ValueCell<PackDownloadState>`; `cancel()` and `discard()` take no id (lines 70-80). `AvailablePackCard` disables its button while anything runs (`src/foodPacks/AvailablePackCard.tsx:17,30`).
- `PackDownload` is already one download of one listing with its own `PackResponse`, its own partial file keyed by `(id, version)` and its own staged file keyed by `id` (`src/foodCatalog/download/PackDownload.ts:95-158, 169-196`). Nothing in it is static or shared.
- `NativePackHttp` keeps arrivals per plugin request id (`src/foodCatalog/download/native/NativePackHttp.ts:20,27-41`) and the existing test `test/foodCatalog/nativePackHttp.test.ts:76-87` already proves two transfers keep their bytes apart. `MmPacksPlugin.httpGet` runs each request on its own thread with an id from one `AtomicInteger` (`MmPacksPlugin.kt:235-285`), reads in 256 KiB buffers and emits each as one base64 `packHttpChunk` event (lines 256-268). Partial files are `id.version.part`, staging `id.new`, install `id.pack` with `id.pack.old` during the swap (lines 41-44, 187-216), so two different pack ids never touch each other's files.
- `AppState.packsChanged()` bumps a counter that re-runs both `foodCatalog` and `installedPacks` (`src/state/AppState.ts:419-427, 970-973`); natively `services.catalog` is `once(() => openInstalledCatalog(packStore))` (`src/app/openAppServices.ts:76`), which re-opens every installed pack; `FoodCatalog` has no `close` (only the constructor at `src/foodCatalog/FoodCatalog.ts:29`), and `StreamCell.connect` drops the old subscription without closing what it produced (`src/state/StreamCell.ts:40-43, 62-75`). In stories and tests the catalog is `constant(...)` (`StoryApp.tsx:93-94`), so none of this runs there.
- `useCell` is `useSyncExternalStore(subscribe, () => cell.peek())` (`src/app/useCell.ts:5-9`); `Cell.set` notifies only when `Object.is` differs (`src/state/Cell.ts:78-83`); `DerivedCell` tracks whatever cells its compute reads and recomputes on read if a source moved (`src/state/DerivedCell.ts:39-41, 51-83`).
- `InMemoryPackHttp.dropAfterBytes` and `stallAfterBytes` apply to the next `get` whatever its address, then reset (`src/foodCatalog/download/InMemoryPackHttp.ts:54-57`). `storyPackHost` works around this by wrapping `get` to re-arm the stall for the pack URL (`storyPackHost.ts:85-91`). `fixtureDownload` hard-codes the listing id `'barcode_us'` and `packUrl` even when `packId` differs (`test/support/fixtureDownload.ts:8, 66-77`); the 'wrong id' test depends on that mismatch (`test/foodCatalog/packDownload.test.ts:150-153`).
- `DownloadStatusHost` wraps the whole navigator (`src/app/App.tsx:81-87`) and relies on stable `children` so screens do not re-render per progress tick (`DownloadStatusHost.tsx:21-23`).
- The pack sizes the host publishes: barcode 46.7 MB compressed, generic 0.76 MB (`MM-56.md:65`).

Approved requirements: MM-384's Decisions (one state per pack id, each its own `PackDownload`, icon button with a full accessible name, a card and a strip line per download, "a finished pack says so itself"). The owner fixed concurrency and the icon.

Proposals (mine, below): the per-pack cells plus a derived list rather than one list cell; a starting guard; coalesced `packsChanged`; per-address stall/drop in the fake; a second fixture listing; the test list; two follow-up tickets.

## Audit coverage
Mode: `change` (MM-384's redesign plus the behaviour it touches: controller, download engine, native adapter and plugin, screen, strip, stories, tests).
Inspected: everything listed under Scope. Not inspected: `MmDbPlugin.kt`/`NativeSqlDatabase` (the catalog reopen's native side), `SqliteFoodPack` beyond its `close`, Capacitor's own Android runtime (not in the tree as source), the Vite build, `unseen.json`. Cross-domain referrals: UX guard for the icon names and the stacked strip; integrations for the plugin-thread observation (F5); QA for the emulator checks requested under Verification. Evidence method: source inspection only; no test run, no render, no device. Two platform claims (Capacitor marshals plugin events to the WebView on the main thread in posting order; plugin methods execute on one background handler thread) are from my understanding of Capacitor Android and are labelled as unverified wherever used.

## Novice mobile experience
Not assigned to this role; the designer and UX guard cover it. One note for them from the source: a running pack is filtered out of the offered cards (`FoodDatabaseScreen.tsx:59-63`), so the "Starting twice" scenario is never reachable from the screen; it is a controller test.

## Findings

**F1. The cell shape: one list in one cell makes every card re-render on every chunk of every download; give each pack its own cell and derive the list.** Domain: react-capacitor. Class: design/usability improvement (performance and identity), with a concrete code shape. Severity: medium. Confidence: high (source).
- `useCell` subscribes to the whole cell (`useCell.ts:6-8`); a `Cell<readonly PackDownloadState[]>` replaced on each progress event re-renders `FoodDatabaseScreen`, every `AvailablePackCard`, every `PackDownloadCard` and `DownloadStatusHost` on each 256 KiB chunk of either download (about 183 chunks for the barcode pack natively; 1024-byte chunks in stories, `storyPackHost.ts:80`). The absolute cost is small, but an `AvailablePackCard` has no reason to re-render for another pack's byte count, and the ticket says cancel, discard and resume act on one pack alone, so the state should be addressable per pack.
- A `ReadonlyMap` as the cell value does not help: it must still be replaced per change for `Object.is` to notice (`Cell.ts:79`), and consumers would still subscribe to the whole thing. The choice that matters is per-id cells, not map versus list.
- Proposed shape:
```ts
export class PackDownloadController {
  /** Every download this session, in the order they were started; nothing idle. */
  readonly downloads: Cell<readonly PackDownloadState[]>;
  /** One pack's download as it is now; idle when it has none. The same cell for the same id. */
  stateOf(id: string): Cell<PackDownloadState>;
  /** Starts (or resumes) `listing`; nothing while that pack is already starting or running. Settles when its download ends. */
  start(listing: PackListing): Promise<void>;
  /** Stops that pack now, keeping what arrived. */
  cancel(id: string): void;
  /** Throws away what is kept of that pack and forgets it; nothing while it runs. */
  discard(id: string): Promise<void>;
}
```
  Internally: `cells = new Map<string, ValueCell<PackDownloadState>>()` created lazily by `stateOf` (so a card can subscribe before any start), `order = new ValueCell<readonly string[]>([])` replaced when a pack is first started or forgotten, `running = new Map<string, PackDownload>()`, `starting = new Set<string>()`, and `downloads = new DerivedCell(() => order.value.map((id) => this.cellOf(id).value).filter((s) => s.status !== 'idle'))`. `DerivedCell` tracks both `order` and each entry's cell by reading them (`DerivedCell.ts:58-73`), so a new pack appears without any extra wiring. Insertion order keeps the cards and strip lines from jumping.
- Consumers: `AvailablePackCard` reads `useCell(state.packDownload.stateOf(listing.id))`; `PackDownloadCard` takes an `id` prop and reads `stateOf(id)`; `FoodDatabaseScreen` and `DownloadStatusHost` read `downloads` (they need the whole set). `DownloadStatusHost` keeps its stable-children bailout; that is the one list consumer whose re-render per chunk already exists today.
- Acceptance: a test that `stateOf('x')` returns the same cell twice and reads idle for an unknown id; a test that a progress event on pack A does not change `stateOf('B').version`.

**F2. The "starting twice" guard must cover the `await store.partialBytes` gap, per id.** Domain: react-capacitor. Class: evidence-supported concern (a race the redesign must keep closed). Severity: medium. Confidence: high (source).
- Today the race is closed by checking `running` before and after the await (`PackDownloadController.ts:35-37`): two calls for the same listing in one tick both pass the first check, but the first to resume puts `running` synchronously, so the second's re-check returns. In the per-id version the same double check works only if it reads the same pack's cell; a `starting` set is clearer and is what the ticket's "starting a pack that is already running does nothing" needs for a double tap, which is the one way the screen can hit it (the icon is gone once the pack is running, `FoodDatabaseScreen.tsx:59-63`, so the only duplicate is two presses before the first `partialBytes` resolves).
- Acceptance test (controller): `void start(A); void start(A);` with no await between, then await both; exactly one request for A's URL in `http.requests`, A ends `done`. Starting A while A is running returns without a request.

**F3. Two `onInstalled` calls close together re-open the whole catalog twice, and each re-open leaks the previous pack handles natively.** Domain: react-capacitor (existing behaviour, made twice as frequent). Class: reproducible implementation defect by inspection (not run). Severity: medium (native database handles leaked per install or removal; the user's own DB is not touched). Confidence: medium-high; the leak follows from `FoodCatalog` having no `close` and `StreamCell.connect` only unsubscribing (`StreamCell.ts:40-43, 62-75`); not reproduced at runtime.
- With one download it leaks N open `SqliteFoodPack`s once per install or remove. With two installs it leaks twice and, if the first `openInstalledCatalog` is still in flight when the second `packsChanged` arrives, its result is discarded by `current=false` with its packs open and never closed.
- For MM-384: coalesce `packsChanged` in `AppState` (a microtask flag, e.g. `if (this.packsChangedQueued) return; queueMicrotask(() => { this.packsChangedQueued = false; this.packChanges.put(...) })`), so two installs landing in the same tick re-open once. Cheap and testable (two `packsChanged()` calls in one tick; a counting `Watched` for `catalog` in the test services sees one subscribe).
- Separately, a BUG ticket for the reopen leak (close the old catalog's packs when the stream reconnects), which exists today without MM-384 and is out of its scope. It needs a `FoodCatalog.close()` and a hook on the stream; I would not fold it into this story.

**F4. Memory and event-loop pressure: the native-to-JS stream has no backpressure, so a second download doubles an already unbounded JS-side buffer.** Domain: react-capacitor, referral to integrations. Class: evidence-supported domain concern (source inspection; no measurement). Severity: medium for the barcode pack on fast Wi-Fi; low for the published generic pack. Confidence: medium (the arithmetic is from the source; the actual drain rate is unmeasured).
- Per 256 KiB chunk: Kotlin base64 (about 350 KB string, `MmPacksPlugin.kt:265`) -> event into the WebView -> `bytesOfBase64` (`atob` plus a 262,144-iteration loop, `bytesOfBase64.ts:3-6`) -> `base64OfBytes` again (`base64OfBytes.ts:3-7`) -> `api.write` bridge call -> Kotlin decode and file write (`MmPacksPlugin.kt:112-118`). Roughly 1.5 MB of transient strings and two bridge crossings per 256 KiB of file, all on the JS main thread.
- The Kotlin thread reads at network speed and posts events regardless of consumption (`MmPacksPlugin.kt:255-269`); `NativePackHttp.arrived` pushes without bound (`NativePackHttp.ts:36-41`); the JS reader drains one chunk per awaited `sink.write` round trip (`PackDownload.ts:132-151`). If the network outpaces the drain, the backlog sits in the WebView heap as base64 strings: worst case the whole 46.7 MB pack as about 62 MB of strings. Two downloads share one JS thread, so each drains at roughly half the rate while two network threads fill. For the packs as published (46.7 MB plus 0.76 MB) the second stream is three chunks and the concern is close to moot; a fuller generic pack from MM-383 changes that.
- Also relevant: if Capacitor executes plugin methods on one background handler thread (my understanding; unverified here), `partialSha256` over 46.7 MB and `stage`'s gunzip to about 140 MB (`MmPacksPlugin.kt:131-150, 163-175`) block the other download's `write` calls for that time, growing its backlog meanwhile.
- Remediation: not in MM-384. (a) Bounded verification before merge or on the owner's phone checklist: both packs started together on a release build, Android Studio memory profiler on the WebView process, both end `done` with matching checksums (the checksum is also the proof that two interleaved event streams stayed in order). (b) A follow-up ticket for the real fix: the plugin writes the response straight into the partial file natively and emits only byte counts, so the data never crosses the bridge; it removes both base64 passes, the arrivals buffer and this finding. A smaller alternative is a pull-based `httpRead({ request, maxBytes })`, but it keeps the double base64.

**F5. `NativePackHttp` leaks an arrivals entry for every response that is aborted without being read.** Domain: react-capacitor. Class: reproducible implementation defect by inspection (not run). Severity: low (a few small objects per failed request). Confidence: high (source).
- `get` creates the entry (`NativePackHttp.ts:50`); it is deleted only in the body iterator's `finally` (line 69). `PackManifestCheck` aborts a non-200 answer without iterating (`PackManifestCheck.ts:32-35`), as does `PackDownload.fetch` (`PackDownload.ts:116-119`); the plugin then streams the error body and `done` into an entry nobody reads. `arrived` also recreates an entry for a request whose iterator has finished (line 37, via `at`), so a late `error` after `done` leaks one more. Concurrency does not worsen it; it is in the file the chair is changing, so a one-line fix (`abort` deletes the entry; `arrived` ignores unknown-and-finished requests via a small `closed` set) plus a test is cheap. Optional for MM-384; a BUG ticket otherwise.

**F6. A finished pack's "is on your phone" notice outlives the pack: Remove leaves it showing.** Domain: react-capacitor. Class: reproducible implementation defect by inspection (not run). Severity: low. Confidence: high (source).
- `PackDownloadCard` renders the notice whenever the status is `done` (`PackDownloadCard.tsx:62-66`); nothing resets a `done` state except a later `start` or `discard` (`PackDownloadController.ts:56, 74-80`); the screen's `remove` only calls the store and `packsChanged()` (`FoodDatabaseScreen.tsx:32-43`). After Remove the screen shows "Nothing downloaded yet" above "Barcode foods, United States is on your phone." The existing test stops short of asserting the notice is gone (`foodDatabase.test.tsx:192-196`). With two packs there can be two stale notices. The same applies to a `paused` entry whose partial `remove` deleted (`MmPacksPlugin.kt:224-226`): a Paused card offering to resume nothing.
- Remediation: `discard(id)` (or a `forget(id)`) also clears `done`, `paused` and `failed` entries, and the screen's `remove` calls it after the store's `remove`. BUG ticket plus a regression test in `foodDatabase.test.tsx`: download, Remove, confirm; the notice is absent.

**F7. The fake's stall and drop flags cannot describe two packs; the stories and tests need per-address flags.** Domain: react-capacitor (tests and stories). Class: documentation or requirement gap (test infrastructure the acceptance criteria need). Severity: medium (the two-pack scenarios are otherwise written with timing-dependent re-arming). Confidence: high.
- `stallAfterBytes`/`dropAfterBytes` are one-shot and address-blind (`InMemoryPackHttp.ts:54-57`). "Two downloading" needs both pack responses stalled; "one done, one running" needs one stalled and one whole; "cancel one, not the other" needs the second to keep going after the first's abort. Re-arming between two `get`s requires polling `http.requests.length`, which is fragile; `storyPackHost` already monkeypatches `get` for this (`storyPackHost.ts:85-91`).
- Proposal: add `stallAt(url, bytes)` and `dropAt(url, bytes)` (a `Map<string, number>` each, consumed on use, consulted before the global flags), keep the global one-shots for the existing tests, and replace the story host's `get` wrapper with `stallAt`. `storyPackHost` gains `packs` (ids to build; the second written with `packId: 'generic'` so the header check at `PackDownload.ts:186` passes), `stall` per id, and `installed` per id; note that two packs built from `FixturePack.entries` give the story catalog duplicate foods, which is fine for the Food database stories but not for search stories.
- `fixtureDownload` needs a `listingId`/`url` option rather than changing its hard-coded `'barcode_us'` and `packUrl` (`fixtureDownload.ts:66-72`), because the 'wrong id' test relies on the mismatch (`packDownload.test.ts:150-153`). For the screen test, make the second file small (say 10 MB) so its progress text ("3 MB of 10 MB") cannot be confused with the first's and the 46 MB fixture is not doubled in the jsdom heap (`InMemoryPackStore.writePartial` copies every chunk, `InMemoryPackStore.ts:77-79`).

**F8. Existing tests and story walkers that break on the rename and the second line.** Domain: react-capacitor. Class: documentation or requirement gap (expected churn, listed so nothing is missed). Severity: low. Confidence: high.
- `packDownloadController.test.ts:36, 41, 74, 88, 90` use the single `state`, `cancel()`, `discard()`.
- `foodDatabase.test.tsx:69, 106, 146, 187, 209` look for a button named exactly `Download`; line 232's regex `/^(Download|Update|Up to date)$/` and line 242's `'Update'` need the full names ("Download Barcode foods, United States", "Update Barcode foods, United States"); line 155's `querySelector` must become `querySelectorAll` once two lines can exist.
- `Settings.stories.tsx:476-479` (`pressAnywhere('Download')`) and the `FoodDatabasePaused` walker that takes the first `Cancel` (lines 499-501) need the new names; with two cards and two strip lines the "first Cancel" is ambiguous, so address the card by its pack's title.

No other findings within this scope and method.

## Sources and evidence
None consulted. All claims are from the repository files cited above. The two Capacitor runtime statements (main-thread event marshalling in posting order; single plugin handler thread) are from memory, not from a consulted source, and are marked unverified; nothing in this report depends on them except the second paragraph of F4, which asks for a device check rather than asserting.

## Research
Status: unnecessary, by the chair's instruction ("No web research needed"), and because the questions are answered by the repository's own code. Execution surface: workspace read only (Read, Grep, Glob); web tools present but not used. Capability gap noted: the Capacitor Android runtime is not in the tree as source, so the thread-model claims in F4 could not be checked against code; the bounded request is the emulator run under Verification, not a web search.

## Confidence and limitations
High on F1, F2, F5, F6, F7, F8 (direct source). Medium on F3 and F4: both follow from the code, but neither was run, and F4's severity depends on network speed against the bridge's drain rate, which I could not measure. No render or device evidence was available or expected for this role. Self-review only; no second reviewer. Hashes not computed.

## Acceptance criteria and edge cases
Existing criteria traced:
- "Two packs at once": no test today; needs controller test 2 and screen test 10 below.
- "Cancel one, not the other": controller test 3, screen test 10.
- "The icon says what it does": `MmIconButton` already renders `aria-label` and a 48 by 48 target (`MmIconButton.tsx:18-30`) and the `download` icon exists (`MmIconName.ts:32`); screen test 9.
- "The strip for each": screen test 11.
- "Starting twice": controller test 6 (not reachable from the screen; say so in the ticket).

Tests that must exist (proposed):
1. Controller: nothing fetched until started; `downloads.peek()` is `[]`.
2. Controller: A and B started together both end `done`; `installedPacks` lists both ids; `http.requests` holds both URLs.
3. Controller: `stallAt(A, third)`; start A and B; B ends `done` while A is `running`; `cancel(A)` -> A `paused` with `keptBytes === third`, B still `done`; `start(A)` -> `done`, last request for A's URL has `rangeStart === third`.
4. Controller: both stalled and cancelled; `discard(A)` -> A absent from `downloads`, `store.partialBytes(A)` is 0, B still `paused` with its bytes.
5. Controller: `dropAt(A, 1024)`; A `failed`/`connection`/kept 1024 while B ends `done`; `start(A)` finishes.
6. Controller: double start in one tick makes one request (F2); start while running makes none.
7. Controller: `stateOf` identity and idle for unknown ids; A's progress leaves B's cell version unchanged (F1).
8. AppState: two `packsChanged()` in one tick subscribe the catalog once (F3), if coalescing is built.
9. Screen: two icon buttons with their full names; pressing one leaves the other's icon in place and enabled.
10. Screen: both pressed -> two Downloading cards with distinct progress text; Cancel on the first card -> first Paused, second still Downloading.
11. Screen: two strip lines with `role="status"` on the Dashboard; cancelling one leaves one.
12. Screen: one finishes while the other runs -> the finished notice beside the running card; the finished pack under "On this phone" and not offered again.
13. Screen: F6 regression (notice gone after Remove).
14. `nativePackHttp.test.ts`: aborting one transfer leaves the other's chunks untouched; if F5 is fixed, a late chunk for an aborted request leaves no entry.
15. Stories: `FoodDatabaseTwoDownloading`, `FoodDatabaseOneDone`, `DownloadUnderTheDashboard` with two lines, `FoodDatabaseAvailable` with the icons, as the ticket lists; `npm run unseen` will demand them.

Edge cases: a pack whose partial file exceeds the listing's total after a version bump is already handled per `(id, version)` (`PackDownload.ts:97-100`); cancel during `checking`/`installing` is honoured between phases (`PackDownload.ts:84-87`) and the strip already hides Cancel then (`DownloadStatusHost.tsx:30`), which per-pack keeps; a Remove of an installed pack while its update is paused (F6); day rollover and app-to-front have no bearing on the controller (no clock reads).

## Dependencies
- ux-accessibility: the accessible names and two `role="status"` lines announcing per chunk (the strip already announces the percentage per update, `DownloadStatusStrip.tsx:22-24`; two lines double the announcements). Challenge: should the live region be `aria-live="polite"` text that updates less often than every chunk?
- product-designer: the card as a row with the icon at the end; the stacked strip.
- integrations: F4 and F5 are the native seam; the follow-up "stream to file natively" ticket changes `MmPacksApi` and the `PackHttp`/`PackStore` split and should be theirs to shape.
- QA: the emulator checks under Verification.
- Tickets: MM-384 (subject), MM-56 (the engine), MM-267 (icon names), MM-321 (every state has a story), MM-383 (a third pack makes "two at once" three).

## Safety concerns
None found in this scope. Privacy: two concurrent requests reveal the same thing to the same host as one (`AvailablePackCard.tsx:24-27`); no new data leaves the phone. Not clinical clearance.

## Unresolved product decisions
1. F4: accept the unbounded JS-side buffering for now (verify on a device) and ticket the native-write follow-up, or make the follow-up part of this delivery? Impact: memory on the phone during two large downloads; delivery time. Authority: product owner. My recommendation: ticket it, verify on device, do not block MM-384.
2. F6: should a finished pack's notice (and a paused or failed entry) clear when the pack is removed, and should `done` notices clear when the screen is left? Authority: product owner. My recommendation: clear on Remove at least (it is a bug); leaving the screen is a design call.
3. Should one pack's failure ever stop the other? The ticket's Decisions say each acts alone; confirm, since the strip's wording and the cards assume independence. Authority: product owner. My recommendation: independent.

## Verification
Nothing executed (read-only role). Recommended for the edit owner: `npx vitest run test/state/packDownloadController.test.ts test/settings/foodDatabase.test.tsx test/foodCatalog` inside `apps/mobile`, then `mm check`. Device (release build, per AGENTS.md's native-plugin rule): start both packs together; both end `done` with checksums matching (ordering proof for F4's unverified claim); cancel one from the strip while the other runs; memory profile of the WebView process during the barcode download alone and with the second pack (F4); confirm the catalog search works after two installs (F3's double reopen).

## Targeted challenges
None yet; this is the initial independent report.

---

## Verdict
**Build with the listed changes.** The draft stands: concurrency is feasible with no change to `PackDownload`, the native adapter or the plugin, because every piece is already keyed per request or per `(id, version)`. The changes before building: per-pack cells with a derived ordered list and `stateOf(id)` instead of one list cell (F1); a per-id starting guard with a double-tap test (F2); coalesced `packsChanged` (F3); per-address `stallAt`/`dropAt` in `InMemoryPackHttp`, a second fixture listing and a two-pack `storyPackHost` (F7); the test and story renames (F8); a BUG ticket and regression test for the stale notice after Remove (F6), with `discard(id)` clearing finished entries; and two follow-up tickets (the catalog reopen leak, F3; the native stream-to-file so the bytes never cross the bridge, F4) plus the device checks under Verification. F5 is a one-line fix in a file the chair is already editing; take it or ticket it.

## Owner decisions handed up
1. Accept the unbounded native-to-JS buffering for now, with a device check, and ticket the native stream-to-file follow-up rather than build it in MM-384 (my recommendation: yes).
2. Clear a finished, paused or failed pack's card when the pack is removed (my recommendation: yes; it is a bug today); whether `done` notices clear on leaving the screen is a design call.
3. Confirm that one pack's failure or cancel never affects the other (my recommendation: independent, as drafted).
