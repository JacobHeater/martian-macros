---
id: MM-553
status: done
component: coach-insights
related: [MM-256, MM-299, MM-251, MM-253, MM-286, MM-318]
---

# Story: Coach's cautions in one "Heads up" section, folded

## Context
On Coach each health-check caution (`snapshot.policy.cautions`, above the hero, for example "Sleep disorders change how a
deficit works…") and each flag on the targets (`current.targets.flags`, under the hero, for example "Your deficit is capped
at 35%…" and "Your calories are at the lowest level…") was its own full caution notice titled "Heads up". Three or four of
them filled the first screen.

The product owner, 2026-10-22, looking at Coach on the phone: "These heads ups are taking up too much vertical space. They
need to be grouped under a general heads up section and collapsible."

This overrides MM-256's rule (and `design/screen-direction.md`, "Outside the rules") that the policy cautions sit above the
hero in full and the target flags are full notices under it. The pause banner, the under-eating notice, the training-lapse
notice and the relief offer stay above the hero in full, as before.

## Description
As someone reading Coach, I want its cautions grouped in one folded "Heads up" section, so that the screen is not filled with
them and I can still read each one in full when I open it.

## Decisions
The owner's (2026-10-22):
- **One "Heads up" section** for the health check's cautions and the target flags, **collapsible**.

Choices made in building it (say if any is wrong):
- **Placed directly under the calorie hero.** The health check's cautions come first, then the target flags, each in the
  order it was drawn before. With no targets yet the section still draws the cautions, where the hero would be.
- **Folded by default.** The folded line is the title "Heads up", the caution icon (`warning`) in the caution colour, and
  "N notes about your targets" ("1 note…" for one). The caution mark stays visible folded so it never reads as routine.
- **Opened, each note is said in full**, as a paragraph under the header, without a "Heads up" word of its own: the header
  already carries it.
- **No notes, nothing drawn**: an empty section draws no fold (MM-389).
- **The open or closed choice is kept for the session only**, through the app's in-memory folds (`remember`, MM-286); no
  schema change.
- **Like its siblings (rule 9):** built with `MmSection` collapsible, as Coach's "Monthly reports" (`ReportsCard`) and "How
  you are holding up" (`RecoveryCard`) fold to one line. `MmSection` takes a new `kind="caution"`, which colours its icon
  with the caution token; a component takes meaning, never a colour.
- **The Dashboard is unchanged**: neither the cautions nor the target flags are drawn there, so there is nothing to group.
- **Left as they are:** `UnderEatingNotice`, `TrainingLapseNotice`, `ReliefOfferCard`, `PauseBanner`, the goal body fat
  warning, and the plain notes (the diet break's rebound, the weight-loss medication's training note).
- The owner dictated the change, so it skips the panel (apps/mobile/AGENTS.md); stories and tests are updated.

## Acceptance Criteria

```gherkin
Feature: Coach's cautions in one Heads up section

  Scenario: Folded by default to its count
    Given a health-check caution and a flag on the targets
    When I open Coach
    Then one "Heads up" section sits directly under the calorie hero
    And it is folded, saying "2 notes about your targets" with the caution icon in the caution colour
    And neither note's text is shown

  Scenario: Opening says each note in full
    Given the folded "Heads up" section
    When I press it
    Then each caution is said in full, then each target flag, in their order

  Scenario: No notes, no section
    Given no caution and no flag on the targets
    When I open Coach
    Then there is no "Heads up" section

  Scenario: Kept for the session
    Given I opened the "Heads up" section
    When I go to another tab and back to Coach
    Then it is still open

  Scenario: The other safeguards stay as they were
    Given a pause, an under-eating notice, a training lapse or a relief offer
    When I open Coach
    Then each is above the hero in full, outside the section
```

## UI/UX
Storybook: `Screens/Coach` Coach Heads Up (folded, four notes), Coach Heads Up Opened (its walk presses it), Coach Cautions,
and the stories whose notes are flags (Coach On Chosen Break, Coach On Planned Break, Coach Weight Loss Medication Fast Pace,
Coach Not On Weight Loss Medication), which now open the section in their walk.

## Progress
Built 2026-10-22. `src/coach/HeadsUpSection.tsx` composes `MmSection` (`collapsible`, `initiallyExpanded={false}`,
`remember="coach.headsUp"`, `kind="caution"`); `CoachScreen` builds its notes from `cautionMessage` and `targetFlagMessage`
(the weight-loss medication's prescriber line still follows a raised pace) and draws it under `CalorieHero`. `MmSection`
gains `kind` and `ui.css` `.mm-section-caution .mm-section-icon`. `design/screen-direction.md` and MM-256 say the new rule.
Tests: `test/coach/headsUpSection.test.tsx` (folded with the count, opened in order, one note, none drawn, the caution
colour, on Coach under the hero and before the goal, kept across tabs, absent with no notes); the Coach tests that read a
caution or a flag open the section first (`test/support/openHeadsUp.ts`); MM-299's order test skips the section.

## Owed on a phone
- The owner looks at Coach on the phone with the cautions he saw (a sleep disorder, the 35% cap, the calorie floor): one
  folded "Heads up" line under the hero, and each note in full once opened.
