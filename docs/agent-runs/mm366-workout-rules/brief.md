# Brief: the workout insight rules (MM-366)

## Question
Can the three drafted inline insight rules for workouts be built as written, so they become the first inline insights the
app shows? Check each rule's trigger, its figures and its words, and say what must change.

## Why now
The product owner approved building the inline insight framework (MM-362), Settings > Coach (MM-364) and the Coach tab's
list (MM-363) on 2026-10-17. The epic (MM-361) says the rule catalogs are drafts that the domain roles check before they are
built. Workouts go first because they are the least sensitive area.

## Inputs
- `requirements/coach-insights/STORY.inline-insights-for-workouts.MM-366.md`: the draft catalog
- `requirements/coach-insights/STORY.insight-under-the-item.MM-362.md`: the framework, voice and safeguards
- `requirements/coach-insights/EPIC.coaching-insights-inline.MM-361.md`
- `requirements/coach-insights/STORY.rule-based-insights.MM-141.md`: the dashboard insight catalog, including "strength holding on a cut"
- `requirements/design-system/STORY.voice-and-tone.MM-108.md` (or the file that holds MM-108): banned words and subjects
- `docs/evidence.md`: the evidence register (MM-143)
- the engine's e1RM, progression (MM-79) and weekly volume code under `apps/mobile/src/`

## Roles
- training: the triggers and figures (e1RM within 1% across 4 sessions; ≥ 50% weekly set jump against the 4-week average;
  muscle-group mapping), the evidence, and the PD-5 question (a lift line beside the MM-79 suggestion).
- coaching: the words, the "fact, then a general direction" shape, MM-108, and whether "That is what a well-run cut looks
  like" is praise for eating below maintenance.
- safety: eating-disorder history, under-18, and whether any line encourages overreaching.

Omitted: nutrition, measurement (no intake or body figure is computed by these rules beyond MM-141's existing one),
product-designer and ux-accessibility (the design passed in `docs/agent-runs/mm361-coaching-insights/`),
react-capacitor (no code under review).

## Output
One report per role in `findings/<role>.md` using `agents/templates/findings/role.md`. Each finding names the rule, what to
change and the evidence. Read-only: no edits.
