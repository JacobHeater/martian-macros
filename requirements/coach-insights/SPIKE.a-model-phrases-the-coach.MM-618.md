---
id: MM-618
status: in-progress
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

## Progress
First run, 2026-10-24, on the dev Mac (2016 Intel i7, 4 threads, CPU only; laptop times, not phone times). Runtime: llama.cpp
b11865 (MIT), `llama-server` with each model's own chat template. Harness, prompt, scenarios and every reply are in
`tool/spikes/coach_model/` (`system_prompt.md`, `scenarios/`, `run.py`, `results/`). Seven scenarios, three samples each at
temperature 0.4.

The checker:
- **Fails a reply when it has:** a number not in the facts; anything other than 3–5 sentences; profanity or the banned words;
  anything aimed at the person; "eat less tomorrow"; restriction in the protected path; or a lead without the first fact.
- **Does not judge meaning.** Every reply was also read against the owner's coaching terms.

| Model (Q4_K_M) | License | Size | Checker pass | Speed here | Median per reply |
|---|---|---|---|---|---|
| Qwen2.5 1.5B Instruct | Apache 2.0 | 1,066 MB | 1/21 | 18.8 tok/s | 6.5 s |
| Qwen3 1.7B (no thinking) | Apache 2.0 | 1,056 MB | 0/21 | 14.5 tok/s | 11.0 s |
| SmolLM2 1.7B Instruct | Apache 2.0 | 1,007 MB | 2/21 | 14.0 tok/s | 7.1 s |
| Granite 4.0 h-1b | Apache 2.0 | 859 MB | 0/21 | 18.4 tok/s | 8.6 s |
| Phi-4-mini Instruct (3.8B) | MIT | 2,376 MB | 3/21 | 7.1 tok/s | 14.2 s |

Read, not just scored: no model is usable.
- **Qwen2.5 1.5B** invents facts. "This has caused you to lose 9 pounds." "4 grams short of your minimum of 149" (it was 43
  over). "You skipped the General Tso's chicken, but it's back." It ran to 14 sentences.
- **Qwen3 1.7B** recites the prompt ("Skip it, halve it, swap it, add this, stop here") and leaks field names ("The over_kcal
  is 1054"). On the protected path it said "you ate too much protein… Skip it, halve it", which is unsafe.
- **SmolLM2 1.7B** said "Eat less tomorrow to make up for today", invented "skip the protein today and add a protein shake",
  and on the protected path said "halve your protein food tomorrow". It is unsafe. Its buffet-day reply came closest, by
  copying the facts' orders.
- **Granite 4.0 1B** is the most fluent, in the voice the owner rejected: "Hey there", "one day doesn't define your
  progress", "Keep up the good work!", "a healthier alternative". It also gets facts wrong ("35% of your daily calories").
- **Phi-4-mini 3.8B** comes nearest the owner's voice ("Too much peanut butter for 8 days… Cut it to one tablespoon or swap it
  for Greek yogurt"), but still misreads facts. It called a day 25 kcal under target "Too much", invented "missed your protein
  target by 43 grams", and said "Too much protein today" on the protected path. It is also the slowest, and 2.4 GB.

**Finding.** At 4B and under, with permissive licenses, no model can be trusted to phrase health advice from facts. They
copy, invent, soften, or break the safety path. The failures are about meaning, so a number checker cannot catch them. Not
tried: the system models (Apple Foundation Models needs Apple silicon and macOS 26 or a recent iPhone; Gemini Nano needs a
supported Android phone), and a narrower design where the model rewords a single templated sentence.
