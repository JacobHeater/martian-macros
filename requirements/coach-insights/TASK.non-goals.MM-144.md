---
id: MM-144
status: done
component: coach-insights
related: [MM-137, MM-23, MM-44, MM-74, MM-79, MM-92, MM-96, MM-108, MM-124, MM-125, MM-128, MM-130, MM-143]
---

# Task: Write down what Martian Macros will not do, and why

## Context
A credible product in this field is defined as much by what it refuses as by what it offers. Each item below is something a competitor
ships, a user will request, or a contributor will propose in good faith. Each was considered by the panel and declined for a stated
reason. Without a record, each will be re-argued from the start.

Several existing tickets already carry exclusions in their notes (no social features, MM-74; no meal estimation from photos, MM-44; no
periodization, MM-79; never reward a deficit, MM-92). This collects them and adds the rest.

## Decisions
Choices I made without asking (say if any is wrong). The list, each with its reason and what would reopen it:

**Energy and targets**
- **No "exercise calories" added to the daily target.** Wearable and machine estimates of exercise energy are too inaccurate
  (MM-23), and "eating back" double-counts activity the expenditure estimate already contains. *Reopen if*: never; it contradicts the
  engine's design.
- **No automatic compensation for an over or under day** (MM-124). It trains a restrict-after-overeating cycle.
- **No aggressive pace, protein-sparing modified fast, or very-low-calorie mode** (MM-128). They need supervision.
- **No reverse dieting as a metabolic strategy** (MM-130). No evidence of benefit.
- **No "metabolic damage", "starvation mode" or "toning" language anywhere** (MM-108). Adaptive reduction in expenditure is real, modest and
  described as such.
- **No contest-preparation or peak-week features**: no water, sodium or carbohydrate manipulation for a show or a weigh-in.
- **No weight-cut tools for weight-class sports.**

**Food and nutrition**
- **No meal plans and no prescribed foods.** The app sets numbers and the user chooses food. Meal plans are low-adherence and stray into
  dietetic practice.
- **No fasting windows, meal-frequency rules or nutrient-timing requirements** (MM-125). Evidence for an effect on body composition beyond
  total intake is weak. Users may eat on any schedule and the app is indifferent.
- **No supplement recommendations**, including creatine and protein powder. The app asks about creatine only because it moves the scale
  (MM-136).
- **No food scoring, grading, or "clean" and "junk" labels** (MM-108).
- **No micronutrient targets** for now: the data is too patchy to be right (MM-49). *Reopen if* the food sources' coverage is measured and
  found adequate.
- **No calorie or macro estimation from a meal photo** (MM-44). *Reopen if* an on-device method's error is measured and acceptable.

**Body and measurement**
- **No body-fat percentage from a photo, a smart scale reading taken at face value, or any single measurement** (MM-34).
- **No "ideal weight", "ideal body" or "goal physique" imagery, and no comparison with other users.**
- **No body-fat or muscle figures stated more precisely than they are known**: no "you gained 0.9 kg of muscle" (MM-133).
- **No BMI as a headline number.** It is used internally for the underweight guard (MM-111) and the protein reference weight (MM-120) only.

**Training**
- **No training programs, periodization, deload scheduling or exercise prescription** (MM-79). The app logs, tracks strength and volume,
  and suggests the next set.
- **No cardio prescriptions and no "burn it off".** The only activity suggestion anywhere is more daily walking as one option in a stall
  (MM-140).

**Health**
- **No diagnosis, no condition named to a user, no interpretation of lab values, no medication advice** (MM-96, MM-113).
- **No hormone, thyroid, cortisol or "adrenal" explanations for progress.**

**Product**
- **No social feed, leaderboards, challenges or public sharing of weight** (MM-74).
- **No streaks or rewards tied to weight, deficit or under-eating** (MM-92).
- **No AI-generated advice at run time** (MM-141). Every sentence the coach says is a reviewed rule.
- **No engagement notifications**: nothing is sent to bring the user back for its own sake (MM-146).

## Description
A `docs/non-goals.md` with the list above, each item with its reason, the ticket that holds the detail, and the condition under which it
would be reconsidered. Linked from the contributor guide. The parts that can be enforced are enforced by tests elsewhere (banned words,
MM-108; forbidden insight subjects, MM-141).

## Acceptance Criteria
```gherkin
Scenario: The document exists
  Then docs/non-goals.md lists every item above with a reason and a reopening condition, and the contributor guide links to it

Scenario: A proposal that contradicts it
  Given a ticket proposing a listed non-goal
  Then it is not accepted unless it cites the reopening condition and shows it has been met

Scenario: No drift in the app
  Then the banned-word test (MM-108) includes "starvation mode", "metabolic damage", "toning", "burn off", "earn" and "cheat"
```

## Notes
- Priority: could-have as a document; write it early because it is cheap and prevents work.
- The product owner should read this list as closely as any feature: each line closes a door. Several are the panel's judgement and not
  previously decided (meal plans, supplements, fasting windows, micronutrients, AI advice at run time).
- The fixed product constraint that the app models biological sex as male or female and nothing else (MM-14) is a decision already
  recorded, not a non-goal to be argued here.

## Progress (built and verified)
- `docs/non-goals.md` lists all 25 items, each with its reason, the tickets that hold the detail, and the condition under which it would be reconsidered. `AGENTS.md` links it and says a change that proposes one needs the reopen condition met.
- The banned-word test now also fails on "starvation mode", "metabolic damage" and "toning" ("burn off", "earn" and "cheat" were already there).
- **Where the ticket gave no reason**: it listed 12 items without one. I wrote their reasons and marked them *(panel)* in the document, which says plainly that these are the review panel's positions and not decisions the product owner has made. Read them as closely as any feature: meal plans, supplements, fasting windows, micronutrients, weight-cut tools, contest preparation, body-fat from a single measurement, comparison imagery, hormone explanations, and the product items.
- **Not verified**: that every one of the 25 is something the product owner agrees with (only they can say).
