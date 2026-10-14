---
id: MM-298
component: dashboard
status: done
related: [MM-291, MM-294, MM-254]
---

# Task: the weight row shows the last trend before the weigh-in, and today's entry after it

## The owner's decision (2026-10-14)

The panel asked (mm291-weigh-in, PD bounded request and UX-4) whether the
row should show the last trend before the weigh-in and today's raw entry
after it. The owner: yes to both.

## What is built

- Before today's weigh-in, the Weigh-in row says the trend under its title
  ("Trend so far 189.6 lb"), above the field ("Last" read as "previous",
  PD-6, UX-3).
- After it, the figure names itself, "Trend 184.1 lb", and today's entry
  is under it: "Today 183.9 lb · 7 days −0.6 lb", one line at 412 dp
  (UX-1, PD-1: "Trend · Today 183.9 lb" read as the trend's value today).
  With no point a week back the "7 days" part is left out, never a dash.
- With fewer than two days of trend (the first weigh-in), the row shows
  today's weight with "Today’s weigh-in · the trend starts tomorrow", so
  the same number is never shown twice (UX-2), and never asks again.

## Acceptance criteria

```gherkin
Scenario: The trend before the weigh-in
  Given a trend and no weigh-in today
  Then the Weigh-in row reads "Trend so far" with the trend weight above the field

Scenario: Today's entry after it
  Given a trend of more than a week and 181.4 lb saved today
  Then the row's figure reads "Trend" and its line reads "Today 181.4 lb · 7 days"

Scenario: The first weigh-in
  Given only today's weigh-in
  Then the row shows today's weight once, says the trend starts tomorrow, and shows no field
```

## UI/UX

Storybook: Screens/Today/Not Weighed Today, Screens/Today/Dashboard,
Screens/Today/First Day.

## Progress

Built 2026-10-14 (Session 25), through Storybook and the panel first (`docs/agent-runs/mm298-trend-goal-themes/`).
