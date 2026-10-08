---
id: MM-109
status: proposed
component: design-system
related: [MM-101, MM-102, MM-103, MM-94]
---

# Task: The app icon, name treatment and launch screen

## Context
See MM-101. The app has the default Flutter icon and the default Flutter launch screen, both of which a store will reject or a user will
read as unfinished. The name "Martian Macros" has a character that nothing visual yet reflects.

## Decisions
Choices I made without asking (say if any is wrong):
- **These are the product owner's to decide.** This ticket proposes directions and delivers the assets once one is chosen.
- **Directions to react to**:
  1. *Instrument*: a simple gauge or trend line on a rust ground. Says "measurement", matches the product's argument.
  2. *Planet*: a stylized Mars, perhaps with a macro-ring orbit. Says "Martian", friendly, less specific to what the app does.
  3. *Monogram*: a double-M mark. Neutral and durable, the least distinctive.
- **Requirements whichever is chosen**: legible at 48 px; works on light and dark home screens; an Android adaptive icon (foreground and
  background layers) and a themed monochrome variant; no text in the icon.
- **The launch screen is the icon on the background color**, matching the first frame of the app in each theme, so the start does not
  flash.
- **The name is written "Martian Macros"**, two words, both capitalized. The short name under the icon is "Macros" if the full name is
  truncated.

## Description
Chosen direction, produced as icon assets for both platforms, the launch screen, and the store listing's icon.

## Acceptance Criteria
```gherkin
Scenario: A direction is chosen
  Then this ticket records which direction the product owner chose

Scenario: On a home screen
  Then the icon is recognizable at the smallest size each platform uses, on a light and a dark wallpaper

Scenario: Android adaptive and themed icons
  Then the icon is not clipped under any launcher mask shape, and a monochrome version is provided

Scenario: No flash at launch
  Given dark mode
  When the app is launched
  Then the launch screen and the first frame have the same background color
```

## Notes
- Needed before store submission (MM-94).
- If a brand typeface is wanted for headings and figures (MM-103), choose it with the icon so they belong together, and check its license
  allows embedding in an app.
