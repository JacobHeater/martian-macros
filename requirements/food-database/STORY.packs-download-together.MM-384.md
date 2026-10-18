---
id: MM-384
status: done
component: food-database
related: [MM-56, MM-321, MM-346, MM-383, MM-267, MM-352]
---

# Story: Food packs download together, each behind an icon

## Context
The Food database screen (MM-56) offers each pack the host lists with a "Download" or "Update" button, and one download runs
at a time: `PackDownloadController` holds a single state, and a second pack's button is off while the first runs. The host
lists two packs (Common foods, Barcode foods) and a third generic source is coming (MM-383).

## Decisions
The product owner's (2026-10-18, by message, no questions): "enable concurrent downloads of data sources. Currently, it only
allows downloading one at a time. And, change the download button to an icon."

Choices I made without asking (say if any is wrong), checked by the panel's designer, UX guard and React roles
(`docs/agent-runs/mm383-sources-and-downloads/`):
- **Every listed pack can be downloading at once.** The controller keeps one state per pack, keyed by the pack's id; starting
  a pack that is already running does nothing; cancel, discard and resume act on that pack alone. Each download is its own
  `PackDownload` over its own request; the native plugin already runs each request on its own thread.
- **The button is an icon**: the download icon, in a 48 dp icon button, with an accessible name that says what it does and to
  what ("Download Common foods", "Update Barcode foods, United States"), since an icon alone says nothing (MM-99's rule, applied by `MmIconButton`; its pressed state is MM-267's). It sits
  in the card's title row, as the exercise card's and a section header's actions sit, drawn as a solid Ember glyph (the icon
  form of a text button, a new `action` kind of `MmIconButton`), so the action to get a pack is at least as loud as the
  Remove beside an installed one (the designer's PD-1, PD-2). Each card says in a line what the pack is for ("Foods by
  name, for search." / "Packaged foods, for scanning a barcode.", the UX guard's F7), then its size and version. The host
  and mobile-data disclosure is said once above the cards when they share a host (PD-3).
- **A download card is headed by the pack's name**, with the phase and the bytes on its first line ("Downloading · 12 MB of
  46 MB"), so two running cards are told apart by their headings (PD-4); Resume and Try again are secondary, so two paused
  downloads never show two filled buttons (PD-12); a finished or failed pack's notice is a status, read once (the guard's F4).
- **The strip lines are 48 px each** with a hairline above and between, the safe-area inset once on their container (PD-5,
  PD-6, PD-7); what a screen reader hears moves in ten-percent steps and on each phase, not every percent (the guard's F1).
- **Focus never falls to the page** when the icon, a card's Cancel or a confirmed Remove takes its control away: it moves to a
  neighbour first (MM-379; the guard's F2).
- Declined or deferred (say if wanted): a snack when a download is cancelled from the strip on another screen (F5); one
  summary line for several downloads (D4); clearing a finished notice on leaving the screen (PD-8, D5); collapsing the tab
  bar's inset while the strip shows (PD-5's second half).
- **Progress shows per pack**: a card per download in the Download section, each with its own Cancel, Resume or Discard;
  the strip at the bottom of every screen shows one line per running download, each with its own Cancel, stacked.
- **A finished pack says so itself** and leaves the others' progress in place.

## Description
`PackDownloadController` holding a map of pack id to `PackDownloadState`, exposed as a cell of the list; `start`, `cancel(id)`,
`discard(id)`; the screen, the cards and the strip reading the list; the icon button on `AvailablePackCard`; the story host
offering two packs; stories for two downloads running and one finished.

## Acceptance Criteria
```gherkin
Scenario: Two packs at once
  Given the host lists Common foods and Barcode foods
  When both icons are pressed
  Then both download, each showing its own progress, and both install

Scenario: Cancel one, not the other
  Given two downloads running
  When the first's Cancel is pressed
  Then the first pauses, keeping what arrived, and the second keeps going

Scenario: The icon says what it does
  When a listed pack is offered
  Then its button is the download icon with the accessible name "Download <pack>" or "Update <pack>", in a 48 dp target

Scenario: The strip for each
  Given two downloads running
  Then every screen shows a strip line per download with its name, progress and Cancel

Scenario: Starting twice
  When a running pack's download is started again, or its icon is pressed twice before the first press has read the store
  Then one request is made and nothing else changes (not reachable from the screen once the pack runs: its icon is gone)

Scenario: One paused, the other running
  Given two downloads running
  When the first's Cancel is pressed
  Then its card says Paused with Resume and Discard for it alone, and the second's progress card and strip line stay

Scenario: One finishes while the other runs
  Then the finished pack is listed on this phone and its card says so, and the other's progress card and strip line stay

Scenario: Offered once
  Given a pack that is running or paused
  Then no download card is drawn for it below the Download header

Scenario: Each strip line is told apart
  Given two downloads running
  Then each strip line is its own status with the pack's name and its progress at ten-percent steps (the UX guard's F1), and each Cancel is named "Cancel downloading <pack>"

Scenario: Focus is never lost
  When a pack's icon, a card's Cancel or a confirmed Remove takes its control away
  Then focus is on a neighbouring control, never on the page (MM-379)

Scenario: A finished or failed pack is announced once
  Then its notice is a status, read once on arrival

Scenario: Removed
  Given a pack that downloaded and installed
  When it is removed
  Then its finished notice goes with it (MM-385)
```

## UI/UX
Stories in `apps/mobile/src/gallery/screens/Settings.stories.tsx`: FoodDatabaseAvailable (the icon on each card),
FoodDatabaseTwoDownloading (two cards and two strip lines), FoodDatabaseOneDone (one finished, one running),
DownloadUnderTheDashboard (two lines). Reviewed by the product designer and the UX guard before the build is merged.

## Progress
- Built 2026-10-18 on the React role's terms (`docs/agent-runs/mm383-sources-and-downloads/findings/react-capacitor.md`):
  `PackDownloadsController` with one cell per pack (`stateOf(id)`), the derived ordered list (`downloads`), a per-pack starting
  guard, `cancel(id)`, `discard(id)`, `forget(id)` (MM-385); `AppState.packsChanged` coalesced to one re-open per tick; the
  native adapter drops chunks for a response nobody reads; the icon button on `AvailablePackCard` ("Download <pack>" /
  "Update <pack>"); a card per download; a strip line per running download with "Cancel downloading <pack>"; the story host
  lists two packs with per-pack stalls; `InMemoryPackHttp.stallAt` / `dropAt` per address.
- Tests: `test/state/packDownloadController.test.ts` (two at once, cancel one, the double press, the per-pack cells, discard,
  the dropped connection), `test/settings/foodDatabase.test.tsx` (two packs behind their icons, two cards and two strip
  lines, Cancel one, the stale notice after Remove), the renamed Cancel, Resume, Discard and Try again names.
- Not done: MM-386 (the catalog re-open leak) and MM-387 (streaming to the file natively) stay open; the phone checklist
  carries both packs downloaded together on a release build with the WebView's memory watched.
