---
id: MM-137
status: proposed
component: coach-insights
related: [MM-138, MM-139, MM-140, MM-141, MM-142, MM-143, MM-144, MM-22, MM-23, MM-24, MM-33, MM-98, MM-107, MM-108]
---

# Epic: A coach that shows its working

## Context
The engine is careful about uncertainty: it holds when it lacks data, reports a standard deviation, flags when a limit acted. Almost none
of that reaches the user in a form they can use. MM-24 records the gap in one line: "A user is never told that targets changed; they have
to notice."

An adaptive target the user does not understand is worse than a fixed one. When the number drops 80 kcal with no reason given, the
analytical user assumes a bug and the anxious user assumes punishment. Both stop trusting it, and an untrusted target is not followed.
The apps this product competes with are criticized for exactly this: the number moves and nobody can say why.

The panel's standard: **every number the coach produces must be explainable in two sentences from the user's own data, must state how
sure the app is, and must say what would change it.** And the coach must be able to say "I don't know yet", and "this is not working".

## Narrative
- Every target change comes with its reasons, broken into parts, and the history is kept and readable (MM-138).
- The coach states its confidence in three levels with the reasons and the one action that would raise it (MM-139).
- When progress stalls, the coach works out which of four different things is happening before saying anything, because the right
  response to each is different (MM-140).
- Observations beyond the weekly change are produced by a fixed catalog of rules, each with its evidence, rationed so they stay worth
  reading (MM-141).
- A scale spike gets a specific explanation from the user's own last 48 hours (MM-142).
- Every constant in the engine has a source and an evidence grade in a register the app can show (MM-143).
- What the product will not do is written down, with reasons, so that it is not rediscovered as a feature request every quarter (MM-144).

Nothing here uses a language model or a server. Every insight is a deterministic rule over local data, testable like any other engine
function, and worded by hand (MM-108).

## Acceptance Criteria (narrative)
The Epic is done when a user can open any target the app has ever given them and read why it had that value; when the Coach screen never
shows an estimate without saying how sure it is; when a three-week stall produces a diagnosis and a next step, not silence and not a
reflexive cut; and when a skeptical engineer can trace any sentence the coach says to a rule, and any number in a rule to a source.

## Notes
- Priority: MM-138, MM-139 and MM-143 first (trust in the first adaptive change depends on them); MM-140 before week six after launch;
  MM-141 and MM-142 next; MM-144 is a document and can be written at any time.
- The monthly report (MM-33) is the long-form version of the same material and should reuse these functions, not restate them.
