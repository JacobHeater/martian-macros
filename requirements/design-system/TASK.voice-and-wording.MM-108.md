---
id: MM-108
status: done
component: design-system
related: [MM-101, MM-11, MM-41, MM-92, MM-96, MM-106]
---

# Task: How the app speaks

## Context
See MM-101. Words are most of this app's interface: explanations of why a number moved, cautions, what the coach is doing. A diet app's
wording can also do harm, by shaming, by praising restriction, or by sounding more certain than it is. Some rules already exist scattered
across tickets (never reward a deficit, MM-92; no medical claims, MM-96). They belong in one place.

## Decisions
Choices I made without asking (say if any is wrong):
- **Plain and specific.** Say what happened and what it means: "Targets went down 80 kcal because your measured expenditure is lower than
  the starting estimate." Not "We've optimized your plan!"
- **State, do not judge.** "340 kcal over" is a fact. No "oops", no "cheat", no "bad day", no red. Equally, no praise for eating under
  target.
- **Honest about uncertainty.** An estimate is called an estimate and shown with its range. "About", "roughly" and "±" are used when true
  and not otherwise.
- **Explain the body, briefly.** When weight jumps, say why that is normal ("Daily jumps inside the band are water, not fat").
- **Never moralize food.** No "good", "bad", "clean", "junk" or "guilt-free". No "earn" or "burn off".
- **The user is an adult making their own decisions.** The app recommends and explains; it does not scold or nag.
- **Words for things**, used consistently: "trend weight" (never "true weight"); "energy expenditure" in explanations and "metabolism" as
  the friendly card title; "targets" (not "goals") for daily numbers and "goal" for fat loss, recomp, lean gain or maintenance; "weigh-in";
  "check-in" for the weekly target review; "calibration" for the first fourteen days.
- **Units and numbers**: thousands separators; a space before the unit ("2,473 kcal", "172 g"); a true minus sign for negatives; "lb" not
  "lbs".
- **Safety wording is reviewed** by the professional doing MM-29, not improvised.

## Description
A short written guide in the repository, a glossary of the fixed terms, and a pass over existing text to bring it into line.

## Acceptance Criteria
```gherkin
Scenario: No judgement
  Then no text in the app calls a food, a day or the user good or bad, and nothing praises eating below target

Scenario: Consistent terms
  Then each glossary term is used for one thing only, and that thing is called nothing else

Scenario: Uncertainty shown
  Then every estimate the app shows is labelled as one, with its range or uncertainty

Scenario: Checked automatically where possible
  Given a list of banned words
  Then a test fails if any appears in the app's text
```

## Notes
- **Grade letters are allowed** (MM-371, 2026-10-17): a food's grade from A+ to D- (MM-370) is the app's own nutrient-density
  measure (MM-380), not a moral word; "Grade D" may be said, "junk" may not. The banned-word test lets letters through and still fails on every banned word.
- All user-facing text is currently written inline in screen files. Collecting it (Flutter's localization files) makes this checkable
  and is a prerequisite for ever translating the app. Worth doing as part of this.

## Progress
- Built: the written guide and glossary (`design/voice-and-wording.md`) and
  `apps/mobile/test/voice.test.ts` (carried over from `voice_test.dart`), which
  reads every string the app shows and fails on a banned word (good, bad,
  clean, junk, guilt, cheat, oops, earn, burn off, lbs, true weight, and
  others), on filler (MM-401), and, since 2026-10-21, on a name the glossary
  says a term is never called: "real weight", "TDEE" in text, "setup period",
  "plan type" ("Consistent terms", where a test can tell it from code).
- "No judgement" and "Checked automatically" are covered by that test.
  "Uncertainty shown" and the rest of "Consistent terms" are kept by review
  against the guide, as the guide says.
- Review fixes (2026-10-21, PR #286): the test had passed over every
  all-lower-case quoted string, so "a bad day" or "your real weight" would
  never have been seen. Now only a string with no space, a path, or a class
  list (every word hyphenated) is passed over, and a self-test feeds it both
  phrases. Widening it found no new hits in `apps/mobile/src`. The grade-letter
  test uses the test's own banned-word pattern. "Calorie, protein, daily or
  macro goals" joined the never-called list (no hits).
- Stays review-checked, not tested: "Uncertainty shown"; the rest of
  "Consistent terms" (a term used for a second thing, or a new name for a
  term); rules 1, 4 and 6; "no praise for eating under target"; number format
  beyond "lbs". The guide's "Not checked by a test" lists them.
- Pass over existing text (2026-10-21), against "Uncertainty shown" and
  "Consistent terms", by grepping `apps/mobile/src` for every estimate shown
  (expenditure, trend weight, body fat, resting energy, estimated max, meal
  estimates, projected end, pace) and for each glossary term and its
  never-called names. Found and fixed: on Coach, the Body section's trend
  weight had no uncertainty (it now says "Probably between … and …", in words as Coach states every range, the two-sigma
  band the trend chart draws) and resting energy (BMR, from the Mifflin-St Jeor
  equation) was a bare number (now "About … kcal", with what it is estimated
  from); the strength card and session history said "e1RM", a third name
  for the estimated max (now "estimated max"). Already in line: expenditure
  (a range, or "give or take"), body fat (a range, or "~" for the person's own
  figure), meal estimates ("about"), projected end ("About"), pace ("About …
  so far" until confidence is good), the estimated max ("a comparison, not a
  real max"). Left as is: the Dashboard's weight row and the Progress hero show
  the trend weight without "±"; both are labelled "Trend", the hero sits on the
  chart with its band, and the row opens it. Terms were otherwise consistent:
  no "goals" for targets, no "update" or "reset" for a check-in, no "trial",
  no "score" or "reading" for an estimate, "password" only for the phone's
  lock in the terms.
- Not taken up: moving every string into localization files. It was a note
  ("worth doing as part of this"), not an acceptance criterion, written for
  the Flutter app while four screens existed. The test reads the strings where
  they are, which gives the checkability the note wanted; no translation is
  planned. The guide records this. If the owner wants translation, that is a
  new ticket.
- Done (2026-10-21). Not run locally; CI validates.
