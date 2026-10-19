---
id: MM-404
status: in-progress
component: persistence
related: [MM-231, MM-56, MM-403, MM-228]
---

# Task: The phone's storage on iOS: the database and the pack files

## Context
MM-231 made `SqlDatabase` the one thing the app knows about SQLite, with the
WebAssembly build for tests and the browser and, on Android, the `MmDb`
plugin: bundled SQLite with FTS5, one connection per database whose calls
run in order on one thread. MM-56 keeps the downloaded food packs apart from
the user's database, behind the `MmPacks` plugin: pack files with the names
the Flutter store used (`id.pack`, `id.json`, `id.version.part`, `id.new`,
`id.pack.old`), a streamed HTTP fetch with resume, SHA-256 of a partial
file, gzip unpacking and an atomic swap that keeps the old pack working when
the new one fails. The TypeScript adapters (`NativeSqlDatabase`,
`NativePackStore`, `NativePackHttp`) talk to the plugins by name, so iOS
needs the same two plugins and nothing above them changes.

## Decisions
Choices I made without asking (say if any is wrong):
- **The system SQLite, not a bundled one.** iOS's `libsqlite3` is built
  with FTS5 and the `unicode61` tokenizer the packs use (`remove_diacritics
  2`), so a pack built by the pipeline opens as it does on Android. If a
  future iOS drops FTS5, the pack is read through the WebAssembly build on
  the phone, as MM-231 allowed.
- **Where the files are.** The user's database is in
  `Library/Application Support/databases/<name>`, the packs in
  `Library/Application Support/food_packs/`, both excluded from iCloud and
  iTunes backup, as the Android shell's `allowBackup="false"` keeps health
  data on the device (MM-228). Nothing goes in `Documents`, which the Files
  app would show.
- **One serial queue per open database**, so the adapter's transactions hold
  as they do on Android: a `BEGIN` from the adapter keeps every other call
  waiting until `COMMIT` or `ROLLBACK`.
- **The same wire format.** A blob crosses the bridge as `{ $blob: base64 }`;
  a whole number larger than JavaScript holds exactly is refused, not
  rounded; a script is split on the semicolons between statements, never
  inside a string, a quoted name or a comment.
- **The one HTTP fetch is `URLSession`** with a `Range` header when
  resuming, redirects followed, 20 s to connect and 30 s between bytes, no
  cookies and no identifiers; the response's bytes arrive as
  `packHttpChunk` events in order, base64 in each. Gzip is unpacked with
  the system's zlib as a stream, so a 140 MB pack is never held in memory.

## Description
`MmDb` and `MmPacks` in Swift, in the iOS shell, so that on an iPhone the
app's database outlives the app, a pack downloads with resume, is checked,
unpacked, swapped in and searched, and a failed download leaves the installed
pack working.

## Acceptance Criteria
```gherkin
Scenario: The system of record is on the phone
  Given the app on the simulator, onboarded with a weigh-in
  When the app is ended and opened again
  Then the setup and the weigh-in are there, read from the native database

Scenario: The database is a file of the app's own
  Then it is under Library/Application Support, not Documents
  And the file is marked excluded from backup

Scenario: A pack installs
  Given the real manifest and a connection
  When Common foods is downloaded from Settings
  Then the file is checked against its SHA-256, unpacked, committed and answers a search

Scenario: A download resumes
  Given a download cancelled part way
  When it is resumed
  Then the request carries a Range header from the bytes kept
  And the pack installs

Scenario: A wrong checksum keeps the old pack
  Given an installed pack and a download whose checksum does not match
  Then the download is discarded and the installed pack still answers a search

Scenario: Values cross the bridge as stored
  Given text, whole numbers, decimals, nulls and blobs written through the plugin
  When they are read back
  Then each comes back as it was, and a blob arrives as base64
```

## Notes
- The contract suite of MM-231 runs against the WebAssembly adapter in the
  test runner; the Swift plugin is held to the same contract by the
  scenarios above on the simulator, recorded in Progress.
