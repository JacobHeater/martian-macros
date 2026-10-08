# UX architecture and navigation

## Mental model

Users come to do today's work, understand their progress over time, and learn
what the coach is doing. Organize around those tasks—not around the
requirements folders or internal packages.

1. **Dashboard — "How am I doing today?"** A summary and launch point.
2. **Food — "What did I eat?"** The full day, target context, and food entry.
3. **Progress — "What is changing over time?"** Weight trend and uncertainty,
   measurements, and eventually strength.
4. **Coach — "What does the system recommend, and why?"** Targets, confidence,
   check-in, and optional supporting evidence.
5. **Train — "What did I do?"** Add as the fifth destination when its roadmap
   workstream lands.
6. **Settings — "What has the user chosen or connected?"** Reached from a
   settings action in the app bar, not promoted to a primary tab.

## Primary navigation

Use a labeled Material bottom navigation bar with Dashboard, Food, Progress,
and Coach in that order. Add Train between Food and Progress when the training
log is implemented. Five destinations is the limit. Settings stays behind the
gear/action in the top bar.

Keep each destination's state when switching tabs. Navigation changes should
not discard an in-progress entry, scroll position, or selected detail without
a clear reason. The label and icon both communicate destination; never rely
on icon recognition alone.

Use Dashboard as the initial destination after setup. Food retains the day
picker and historical day review. Do not put a day picker on Dashboard:
Dashboard summarizes today; Food is where users inspect another day.

## Dashboard composition

The dashboard answers "how am I doing?" at a glance and routes to detail.
Follow the proposed order in MM-98:

1. **Today's intake:** calories eaten against today's target, remaining
   amount, and protein against its target. Keep carbohydrate and fat detail
   on Food.
2. **Weight:** trend weight, seven-day change, and a compact 30-day trend
   line. If there is no weigh-in today, make the weigh-in action clear. Honor
   the weight-display preference.
3. **Coach:** calibration progress, next check-in, or the recent target
   change and its date.
4. **This week:** workouts and a personal record when Train exists.
5. **Recomp signal:** only when the signal applies and its supporting
   measurements are sufficiently clear.

The first three summaries should fit on a typical phone without scrolling.
Keep stable summary cards and explain empty states rather than removing cards
and making the page jump between days. Each summary opens its detailed
destination. The dashboard must not turn into a second Food, Progress, or
Coach screen.

Offer no more than three direct actions. Initially, Add food and the
conditional in-place weigh-in cover the two frequent tasks. Later actions
(scanner and Start workout) are added only when available and only within the
three-action cap. Logging from Dashboard returns to Dashboard with updated
values.

## Feature ownership and relationships

- **Logging belongs to Food.** Dashboard can start common actions, but Food
  owns meal groups, entries, edit/delete/copy, day completeness, search,
  provenance, and detailed nutrients.
- **Coaching belongs to Coach.** Keep the Dashboard coach summary to one
  useful line. Use Coach for target details, confidence, explanations,
  screening cautions, and check-in controls.
- **Progress belongs to Progress.** Weight trend, uncertainty, weigh-ins,
  waist and other measurements, events, display preferences, and eventually
  strength detail live here. Coach can cite them without duplicating their
  charts.
- **Training belongs to Train.** Keep workout logging optimized for use
  between sets; Progress can summarize strength trends and Dashboard can
  summarize this week.
- **Settings owns persistent choices and connections.** Group by user task
  (profile/coaching, display/units, health connections, data/backup) as those
  features ship; do not mirror navigation there or create one section per
  ticket.

Use one source of truth for each displayed value. Dashboard summaries and
their detail screens must agree on date, units, target, and trend. Establish
clear ownership when multiple workstreams share a screen; extend shared
components instead of letting features edit one giant surface in parallel.

## Setup to ongoing use

Onboarding gathers only what is needed to establish a safe initial profile
and target. It should explain the immediate purpose of a question, use
focused steps, and make progress/back navigation predictable. Biological sex
is required with no default and adults-only eligibility is enforced.
Screening is direct and non-judgmental; never infer or show an answer the user
did not provide.

Transition from setup to the Dashboard with a concise "what to expect" step
when its ticket lands. Explain calibration, noisy early weigh-ins, and when
the first adaptive update is expected. Do not imply that the system has
measured expenditure before it has enough observations.

Profile and screening information becomes correctable in Settings and
re-check flows, as defined by their requirements. Corrections trigger
recomputation without making the user repeat unrelated setup.

## Progressive disclosure and safeguards

Keep the default layer focused on the next decision or action. Put source
provenance, detailed nutrients, target contribution breakdowns, chart
interactions, and advanced options one deliberate step deeper. Do not hide
material uncertainty, current safety guidance, or destructive consequences
behind an obscure disclosure.

Safety notices are always available and never gated by monetization. Show the
shortest actionable explanation first; provide relevant detail without
creating alarm or exposing sensitive details on unrelated surfaces. If
multiple safeguards apply, prioritize and group them without suppressing any
required action.

## Monetization and trust

Keep the free daily loop visible and dependable. Never interleave a paywall
with logging, health screening, safety bounds, or a recovery flow. Coach
features may show their locked state only according to the entitlement
contract and monetization tickets; no design recommendation here broadens
that boundary. A purchase prompt must explain the feature and price without
using fear, weight anxiety, or fabricated urgency.

## Complexity without feature soup

Connect related systems through small contextual links: an intake summary
opens Food; a trend summary opens Progress; a target-change line opens Coach.
Do not add a new top-level destination for every feature. Use detail pages,
focused sheets, or grouped settings where requirements support them, and
preserve a single obvious route for each common task.
