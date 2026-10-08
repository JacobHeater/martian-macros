# Voice and wording

How the app speaks (MM-108). Words are most of this app's interface, and a diet
app's wording can do harm by shaming, by praising restriction, or by sounding
more certain than it is. These rules apply to every string a user reads. Safety
wording is not improvised: it is reviewed by the professional in MM-29.

## Rules

1. **Plain and specific.** Say what happened and what it means: "Targets went
   down 80 kcal because your measured expenditure is lower than the starting
   estimate." Not "We've optimized your plan!"
2. **State, do not judge.** "340 kcal over" is a fact. No "oops", "cheat", "bad
   day". Equally, no praise for eating under target.
3. **Honest about uncertainty.** An estimate is called an estimate and shown with
   its range. "About", "roughly" and "±" appear when true, and not otherwise.
4. **Explain the body, briefly.** When weight jumps, say why that is normal.
5. **Never moralize food.** No "good", "bad", "clean", "junk" or "guilt-free". No
   "earn" or "burn off".
6. **The user is an adult.** The app recommends and explains; it does not scold or
   nag.
7. **Numbers.** Thousands separators; a space before the unit ("2,473 kcal",
   "172 g"); a true minus sign for negatives; "lb" not "lbs".

## Glossary

One term for one thing, used everywhere.

| Term | Means | Never called |
|---|---|---|
| trend weight | the filtered estimate of tissue weight | true weight, real weight |
| weigh-in | one reading of the scale | weigh, entry (for weight) |
| targets | the daily numbers (calories, protein, carbs, fat) | goals |
| goal | fat loss, recomp, lean gain or maintenance | plan type, mode (in text) |
| check-in | the weekly review of targets | update, reset |
| calibration | the first fourteen days | trial, setup period |
| metabolism | the friendly title of the energy-expenditure card | burn |
| energy expenditure | the same thing, in explanations | TDEE (in text) |
| estimate | any value the engine inferred | score, reading |

## Checked automatically

`apps/mobile/test/voice_test.dart` scans every string in the app and fails if any
contains a banned word (good, bad, clean, junk, guilt, cheat, oops, earn, burn
off, lbs, true weight, and a few others). Add a word there when a review finds
one; the test is the memory of this guide.

## Not yet done

- Strings still live in the screen files. Moving them into localization files is
  worthwhile (it also makes every rule here checkable in one place and is the
  prerequisite for translation) and is tracked in MM-108; it has not been done.
- "Consistent terms" and "uncertainty shown" are reviewed by people, not tests.
