---
id: MM-664
status: done
component: coach-insights
related: [MM-141, MM-144, MM-244, MM-618, MM-663, MM-665]
---

# Task: Amend the no-AI-advice non-goal for optional BYOK coaching narration

## Context
The product owner decided on 2026-10-27 to keep all coaching numbers, targets, swaps, and runway invariants 100% deterministic and offline-capable (Track 1, MM-663), while lifting the blanket ban on runtime LLM text generation for users who choose to supply their own API key (BYOK: Gemini, OpenAI, or Anthropic, Track 2, MM-665).

Because an optional BYOK request sends the deterministic coaching summary figures and food names to the chosen provider using the user's own API key, `docs/non-goals.md`, `MM-144`, the privacy policy (`privacyPolicy.ts`), and the terms of use (`termsOfUse.ts`) must be updated in lockstep (MM-244).

## Decisions
- **Deterministic authority stays unchanged**: no language model computes targets, expenditure, calorie budgets, protein floors, or swaps. The model only phrases the pre-calculated `ExecutiveBrief` or `MealBreakdownAnalysis`, and its output is checked by `verifyCoachNarration` before display.
- **No silent network traffic**: by default (`provider: 'none'`), zero requests are made. A request is made only when the user enters a key for Gemini, OpenAI, or Anthropic in Settings.
- **Privacy policy and terms updated**: name Gemini (`generativelanguage.googleapis.com`), OpenAI (`api.openai.com`), and Anthropic (`api.anthropic.com`) in `privacyPolicy.ts`, `termsOfUse.ts`, and `test/terms/privacyText.test.ts`.

## Description
Amend `docs/non-goals.md` and `requirements/coach-insights/TASK.non-goals.MM-144.md`, and update `apps/mobile/src/terms/privacyPolicy.ts`, `apps/mobile/src/terms/termsOfUse.ts`, and `apps/mobile/test/terms/privacyText.test.ts`.

## Acceptance Criteria
```gherkin
Scenario: Non-goal amendment is recorded
  Then docs/non-goals.md records the 2026-10-27 product-owner amendment for optional BYOK coaching phrasing bounded by verifyCoachNarration

Scenario: Privacy policy and terms match the contacted hosts
  Then test/terms/privacyText.test.ts and test/terms/termsText.test.ts pass with Gemini, OpenAI, and Anthropic named
```

## Progress (built)
- Amended `docs/non-goals.md` and `requirements/coach-insights/TASK.non-goals.MM-144.md` under "No AI-generated advice at run time".
- Updated `apps/mobile/src/terms/privacyPolicy.ts`, `apps/mobile/src/terms/termsOfUse.ts`, and `apps/mobile/test/terms/privacyText.test.ts` to disclose optional BYOK coaching phrasing requests to Gemini, OpenAI, and Anthropic.
