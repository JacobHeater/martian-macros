# Interaction and motion

Motion here has two jobs: confirm what just happened, and give the product a
pulse. It never decorates, delays a routine task, or dramatizes a number.

## Principles

- **Fast and exact beats flashy.** Feedback within 100 ms of a tap; the screen
  state is updated before persistence completes.
- Motion explains state change or spatial continuity, or confirms an action.
- Honor reduce-motion (`MediaQuery.disableAnimations`): remove movement, keep the
  state change and focus change; durations drop to 0 except fades at 100 ms.
- Never animate weight or body-fat figures as a reward, and never count a
  number up or down. Calorie *progress* may move; the figure changes in place.
- No perpetual animation, parallax, overshoot, or particle effects.

## Timing and easing (one set, used everywhere)

| Token | Duration | Curve | Use |
|---|---|---|---|
| `fast` | 100 ms | `easeOut` | Press states, toggles, ripples |
| `base` | 180 ms | `easeOutCubic` (enter), `easeInCubic` (exit) | Row insert/remove, chip, sheet content |
| `slow` | 280 ms | `easeOutCubic` | Arc and bar value changes, sheet open |
| `reveal` | 600 ms | `easeOutCubic` | The one-time arc draw-in (first paint after cold start, onboarding welcome) |

Interruptible, never blocking: a CTA is never disabled to finish an animation.

## The signature moments (all of them)

1. **Arc draw-in**, once per cold start on Today: the arc fills from empty to
   today's value in `reveal` and the body dot settles. Skipped under reduce
   motion and on subsequent tab switches.
2. **Log confirmation:** after adding food, the new row slides in (`base`), the
   arc and macro bars move to the new value (`slow`), a light selection haptic
   fires, and the sheet closes. One feedback channel at a time (no snackbar if
   the row visibly appears; keep the Undo as a snackbar only for deletes).
3. **Strength PR** (when Train exists): a single 600 ms ring pulse in `positive`
   around the PR value and a medium haptic. The only celebration. Dismissible,
   never modal.
4. **Primary press:** Ember button depresses to 98% scale in `fast`.

No other motion is signature. Not screen transitions, not list scroll effects.

## Navigation and transitions

Use the platform's Material page transitions. Tabs switch instantly with the
selected-pill sliding in `base`; each destination keeps scroll position and
state (`IndexedStack` or equivalent). Sheets rise in `slow` and are dismissible
by drag, back, and a visible close action.

## Feedback and microinteractions

- Immediate pressed state on every control; focus ring (2 dp `text`, 2 dp offset)
  for keyboard and switch access, never removed.
- Success confirms a task ("Food added"), never grades a choice.
- Error copy says what failed and what to do; preserve entered values.
- Haptics: selection tick on a successful log, toggle and segment changes; a
  medium impact only for a PR. Never haptics to pressure logging, weigh-in, a
  safety response or a purchase. Respect the system haptics setting.

## States

Empty, loading and error follow [screen-direction.md](screen-direction.md).
Skeletons are static and flat. A spinner is used only for operations over about
a second that the user waited for (backup, restore), always with a label.

## Confirmation, undo, destructive actions

Undo for reversible deletes; confirmation sheets for irreversible or
replace-all actions (erase, restore), explaining the consequence with the safe
exit first and the destructive action visually quieter than the cancel. No
confirmation on routine saves.

## Gestures and charts

Gestures are accelerators only; each has a visible alternative. Charts are
readable without touch; tapping a point shows date and value in a floating label
while the caption remains the full text equivalent. Avoid horizontal swipes that
conflict with navigation or chart ranges.

## Touch ergonomics and access

48 × 48 dp minimum, including icon buttons and set controls. Frequent actions in
thumb reach (the FAB, the sheet's primary bar). Do not place a destructive control
next to a high-frequency save. Full support for TalkBack, VoiceOver, keyboard
and switch access; focus order follows reading order and does not jump after a
state change. Nothing is time-limited.
