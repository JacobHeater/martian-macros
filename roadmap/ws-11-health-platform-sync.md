# WS-11: Health platform sync

**Order** 11 · **Group** C · **State** not started · **Risk** high

## Summary
Read weigh-ins and related data from Health Connect on Android and, later,
HealthKit on iOS, behind an interface that can be faked on Windows.

## Why this is a workstream
Many users own a smart scale that already writes to their phone's health
store. Reading it makes the app's most important daily task, the weigh-in,
happen without the user. On first connection it can also read months of
history, giving a new user a settled trend on day one.

Like the training log, this maps closely onto its requirements folder. It is
a new package behind an interface, with platform code underneath and one deep
point of contact with existing code: how a day's weigh-in is stored and
chosen.

## Capability it unlocks
A user with a connected scale never types a weigh-in. Each reading shows
where it came from and can be overruled.

## Included
- A `HealthSource` interface and a fake that replays recorded histories.
- Rules for duplicates and for which source's reading counts.
- Import from Health Connect: weight, body fat, lean mass, height, workout
  sessions, menstruation, and steps for context.
- History backfill on first connection.
- Background sync.
- Writing nutrition back.
- Import from HealthKit.

## Excluded or deferred
- Using wearable "active calories" in the expenditure estimate: a founding
  decision. Their error is too large and the estimate does not need them.
- Using smart-scale body-fat readings: they are imported and stored here and
  interpreted by the body-fat estimate in WS-07 step 7.
- Showing steps: display-only context, a future phase noted in the recovery
  check-in ticket.

## Prerequisites
- **WS-01 (MM-61)** from step 2: sources and imported data change and add
  tables.

Step 1 needs nothing and can start at any time.

## Enables
No workstream is blocked on it. It supplies WS-07 step 7 with scale readings,
WS-07 step 3 with cycle days, and WS-13 with the list of health permissions
to declare.

## Packages and surfaces
- `packages/health_ingest/` (new)
- Android manifest, permissions and the Health Connect declaration
- iOS entitlements and purpose strings (step 7)
- `packages/data` (weigh-in source and precedence; imported observations)
- `apps/mobile` settings: a connection screen; source labels on Progress

## Risks
- **Platform risk is high and specific.** Health Connect's change tokens
  expire after about thirty days and need a full re-read; history beyond
  thirty days needs a separate permission; background work is restricted.
  HealthKit needs anchored queries and background delivery. Both stores
  review health permissions separately.
- **It cannot be fully built where development happens.** Android work is
  testable on the emulator only up to a point; HealthKit needs the Mac and a
  real device. The fake exists so that everything above the interface is
  built and tested on Windows.
- **It changes a table other workstreams read.** Today there is one weigh-in
  per calendar day, and saving again replaces it. With several sources there
  may be several readings a day and a rule for which counts. WS-07's display
  setting, events and jump explanation must all read the chosen reading
  through one accessor.
- **Privacy.** Health data is the most sensitive data in the app. It stays on
  the device; nothing here adds a network request.

## Sequence
1. **Interface and fake (MM-67).** M3. Record a few realistic histories: a
   daily weigher, a sporadic one, two scales that disagree, a duplicate
   written by two apps.
2. **Duplicates and source precedence (MM-71).** M3. The schema change to
   weigh-ins. Do it before any import exists, against the fake.
3. **Health Connect (MM-68).** M3. Agree the workout table with WS-10 before
   importing sessions.
4. **History backfill (MM-73).** M3.
5. **Background sync (MM-72).** M4.
6. **Write nutrition (MM-70).** M4. Needs entries with real nutrient data
   (WS-08 step 4) to be worth doing.
7. **HealthKit (MM-69).** M4. When development moves to the Mac. HealthKit's
   biological-sex value may pre-fill the onboarding question when it is male
   or female; other values are ignored and the user always confirms.

## Done enough to unblock others
MM-67 and MM-71 are done: weigh-ins carry a source, one rule chooses the
day's reading, and other workstreams read it through one accessor.

## Do not start before this
Nothing is blocked on it.

## Parallel with
WS-10 and WS-12 freely. WS-07 with the weigh-in accessor rule above. Step 1
can run during group A.

## Requirement sources
- Remaining: MM-67, MM-71, MM-68, MM-73, MM-72, MM-70, MM-69. Epic: MM-66.

## Notes for whoever builds it
- A backfilled history is many weigh-ins arriving at once. The trend filter
  handles gaps and outliers; check its outlier rule (reject beyond five
  standard deviations, accept after three rejections in a row) against a
  history that begins with a different scale.
- A connected scale changes the gap flow in WS-09: if weigh-ins kept arriving
  there was no gap in weigh-ins, only in food.
- The weight-display setting (WS-07 step 5) is at its most useful with a
  connected scale, since the phone then never has to show the number.
- Every permission requested here appears in the privacy policy and the
  stores' declarations (WS-13 step 1). Request only what a built feature
  reads.
- Health Connect has no sex field. On Android the app always asks.
