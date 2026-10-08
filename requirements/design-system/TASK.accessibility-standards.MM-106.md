---
id: MM-106
status: proposed
component: design-system
related: [MM-101, MM-102, MM-103, MM-104, MM-91]
---

# Task: Accessibility rules every screen meets

## Context
See MM-101. Nothing has been checked: not contrast, not screen readers, not text scaling. Some of what exists is likely wrong already (the
trend chart has no description for a screen reader; swipe-to-delete has no alternative).

## Decisions
Choices I made without asking (say if any is wrong):
- **Contrast**: WCAG 2.1 AA. Text 4.5:1 against its background (3:1 for large text); chart lines, bars, icons and control boundaries 3:1.
- **Touch targets**: at least 48 by 48 dp, including the plus and minus buttons planned for the training log.
- **Text scaling**: every screen works at the largest system text size. Layouts wrap or scroll; they do not clip.
- **Never color alone.** Anything shown by color is also shown by a label, an icon or a position: macro bars are labelled, a caution has
  an icon, a selected choice has a check mark.
- **Screen readers** (TalkBack and VoiceOver): every control has a label; every figure is read with its unit and meaning ("1,400 of 2,400
  calories eaten"); a chart has a text summary ("Trend weight 182 pounds, down 1.2 pounds in 7 days"); reading order follows the layout.
- **Every gesture has a visible alternative**: swipe to delete also exists as a button or menu item.
- **Motion** respects the system's reduce-motion setting.
- **No time limits** on reading or acting, except where the user started a timer.

## Description
The rules, a checklist for reviewing a new screen, automated checks where they exist (Flutter's accessibility guideline matchers in widget
tests: tap-target size, labelled controls, text contrast), and a pass over the existing screens to fix what fails.

## Acceptance Criteria
```gherkin
Scenario: Automated checks
  Then a widget test for each screen asserts tap-target size, labelled tap targets and text contrast, in both themes

Scenario: Screen reader, by hand
  Given TalkBack is on
  Then a user can complete onboarding, log a food and record a weigh-in, hearing a meaningful label for each control and figure

Scenario: The chart
  Given a screen reader on the Progress screen
  Then the trend chart is read as a sentence giving the trend weight and its recent change

Scenario: Without swiping
  Then a logged food can be deleted without a swipe gesture
```

## Notes
- The automated matchers catch the mechanical failures. They do not tell you whether the app makes sense by ear; the by-hand pass is the
  real test.
