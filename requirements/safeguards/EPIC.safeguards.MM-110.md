---
id: MM-110
status: proposed
component: safeguards
related: [MM-111, MM-112, MM-113, MM-114, MM-115, MM-116, MM-117, MM-118, MM-11, MM-28, MM-29, MM-92, MM-108]
---

# Epic: Safeguards that act after onboarding

## Context
The safety work so far has two parts: a health check answered once at onboarding (MM-11) and hard limits on what the engine may prescribe
(MM-28). Both are about the app's *output on day one*. Neither watches what actually happens afterwards. Nothing today notices a user who
eats far below the target they were given, who loses weight faster than the limit the app itself set, who becomes underweight, who becomes
pregnant in month four, or whose training and sleep are falling apart on a deficit.

A review panel (recomposition, sports nutrition, recovery, behavior change, research and safety) rated this the largest gap in the
requirements: the limits bound the prescription, and nothing bounds the outcome.

Evidence quality is stated per ticket, using four grades used throughout these tickets and defined in MM-143: **strong** (consistent
meta-analyses or consensus statements), **moderate** (several trials or one good meta-analysis, some inconsistency), **emerging** (few or
small studies), **judgement** (expert practice or product reasoning with no direct trial).

## Narrative
- Body size has a floor as well as body fat: an underweight user is never given a deficit (MM-111).
- The health check grows to cover conditions it missed, and is asked again, because health changes (MM-112). Users on weight-loss
  medication get rules of their own (MM-113).
- The app compares what the user actually eats and how fast they actually lose with its own limits, and responds: a notice when intake
  stays far under the floor (MM-114), and an immediate, un-throttled raise when loss outruns the limit (MM-115).
- A twenty-second weekly check-in records hunger, energy, sleep, training quality and mood (MM-116). Those answers, with strength from the
  training log, let the coach offer to ease a deficit before the user burns out (MM-117).
- A user for whom the scale number does harm can hide it and still be coached by the trend (MM-118).

Every safeguard is **non-diagnostic**: the app reports what it sees in the user's own data, says what it will and will not do, and points
to a clinician. It never names a condition. All safeguard wording is reviewed with the limits themselves (MM-29) and follows the voice
rules (MM-108).

## Acceptance Criteria (narrative)
The Epic is done when a simulated user who under-eats, over-loses, becomes underweight or reports collapsing recovery is, in each case,
noticed within two weeks, told plainly what the app saw, and never moved to a lower calorie target as a result; and when no safeguard
message praises restriction, names a diagnosis, or can be triggered by a single day's data.

## Notes
- Priority: MM-111, MM-112, MM-114 and MM-115 are must-haves before public release. MM-113, MM-116, MM-117 and MM-118 are should-haves.
- These rules decide when the app overrides its own coach. They belong in the professional review (MM-29).
