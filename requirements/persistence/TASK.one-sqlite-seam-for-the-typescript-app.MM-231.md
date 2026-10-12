---
id: MM-231
status: in-progress
component: persistence
related: [MM-228, MM-230, MM-59, MM-160, MM-41, MM-42]
---

# Task: One SQLite seam for the TypeScript app

## Context
Part 3 of MM-228, and what the rest of MM-230 waits on. Four of the Dart
packages still to convert read or write SQLite: the food catalog (a pack is a
SQLite file with full-text search), the data layer (Drift), the food pipeline
that builds packs, and the fixtures that seed a demo. In Dart they called
SQLite directly and synchronously. In the new app SQLite on the phone is
reached through a native plugin, which is asynchronous, and the same code has
to run in a test on any machine and in a browser for review.

## Decisions
Choices I made without asking (say if any is wrong):
- **One interface, `SqlDatabase`, is the only thing the app's code knows
  about SQLite**: select rows, execute a statement, run a transaction, close.
  Every call returns a promise. No package of ours imports a SQLite library
  except the adapters.
- **Everything that reads a pack or the database becomes asynchronous.**
  `CatalogSearch.search` and its siblings return promises. This is the one
  change to the interfaces carried over from Dart, and it is forced: a plugin
  call cannot be made synchronous.
- **Two adapters, one contract suite** (as MM-160 requires of every
  integration point):
  - **The official SQLite WebAssembly build** for tests and for the app in a
    browser. In memory only: nothing is written to browser storage, so the
    browser is for development and review and can lose nothing of anyone's.
  - **A native SQLite plugin on the phone**, which is where the system of
    record lives.
- **The pack format does not change.** Packs built by the Dart pipeline stay
  readable, byte for byte, so the food data already built is not thrown away.
- **The schema starts again at version 1** (MM-228): the app is unreleased,
  so there is nothing installed to migrate. The Drift schema's 31 versions of
  history are not carried over; its current shape is.

## Description
The seam, its two adapters, the contract suite both pass, and then, on top of
it: the food catalog, the repositories of the data layer with their in-memory
fixtures and contract tests, the food pipeline, and the demo fixtures.

## Acceptance Criteria
```gherkin
Scenario: One seam
  Then no file outside the two adapters imports a SQLite library

Scenario: Both adapters behave the same
  Given the contract suite for SqlDatabase
  When it is run against the WebAssembly adapter and against the plugin adapter
  Then both pass

Scenario: Full-text search works on both
  Given a food pack built by the Dart pipeline
  When it is opened through each adapter and searched
  Then the same foods come back in the same order as the Dart catalog gives

Scenario: Nothing in browser storage
  Given the app open in a browser
  When food is logged and the page is reloaded
  Then nothing was written to localStorage, IndexedDB or the origin's private files

Scenario: The system of record is on the phone
  Given the app on a phone
  When food is logged and the app is closed and reopened
  Then the entry is there, read from the native database
```

## Progress
**Measured on 2026-10-12, before any code:**
- **Node's own SQLite cannot be the test adapter.** `node:sqlite` in Node
  23.11 (SQLite 3.49.1) is built without FTS5: creating the pack's search
  table fails with "no such module: fts5".
- **The official SQLite WebAssembly build can.**
  `@sqlite.org/sqlite-wasm` 3.53.4 was run in Node: it created the pack's
  FTS5 table with the pack's own tokenizer settings, answered a prefix search
  ranked by `bm25`, read and wrote `PRAGMA user_version`, and exported the
  database as bytes. The package is 3 MB.

**Not verified:**
- That a native plugin's SQLite has FTS5 on Android. The pack depends on it.
  If it does not, the pack is read through the WebAssembly build on the phone
  too (a pack is read-only and holds no user data), and only the user's
  database goes through the plugin.
- How long a search takes through a plugin call, against the synchronous call
  the Flutter app makes while the user types.
- Anything on iOS.

**Built (2026-10-12):**
- `apps/web/src/sql/`: `SqlDatabase` (select, execute, a script of
  statements, a transaction, close), `SqlFailure`, and the WebAssembly
  adapter in `sql/wasm/`, the only folder that may import the SQLite
  library. A test fails if any other file does.
- `apps/web/test/contracts/sqlDatabaseContract.ts`: 14 tests any adapter
  must pass. Among them: values of every kind come back as stored;
  parameters are never read as SQL; a transaction that throws is undone and
  rethrows what was thrown; a call made while a transaction is open waits
  for it; calls run in the order made; full-text search with the pack's
  tokenizer settings; and nothing works after close.
- The contract found a defect in the adapter as first written: an error
  thrown by a transaction's own work came back wrapped as a SQLite failure.
  Fixed before it was committed.
- The WebAssembly adapter can also write a database out as the bytes of a
  file and open one from bytes, which is how a pack is built and read
  off the phone.

**Not built:** the native adapter; anything on top of the seam.

## Notes
- The food catalog is the first thing built on it, because it reads and
  never writes.
