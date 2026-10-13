---
id: MM-32
status: done
component: adaptive-coach
related: [MM-22, MM-17, MM-21, MM-26, MM-77, MM-92]
---

# Story: A recomp signal when the scale is flat but the body is changing

## Context
A recomp done right can leave the scale flat for six weeks. In every other app that reads as failure. Planning identified this as the main
retention risk, and the answer as the product's signature moment.

## Decisions (made with the product owner)
- **When trend weight is flat, waist is going down and strength is going up, the app shows a "Recomp signal".** It is real evidence, not a
  gimmick: those three together are what fat lost and muscle gained look like from outside.

Choices I made without asking (say if any is wrong):
- **Flat** means trend weight changed by less than 0.5% over four weeks.
- **Waist down** means at least 1 cm lower than four weeks ago, with at least two measurements in the window.
- **Strength up** means the estimated one-rep max rose on at least two tracked lifts over four weeks (MM-77).
- **It is shown in any goal**, since it describes what happened, not what was intended.

Choices made with the expert panel while the product owner was away (2026-10-11, `panel-measurement`; say if any is wrong). Where
they differ from the choices above, these are what was built. Every figure is a judgment about measurement noise, not a validated
threshold:
- **Waist down** compares the middle value of the entries of the last 14 days with that of the entries from 21 to 35 days ago, and
  needs a drop of 1.5 cm: 2 cm when either is a single entry. It needs an entry in each and three in all. The 1 cm first written is
  inside the noise of one reading of a tape (MM-155), and the card would flicker. Since 2026-10-11 the waist is judged by
  MM-155's shared function (`waistChangeOf`): smoothed ends, and 1.4 cm as the threshold.
- **Flat** stays at less than 0.5% over 28 days, and needs weigh-ins on 8 of those days, 2 in the last 7 and 2 near the day 28 days ago.
- **A lift is up** when its smoothed estimated max rose 2.5% or more over 28 days, it was trained in the last 14 days and has four
  sessions in the last 42. One more rep is about 3% of a max. The signal needs two lifts up and more up than down.
- **Nothing is remembered.** When a part stops holding the card goes; keeping it up would show a claim the data no longer supports.
- **With two parts holding and the third not logged, the card says what logging it would show.** When any part was measured and does
  not hold (waist up, weight falling), there is no card: other cards already show those.
- **The card names a pattern and says what it does not measure.** It never says fat was lost or muscle gained. The sentence in the
  decision above ("what fat lost and muscle gained look like") stays out of the app: a new lift gets stronger largely through skill,
  and a waist is not fat mass.
- **A waist change is shown to 0.5 cm or 0.25 in**, as MM-155 asks; the "0.6 in" in the description below is not.

## Description
A card on the Progress screen, shown while the conditions hold, saying what was seen in plain terms ("Your weight held at 182 lb. Your waist
is down 0.6 in. Your squat and row are up."). When only some conditions have data it says what is missing instead (for example, "Measure
your waist weekly to see this").

## Acceptance Criteria
```gherkin
Scenario: All three hold
  Given four weeks with flat trend weight, a waist 2 cm lower and two lifts stronger
  Then the Recomp signal card is shown with those three facts

Scenario: Weight is falling
  Given the same but trend weight down 2%
  Then the card is not shown (that is fat loss, and the trend already shows it)

Scenario: No waist data
  Given flat weight and rising strength but no waist measurements
  Then the card asks for a weekly waist measurement instead

Scenario: A waist change inside the noise
  Given waist readings of 92 and 93 cm a month ago and 91 and 91.5 cm now
  Then the waist is not counted as down and the card is not shown

Scenario: The waist went up
  Given flat weight, rising strength and a waist 2 cm higher
  Then no card is shown, and no prompt to measure

Scenario: A lift not trained lately
  Given a lift that rose 5% and was last trained 20 days ago
  Then it is not counted

Scenario: Too few weigh-ins
  Given six weigh-ins in four weeks
  Then the weight is unknown, not flat
```

## Notes
- Built 2026-10-11: `recompSignalOf` in the engine (tests in `packages/engine/test/recomp_signal_test.dart`) and a card on Progress
  (`apps/mobile/test/recomp_signal_test.dart`). Not seen on the emulator: the demo data is a fat loss, which shows no card.
- Known limits: bodyweight lifts use a raw weigh-in in their estimate, so water noise reaches them; the newest point of the weight
  trend still moves as weigh-ins arrive, so near 0.5% the card can come and go; waist also moves with the menstrual cycle.
- Depends on the training log for strength (MM-77). A first version on weight and waist alone is possible and weaker.
- The thresholds need checking against the measurement noise of a tape (about 0.5 to 1 cm), or the card will flicker.
