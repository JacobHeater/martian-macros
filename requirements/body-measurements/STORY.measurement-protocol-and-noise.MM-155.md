---
id: MM-155
status: proposed
component: body-measurements
related: [MM-154, MM-21, MM-32, MM-34, MM-93, MM-107, MM-129, MM-133, MM-140, MM-146, MM-156]
---

# Story: A waist measurement I can repeat, and an app that knows how noisy it is

## Context
See MM-154. MM-21 tells the user to "measure at the navel, relaxed; take three and enter the middle one; once a week is plenty", stores
one number, and shows the difference from the first entry ever.

Three problems:
- **The protocol asks for three readings and the screen takes one**, so the median is left to the user's arithmetic and goodwill.
- **The first-ever entry is a single noisy reading**, and every later figure is measured from it.
- **Nothing knows the measurement's error**, so nothing can say whether a change is real.

Evidence on error: for trained observers, the technical error of measurement for waist circumference is typically 0.5 to 1.5 cm and
inter-observer differences are larger (**moderate**; values vary a good deal by study and site). Self-measurement under home conditions
adds biological variation from food, bloating, posture and breathing; one to two centimeters between consecutive mornings is ordinary.
The specific thresholds below are **judgement** built on those figures and should be re-estimated from users' own repeat readings.

## Decisions
Choices I made without asking (say if any is wrong):
- **The protocol, shown with a drawing the first three times and available after**: first thing in the morning, after the bathroom,
  before eating; standing, relaxed, at the end of a normal breath out; tape level with the navel, snug and not pressing in; the same tape.
- **The entry takes three readings and stores their median**, with the three kept. A "quick entry" of one reading is allowed and is
  recorded as such.
- **The app keeps a noise figure per site, per user**: it starts at 1.0 cm for a median of three and 1.5 cm for a single reading, and
  after eight entries is replaced by the spread of that user's own repeat readings (the within-session spread of their triples, floored
  at 0.5 cm).
- **A change is reported only when it exceeds the noise of the difference** (about 1.4 times the noise figure, since two measurements are being compared: roughly 1.5 cm at
  the default for medians of three). Below that, the card says "no clear change", which is a result, not an absence.
- **Change is measured between smoothed values**, not single entries: the median of the last three weekly entries against the median of
  the three entries around the comparison date. "Since start" uses the median of the first three entries.
- **One function answers "has this measurement changed over this period?"** with: down, up, or no clear change, plus the figures. Every
  feature that asks the question uses it (MM-32, MM-129, MM-133, MM-140).
- **Weekly is the cadence**; the card shows when the next one is due and does not invite daily measuring. A second entry within three
  days replaces nothing and is stored, but the card notes that weekly is enough.
- **A chart**, in the shared visual language (MM-107): entries as dots, a smoothed line, and a band of the noise figure. Thirty-day
  views are useless for a weekly measure; this chart offers 90 days and a year.
- **Units and rounding**: shown to 0.5 cm or 0.25 in. Finer display would be false precision.

Where the experts disagreed:
- The physique expert preferred the narrowest point of the waist (more repeatable in lean people) to the navel (MM-21's choice). The
  safety and research experts noted that the navel site is the one used by the Navy body-fat method that MM-34 plans to use, and is
  easier to find on a larger abdomen. The navel stays; the instruction says so explicitly so that users do not drift between sites.
- The UX strategist objected to three readings as a barrier. Quick entry exists; the app says once what it costs (a wider noise figure,
  so changes take longer to show).

## Description
Extend the waist entry and store (three readings, a median, a quick flag), add the noise model and the shared change function in the
engine, replace the "change since first" summary, and add the chart.

## Acceptance Criteria
```gherkin
Scenario: Three readings
  When 91.5, 92.5 and 92.0 cm are entered
  Then 92.0 cm is stored as the measurement, with the three readings kept

Scenario: No clear change
  Given smoothed waist of 92.0 cm four weeks ago and 91.2 cm now, at the default noise
  Then the card says no clear change

Scenario: A clear change
  Given smoothed waist of 92.0 cm eight weeks ago and 89.5 cm now
  Then the card says down 2.5 cm

Scenario: The baseline is not one reading
  Given first entries of 94, 92 and 92.5 cm in the first three weeks
  Then "since start" is measured from 92.5 cm

Scenario: Personal noise
  Given ten entries whose three readings typically span 0.6 cm
  Then the noise figure used for this user is lower than the default, and smaller changes are reported

Scenario: One answer everywhere
  Given the recomp review and the stall diagnosis both ask whether waist changed over the same period
  Then they receive the same answer

Scenario: Quick entry
  Given entries made with a single reading
  Then the noise figure used is the single-reading one

Scenario: Rounding
  Then waist is displayed to the nearest 0.5 cm or 0.25 in
```

## Notes
- Priority: must-have before MM-32, MM-133 and MM-140's "masked" branch.
- MM-21 records that waist has no test at all (MM-93). This ticket's tests cover that gap for the new behavior; the old card's are still
  owed.
- A measurement reminder is in MM-146.
- For female profiles, waist also swings with the cycle (bloating). The cycle window (MM-19) could widen the noise for entries inside it,
  as it does for weight. Worth doing if cycle data exists; not required here.
