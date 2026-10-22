# WS-07: Progress and measurement

**Order** 7 · **Group** B · **State** partly built · **Risk** medium

## Summary
Make waist, weight context and the scale display trustworthy enough for the
coach to reason from and for the user to believe.

## Why this is a workstream
The Progress screen has a weigh-in card, the trend chart with its uncertainty
band, and a waist card that stores one number and shows the change since the
first entry. The waist card has no test and was never exercised on a device.

A growing list of coaching features asks one question of this data: *has
waist changed by more than its noise?* The recomp signal, the recomp review,
the "masked" branch of the stall diagnosis and the fat-heavy-gain notice all
depend on the answer. Nothing can answer it today. And the trend itself has
blind spots the user could fill in: a period, a course of creatine, a week of
flu.

These tickets come from three folders (weight trend, body measurements, coach
insights) and are one workstream because they share the Progress screen, the
observation types and the inputs to `analyze`.

## Capability it unlocks
One noise-aware answer to "did this measurement change"; a trend that can be
told about events; a display that can hide the number without blinding the
coach.

## Included
- A waist protocol, three-reading entry, a per-user noise figure, a chart,
  and one shared change function.
- Weight events: creatine start and stop, illness, travel, and similar.
- Logging period days (the engine half is built).
- An explanation of a scale jump from the last 48 hours of the user's data.
- A weight-display setting: everything, trend only, hidden.
- More measurement sites.
- A body-fat range from the user's own measurements.
- Progress photos (a future phase).

## Excluded or deferred
- The trend filter's own defects: WS-02.
- Strength as a progress measure: WS-10.
- The features that *consume* the change function: WS-09.
- Weigh-ins arriving from a health platform: WS-11.

## Prerequisites
- **WS-01 (MM-61)** for every step: each adds a table or columns.
- **WS-03 (MM-104, MM-108, MM-107)**: charts and cards.
- **WS-02 step 2 (MM-131)** for step 2 here: shared mechanism.
- **WS-02 step 7 (MM-35)** for step 7 here: which model estimates body fat.

## Enables
WS-09 steps 3 and 6 (stall diagnosis, recomp review and signal) and step 8
(phase planning needs the body-fat estimate).

## Packages and surfaces
- `apps/mobile/src/progress/`
- `apps/mobile/src/domain/WeightObservation.ts and its neighbours` (measurements, events, cycle
  days)
- `apps/mobile/src/engine` (new: measurement noise and change; event handling in the
  trend filter; the jump-explanation function)
- `apps/mobile/src/data` (measurements, events, cycle days, display setting)
- `apps/mobile/test/engine/support/SyntheticUser.ts` (events)

## Risks
- **Thresholds without data.** The waist noise figures (1.0 cm for a median
  of three, 1.5 cm for one reading) are judgments from published measurement
  error, not from this app's users. Build the per-user estimate the ticket
  specifies so the defaults matter less over time.
- **Events as excuses.** A user could mark an event every few days to explain
  away a real trend. The ticket caps their effect at two passing events in
  fourteen days; test that cap.
- **The Progress screen is shared.** WS-10 adds strength cards and WS-11 adds
  source labels. Expose components; do not let three workstreams edit one
  382-line file.
- **Weigh-in storage changes underneath.** WS-11 turns one reading a day into
  several sourced readings with a precedence rule. Read the chosen reading
  through one accessor from the start.

## Sequence
1. **Measurement protocol and noise (MM-155).** M2. The gate. If step 6 is
   expected within a few months, build the table generic by site now, so
   waist migrates once, not twice.
2. **Weight events (MM-136).** M2. Engine mechanism shared with WS-02 step 2;
   implemented with schema v10, event entry/chart marks, onboarding creatine
   capture and deterministic lasting/transient-event simulations. Final
   screenshot/CI validation is in progress.
3. **Period days (MM-20).** M2. The engine already widens noise when given
   flow days; this supplies them. Female profiles only.
4. **Explain a weight jump (MM-142).** M2. Works with typed macros; better
   once entries carry sodium (WS-08 step 4) and workouts exist (WS-10).
5. **Weight display setting (MM-118).** M4. Touches every component that
   shows weight; cheap if WS-03's chart components have one switch for raw
   readings. Done 2026-10-21: Everything, Trend only or Hidden (schema 24),
   carried by `Fmt`, with the pace in words when Hidden.
6. **More sites (MM-156).** M4. Done 2026-10-21: one store by site (schema 23, the
   waist moved in), the measuring session, the sites and limb side, the
   suggestion offered once, per-site charts and the limb facts.
7. **Body-fat range (MM-34, MM-501, MM-502).** M4. MM-34 is built: the
   formula joined by the waist, shown as a range. The Navy method (MM-501)
   needs neck and hip from step 6; scale readings with a per-device bias
   (MM-502) need WS-11's ingest and the model decision. MM-502 done
   2026-10-21: stored scale readings join the range weekly, each scale's
   offset learned against the earlier ones. MM-501 done 2026-10-21: the
   Navy tape method joins once neck (and hip) are measured.
8. **Progress photos (MM-157).** M4. Done 2026-10-21: a private photo store in a
   database file of its own, a guided camera with the last pose as an overlay,
   side-by-side comparison, the device lock and a private screen, and photo
   backup only when switched on. Phone checks owed. MM-560 (2026-10-22): a
   camera that does not open says why, not always "allow it in settings".

## Done enough to unblock others
MM-155 is done: every caller that asks whether waist changed over a period
gets "down", "up" or "no clear change" from one engine function.

## Do not start before this
WS-09 step 3's masked-stall branch and all of WS-09 step 6.

## Parallel with
WS-05, WS-06 and WS-08 (different screens and types; shared schema lane).
WS-10 and WS-11 once they start, with the Progress screen and weigh-in
storage rules above.

## Requirement sources
- Built: MM-16, MM-17 (weigh-in, trend chart); MM-21 (waist, built but
  unverified); MM-34 (body-fat range from the waist).
- Remaining: MM-155, MM-136, MM-20, MM-142.
- Built 2026-10-21: MM-157 (progress photos, kept on the phone; phone checks owed), MM-502 (smart-scale
  readings in the body-fat range, each scale's own bias), MM-156 (more measurement sites; the waist moved
  into one store by site), MM-501 (the Navy tape method in the body-fat range),
  MM-118 (the weight display: Everything, Trend only or Hidden).
  Epics: MM-15, MM-154.

## Notes for whoever builds it
- The existing waist card has no test at all. Step 1 replaces most of it;
  cover the replacement, and note in the built ticket what now verifies it.
- "Since start" is measured from the median of the first three entries, not
  the first entry. Existing users have one-reading entries; treat them as
  quick entries with the wider noise figure.
- The creatine question is asked once in onboarding's training step and
  stored as a setting with a start date. The app asks because creatine moves
  the scale; it never recommends it.
- The jump explanation is shown when the user looks at a reading. It is not
  an insight and is never pushed.
- Cycle logging, the cycle question in the recovery check-in and the
  what-to-expect point about periods are shown to female profiles only, by
  the same rule onboarding already uses.
- A limb measurement cannot distinguish muscle from fat. Wording states
  facts ("upper arm up 1.0 cm while waist held") and makes no claim about
  tissue.
