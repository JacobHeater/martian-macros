---
id: MM-108
status: proposed
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
- All user-facing text is currently written inline in screen files. Collecting it (Flutter's localization files) makes this checkable
  and is a prerequisite for ever translating the app. Worth doing as part of this.
