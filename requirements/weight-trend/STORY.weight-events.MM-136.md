---
id: MM-136
status: proposed
component: weight-trend
related: [MM-15, MM-17, MM-18, MM-19, MM-20, MM-23, MM-30, MM-131, MM-139, MM-142, MM-148]
---

# Story: Tell the app about things that move the scale without moving fat

## Context
The trend filter treats every unexplained change as some mix of water noise and tissue (MM-18). Menstruation is the one known cause it can
be told about (MM-19, MM-20). There are others, common among exactly the users this app is for, and one of them is large enough to
mislead the coach by itself.

**Creatine.** The most-used and best-supported supplement among people who lift. Starting it adds about 1 to 2 kg of body water over one
to four weeks (faster with a loading phase), which then stays for as long as it is taken and leaves over a few weeks when stopped.
Evidence: **strong** (ISSN position stand; consistent across decades of trials). To the engine, a user who starts creatine three weeks
into a cut appears to have stopped losing fat: the estimate of expenditure falls and calories are cut. One who stops appears to lose
faster.

**Shorter events**, each well known to cause a few days of water change (**strong** in direction, sizes variable): a stomach illness, a
long flight or travel, an unusually salty or large meal, the first week of a new or much harder training program (muscle damage and
inflammation hold water), a night of heavy drinking.

## Decisions
Choices I made without asking (say if any is wrong):
- **A weight event is a dated note the user adds from the Progress screen**, chosen from a short list: started creatine, stopped creatine,
  illness, travel, new or harder training, unusually large or salty meal, other.
- **Two kinds, handled differently**:
  - **Lasting shifts** (creatine start and stop): the trend is allowed a step of body water that persists. The step's size is estimated
    from the data within a prior of 1.5 kg (start) or -1.5 kg (stop), spread over the following 21 days, and is excluded from the
    tissue slope the expenditure estimate uses.
  - **Passing events** (the rest): readings in a window around the date (the day before to four days after; seven days for illness) get
    wider noise, exactly as cycle days do (MM-19), so they pull the trend less.
- **The chart marks events**, so the user can see why the band widened or the line stepped (MM-17).
- **An event can be added after the fact**, up to 28 days back, and the trend and estimate are recomputed (everything is a pure function
  of stored history, MM-22).
- **Creatine is also a setting** ("I take creatine": yes/no with a start date) asked once in onboarding's training step, because a user
  already taking it needs no event, and one who starts later should be prompted to say so.
- **The app does not recommend creatine or any supplement** (MM-144). It asks because it changes the scale.
- **Events are not excuses.** Marking events on most days would let a user explain away a real trend. No more than two passing events in
  any 14 days widen the noise; further ones are recorded and shown but have no effect, and the app says so.

Where the experts disagreed:
- The engineer preferred detecting steps automatically (a change-point detector) over asking. The physique expert: an automatic detector
  cannot tell creatine from a week of overeating, and the second must not be forgiven. Ask the user; a detector may *suggest* an event
  ("Your weight stepped up 1.4 kg around the 12th. Did anything change?") in a later version.
- The UX strategist worried about one more thing to log. It is optional, rare, and offered at the moment it matters: from the
  weight-jump explanation (MM-142).

## Description
A new events table (needs MM-61); the trend filter accepts lasting shifts and passing windows; the simulator gains both so the engine can
be tested against them.

## Acceptance Criteria
```gherkin
Scenario: Creatine during a cut, declared
  Given a simulated user on a steady 500 kcal deficit who starts creatine in week four and gains 1.5 kg of water over ten days
  And a "started creatine" event on that date
  Then the expenditure estimate falls by less than 100 kcal because of it
  And no check-in in the following four weeks lowers the target on that account

Scenario: The same, undeclared
  Given the same user and no event
  Then this ticket records how far the estimate moves, so the value of asking is known

Scenario: A passing event
  Given a "travel" event and readings 1.2 kg high for the three days after it
  Then the trend rises less than it would for the same readings without the event

Scenario: Added afterwards
  Given a weigh-in history with a step two weeks ago
  When a "started creatine" event is added for that date
  Then the trend and the expenditure estimate are recomputed

Scenario: Not an excuse
  Given three passing events in ten days
  Then the third has no effect on the trend and the user is told why

Scenario: Shown on the chart
  Then each event appears as a mark on the trend chart at its date
```

## Notes
- Priority: should-have. The creatine case alone justifies it for this audience.
- Shares its mechanism for lasting shifts with the glycogen work (MM-131); build them together.
- A user who pauses (MM-148) for illness gets an illness event without being asked twice.
- Medications that move water or weight are covered as a standing caution in MM-112, not as events.
