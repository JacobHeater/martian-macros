# Design principles

These govern decisions where requirements leave room for design. They are
specific to a body-composition coach that handles sensitive health and weight
data, and that must also be something people *want* to open every day.

Principles 1 to 10 come from the earlier package and still stand. Principle 0 is
new: the earlier package was so cautious that it produced a product with no
pulse, and that is also a failure.

## 0. Energy is a requirement, not a risk

A daily utility that feels flat does not get used, and a coach nobody opens
helps no one. The interface must feel sharp, modern and alive in the first
second. That energy comes from **contrast, craft and precision**: a confident
Ember action against a deep canvas, big clean figures, one well-drawn arc, fast
and exact feedback. It never comes from reward mechanics, noise or decoration.

**Use when:** a design feels "safe" but dead. Add contrast, scale and craft to
the one thing that matters on the screen; do not add a second thing that matters.

## 1. State what the evidence supports

Separate a measurement, an estimate and a recommendation, in words *and*
visuals. Estimates carry the Ion color and a label; show ranges where the model
has uncertainty; never present a smoothed trend as a direct reading. A coach
conclusion comes with its reason and confidence, not as an authoritative voice.

## 2. Make the next useful action obvious

One primary action per screen, in Ember. On the dashboard: today's intake and
protein first, then trend weight, then what the coach is doing. Food and weigh-in
are within one tap. Summaries open the destination that holds the detail.

## 3. Treat restraint as a trust feature, and as how loudness works

Emphasis only works by contrast with calm. One strong thing per view; everything
else quiet. Reserve Ember for the action and the current location, caution for
health, and plain text for a calorie difference. Over target is information, not
an error.

## 4. Motivate without moral accounting

Describe behavior and trends without grading the person or the food. Do not
reward lower intake, a larger deficit, a lowest weight, or low-intake streaks.
Celebrate only meaningful, permitted outcomes (a strength PR). Let speed and
precision provide most of the delight.

## 5. Explain change without forcing a lecture

When a target changes: what, when, why, how confident. Short at the point of
decision, detail on request. Explanation never blocks a routine log.

## 6. Make safety humane, direct and available to everyone

Plain language, no alarm, no shame, never behind a paywall, never displaced by
decoration. Safety notices are visually distinct by structure and icon (see the
notice family), not by a loud fill.

## 7. Keep daily work lightweight; keep complex data legible

Food logging is the most frequent task. Common path visible, provenance and
detailed nutrients one deliberate step deeper.

## 8. Protect agency around weight

Weighing is a user-controlled observation, not a daily score. The hide-the-number
preference works on every surface. Offer waist and strength as context.

## 9. Make delight earned and exact

Delight is a fast sheet, a satisfying arc that settles when you log, a number
that does not jitter, a haptic tick that confirms. Not confetti, mascots or
streak machinery. If removing it would not reduce comprehension, confidence or a
moment the user values, it does not earn its place.

## 10. Prevent visual debt at the source

Semantic tokens and shared components only. A new screen makes no independent
decision about color, radius, spacing, chart marks or empty states.

## 11. Identity is a layer, not the product (new)

The "Martian" signature is permitted in a small, fixed budget (orbit hairline,
horizon arc, limb glow, a sparse static starfield on two non-routine screens)
and in tone. It must never reduce legibility, add a control, or appear on a data
screen as ornament. If the signature fights the data, the data wins.

## Resolving design tensions

- **Energy vs. restraint:** one loud thing, executed with craft. Contrast beats
  decoration.
- **Delight vs. honesty:** reward process and precision; never outcomes the user
  could be harmed by chasing.
- **Speed vs. explanation:** fast path stays fast; reasoning is one step away,
  but uncertainty and safety stay visible.
- **Density vs. calm:** show the few numbers that answer the current question.
- **Personality vs. trust:** put character in exact language and one distinctive
  graphic idea, not in an anthropomorphic coach or unsupported claims.
- **Brand vs. accessibility:** accessibility wins; adjust the brand value (as
  was done for light-mode carbs) rather than the contrast threshold.
