---
id: MM-158
status: proposed
component: onboarding
related: [MM-9, MM-12, MM-24, MM-25, MM-96, MM-108, MM-128, MM-130, MM-131, MM-133, MM-136, MM-139, MM-142, MM-143, MM-146]
---

# Story: Tell me what the first month will actually look like

## Context
Onboarding ends with a goal and a note that the first two weeks are calibration (MM-12). Then the user meets reality unprepared, and
reality in the first month reliably misleads in the same few ways:

- **Week one of a deficit is flattering.** One to two kilograms come off, mostly glycogen and water (MM-131). The user's expectation is
  set at four times the true pace.
- **Weeks two and three look like failure by comparison**, and are in fact the plan working.
- **A recomp shows nothing on the scale**, by design, for weeks (MM-133).
- **A lean gain's first week is flattering in the other direction.**
- **The targets do not move for fourteen days**, which reads as the "adaptive" app not adapting.
- **The first adaptive change is small**, which reads as the app not doing much.

Each of these is predictable on day zero. Evidence that realistic expectations improve persistence is **moderate** and mixed (unrealistic
weight-loss expectations predict dropout in some studies and not others); the cost of one screen is small.

There is a constraint from MM-96: nothing in the app may promise a rate of fat loss or muscle gain. So this screen describes the *plan and
its uncertainty*, and what the scale is likely to do that is not progress. It predicts noise, not results.

## Decisions
Choices I made without asking (say if any is wrong):
- **One screen after the plan screen, before the app opens**, titled "What to expect", with at most five short points chosen by goal. It
  can be reread from the Coach screen at any time.
- **For fat loss**:
  1. "Your plan aims for about 1.0 to 2.0 lb a week" (the chosen pace, MM-128, shown as a range in the user's unit, labelled as the aim).
  2. "The first week often shows more. That extra is water, and it does not keep coming."
  3. "Day to day, the scale will move by 2 to 4 lb for reasons that are not fat. The trend line is what counts."
  4. "For two weeks your targets stay put while the coach learns your expenditure. The first change comes around day 15 and will be
     small."
  5. "If you take creatine, or start it later, tell the app. It moves the scale." (MM-136)
- **For recomp**: the scale is *meant* to stay roughly flat; what to watch is waist and strength; an honest review comes at eight weeks
  (MM-133); and a plain statement of who recomp works well for (MM-12).
- **For lean gain**: the aim as a range; the first week's extra is water and food; gaining faster than the aim adds fat, not muscle.
- **For maintenance**: the band (MM-130), and that weight wandering inside it is normal.
- **Every figure is the user's own**: the range comes from their chosen pace and weight, and the daily-noise figure from the trend model's
  water spread for their weight (MM-18). No generic numbers.
- **Every figure is hedged honestly** (MM-108): "aims for", "often", "about". The screen ends: "These are the plan's aims, not promises.
  Bodies vary, and the coach adjusts to yours."
- **A female profile sees one more point** if she has not said she does not menstruate: "Weight commonly rises for a few days around
  your period. Logging period days lets the trend expect it." (MM-20)
- **The same points reappear at the moment they come true**, as the weight-jump explanation (MM-142) and the phase-change wording
  (MM-130), so that the day-zero screen is a preview, not the only telling.
- **The weigh-in reminder is offered here** (MM-146), once.

Where the experts disagreed:
- The product strategist worried that talking about water and slow change at the moment of highest motivation dampens it. The
  behavior-change expert: motivation on day zero is not the scarce resource; belief on day sixteen is. Kept, and kept short.
- The bodybuilding coach wanted typical rates of muscle gain by training age shown for lean gain and recomp. The researcher: those figures
  are coaches' models, not measurements (MM-129), and MM-96 forbids stating expected amounts. Not shown.

## Description
A screen generated from the chosen goal, pace, sex and current weight; a link to it from the Coach screen.

## Acceptance Criteria
```gherkin
Scenario: Fat loss
  Given a 200 lb user who chose fat loss at Standard pace
  Then the screen gives the aim as a range of about 1 to 2 lb a week, labelled as an aim
  And says the first week often shows more and why

Scenario: Their own noise
  Given a 60 kg user
  Then the day-to-day figure is smaller than for a 110 kg user

Scenario: Recomp
  Given the goal is recomp
  Then the screen says the scale is meant to stay roughly flat, names waist and strength, and mentions the eight-week review

Scenario: Calibration
  Then every version says targets hold for two weeks and that the first change will be small

Scenario: No promises
  Then the screen contains no statement of an amount of fat or muscle that will be lost or gained by a date

Scenario: Male profile
  Given a male profile
  Then the point about periods is not shown

Scenario: Rereading
  Given onboarding is finished
  Then the same screen can be opened from the Coach screen
```

## Notes
- Priority: should-have; small, and it prepares the ground for MM-131 and MM-138, whose effects the user will otherwise meet cold.
- The onboarding Epic's three-minute target (MM-9) should still hold: this is one screen and one tap.
- Wording goes through MM-96's claims review, since it is the place the app comes closest to describing outcomes.
