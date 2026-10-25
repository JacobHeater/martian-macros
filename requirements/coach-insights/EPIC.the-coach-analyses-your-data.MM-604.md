---
id: MM-604
status: done
component: coach-insights
related: [MM-137, MM-141, MM-256, MM-361, MM-363, MM-365, MM-108, MM-92, MM-11, MM-118, MM-114, MM-605, MM-606, MM-607, MM-608, MM-609, MM-610, MM-611, MM-612, MM-613, MM-614, MM-615, MM-616]
---

# Epic: The coach analyses your data

## Context
On 2026-10-24 the product owner asked what coaching the Coach tab does. A product review found it is the targets engine's settings
and explanation page: goal, pace, targets, last change, metabolism, confidence, body. The pattern rules of MM-141 reach the person
only as one rationed card on the Dashboard, and are lost once dismissed. Nothing on the tab looks at what the person ate or did.

The owner's words: "I've been eating a lot of fat this week, and that's calorie-dense and going to steal available calories for
more nutritious and protein-rich options. What's coach doing to tell me that I need to eat more balanced meals like a good coach
should?" And: "We have a protein goal and burn rate; coach looks at water, training (or lack thereof), fiber, fat intake, splits,
sleep, and says: you're doing X right, but you should do more of Y. It should be deterministic. These things don't need AI because
they're data driven and rule bound. A state machine and rule engine can accomplish this."

The owner corrected two readings along the way. It is not goal setting or commitment tracking ("user said they would do X, so
coach ensures they do X"). And it is not a fixed day, week or month report: it says "whatever trends are discernible from the data".

The coaching, nutrition, training and measurement panels each proposed their part on 2026-10-24. The stories below carry their
proposals.

## Decisions
By the product owner, 2026-10-24:
- **The coach is an analyst, not an accountability partner.** It reports what the data shows: what is going right and what to do
  more or less of, in the person's numbers. No goals, commitments or follow-ups on promises.
- **Deterministic.** A fixed catalog of rules and a state machine. No language model; the non-goal "No AI-generated advice at run
  time" stands.
- **The analysis opens on 1d, today, with a switcher `1d | 7d | 2w | 1m | 3m`** (MM-610), like Progress's 30d and 90d. A span is
  offered only when the data supports it. Within a span, trends are found by detectors (MM-605), so a change inside it is dated.
- **"Trade X for Y" may name any food** (MM-607, MM-608): first one the person already logs, then a catalog food once foods carry a
  group (MM-616).
- **The Coach tab shows everything, ranked** (MM-610). MM-141's ration (one new a day, three a week) no longer applies on the Coach
  tab; it still applies to the Dashboard card.
- **Single days are in** (MM-612). MM-141's "insights never concern a single day" is overruled for the Coach tab. A day the person
  marks as a **Refeed** or a **Day off** (MM-611) stays on record and is not judged as a single day.
- **Factual voice.** "Calorie-dense for its protein", not "too calorie-dense". MM-108's banned words stay banned.

Choices made without asking (say if any is wrong):
- MM-141's other rules stay: the forbidden subjects, the eating-disorder and hidden-weight filters, the evidence register entry
  for every rule, and the 28-day quiet after a dismissal (now visible as a count).
- Sleep stays as MM-252 has it. A sentence putting sleep beside falling performance is not built, since the owner declined sleep
  insights as "medical advice" (MM-368).
- Steps are not read. They wait on their storage (MM-442), and the energy-use estimate already contains activity.
- The Coach tab's other sections (goal, targets, metabolism, confidence, body) stay, below the analysis. Moving them is MM-256's
  and MM-224's business.

## Description
Four parts: a trend engine every signal uses (MM-605); the signals for food (MM-606) and for training, water and sleep
(MM-609); the swap (MM-607, MM-608, MM-616); and the Coach tab section that shows them (MM-610), with single days (MM-611,
MM-612). Three defects found on the way are fixed first, because the new rules replace or read the same code (MM-613, MM-614,
MM-615).

## Acceptance Criteria
The epic is done when:
- Opening the Coach tab shows a "What your data says" section from the first logged entry. It opens on 1d, today as logged so
  far, and offers 7d, 2w, 1m and 3m as the data supports each. It holds findings from food, training and water, each
  stated in the person's numbers, with what to do and the numbers behind it.
- A person eating more fat than their targets plan, on enough days that it crowds out protein, is told so. The top foods doing
  it are named, with a trade for a food that gives more protein at about the same calories.
- What is going right is said too, without praising eating under target, a lower weight or a bigger deficit.
- Stationary simulated users rarely see a false trend (MM-605's budget). Every rule is a pure, tested function with an evidence
  register entry.
- Nothing is said that the eating-disorder, under-eating, hidden-weight, pregnancy, underweight, kidney-disease or under-18
  safeguards would hide today.
- A Refeed or Day off is never judged by itself.

## Notes
Panel reports are summarised in each story. Every threshold the panels marked uncertain is marked "(uncertain)" in its story and
is calibrated by MM-605's null simulation before the story is done.

## Progress
Built 2026-10-24 on `feat/mm-604-coach-analysis` (PR #313). Every child is done: MM-605 (trend engine and its log), MM-606
(food signals), MM-607 (trades), MM-608 (the non-goal overruled for trades), MM-609 (training, water and sleep), MM-610 (the
Coach section with the `1d | 7d | 2w | 1m | 3m` switcher, and the Dashboard card on the same engine), MM-611 (Refeed and Day off),
MM-612 (the 1d analysis), MM-613, MM-614 and MM-615 (bugs found on the way) and MM-616 (catalog food groups). The product-designer
and UX-accessibility reviews ran on the section, and their blocking findings are fixed (MM-610's Progress). Not run locally; CI
validates.

Left for the owner: the section's length on a long span (design review PD-6); a "Show again" action for a hidden finding; the
published food packs rebuilt so that catalog foods carry groups (MM-616); Open Food Facts products' groups.
