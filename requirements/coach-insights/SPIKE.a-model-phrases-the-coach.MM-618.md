---
id: MM-618
status: proposed
component: coach-insights
related: [MM-617, MM-604, MM-141, MM-56]
---

# Spike: A small on-device model phrases the coach

## Context
MM-617 makes the coach blunt and specific: rules choose the facts and the orders (`CoachAdvice`), and templates say them. On
2026-10-24 the owner asked whether a model is needed for the coach to sound human, and how a rule engine avoids being
hard-coded to one day.

What was agreed:
- The rules stay the source of truth for every number, food and order. A model only phrases them.
- No one is excluded: phones without a model get the templates.
- The owner's constraints:
  - **Permissive licensing only.**
  - **The output is 3–5 sentences in most cases, so don't chase diminishing returns:** the smallest model that does the job,
    and stop at the first that passes.

## Decisions
By the product owner, 2026-10-24:
- **Licenses:**
  - Only permissively licensed weights (Apache 2.0 or MIT).
  - Models under custom terms (Llama, Gemma) are out.
  - System models the phone already has (Apple Foundation Models on iOS 26, Gemini Nano on Android) ship no weights, so they
    are allowed as a tier.
- **Small and sufficient:** 3–5 sentences of phrasing, not open conversation.

Choices made without asking (say if any is wrong):
- **Tiers:** templates everywhere; the phone's own model where present; an optional downloaded model for the rest, delivered
  like the food packs (MM-56) and never in the app binary.
- **Candidates, in order, stopping at the first that passes:**
  1. the system models (no download);
  2. Qwen2.5 1.5B Instruct (Apache 2.0; check the license of the exact size used, since other sizes differ);
  3. SmolLM2 1.7B Instruct (Apache 2.0);
  4. Phi-4-mini or Phi-3.5-mini (MIT), only if both 1.5B-class models fail.

  DeepSeek's R1 distills (MIT) are not tried: they are reasoning models, which spend their output thinking aloud and are wordy
  for 3–5 sentences.
- **First, check what is current:** newer permissive small models may exist. Replace a candidate only if a newer one is
  clearly better at the same size and license.
- **The guardrail:** the model gets `CoachAdvice` facts as structured input. A checker rejects any output with a number, food
  name or order not in the facts, or a word on the coach's banned list (MM-617); the templates speak instead.
- **When it runs:** generated in the background when the findings change, and cached. Never on the tap.

## Description
Answer, with evidence:
1. Do the system models on iOS and Android take structured facts and return 3–5 sentences under constraint? What are their
   limits (devices, rate, context, availability checks)?
2. For the first downloaded candidate:
   - What are the download size and memory at 4-bit?
   - How long do 5 sentences take on the oldest phone the app supports?
   - Which runtime fits as a Capacitor plugin on both platforms (llama.cpp or similar; its license must be permissive too)?
3. Quality, on MM-617's fixed scenarios (the buffet day, a biscuits-and-gravy streak, a fat week, a missed training week, a
   clean day):
   - the share of outputs that pass the checker;
   - side by side with the templates, for the owner to judge.
4. A recommendation: which tiers to build, which model, and the tickets to build them.

## Acceptance Criteria
```gherkin
Scenario: The answer is on record
  When the spike is done
  Then this ticket's Progress gives, for each tier tried, the license, size, memory, time on the oldest supported phone, the checker pass rate on the fixed scenarios, and the side-by-side texts
  And it stops at the first downloaded candidate that passes 95% of the checker and the owner's read

Scenario: Licenses
  Then every weight and runtime named in the recommendation is Apache 2.0 or MIT, or a system model the phone already has
```

## Notes
The non-goal "No AI-generated advice at run time" (MM-141) has to be amended by the owner before anything here ships. Its
intent stays: every fact and order is a reviewed rule; only the wording is generated.
