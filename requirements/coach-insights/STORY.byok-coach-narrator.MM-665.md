---
id: MM-665
status: done
component: coach-insights
related: [MM-159, MM-244, MM-364, MM-663, MM-664]
---

# Story: Optional BYOK coaching narrator (Gemini, OpenAI, Anthropic) with state-hash cache and deterministic fallback

## Context
Deterministic pre-calculation (`ExecutiveBrief` and `MealBreakdownAnalysis`, MM-663) establishes the exact numbers, runway state, and swap candidates, and pairs them with offline whole-situation paragraph archetypes. Users who want natural, varied human phrasing without subscription infrastructure can bring their own API key (BYOK) for Google Gemini (AI Studio), OpenAI, or Anthropic.

## Decisions
- **Multi-provider BYOK behind narrow interfaces (MM-159)**:
  - `CoachAiProvider` (`'none' | 'gemini' | 'openai' | 'anthropic'`), `CoachAiConfig`, and `CoachAiStore` (`watchConfig()`, `saveConfig(config)`) in `src/domain/integration/`.
  - `LocalStorageCoachAiStore` in `src/platform/` keeps the user's API key on the device and out of exported SQLite backup files; `InMemoryCoachAiStore` in `src/fixtures/` backs tests and stories; both pass `test/contracts/coachAiStoreContract.ts`.
  - `CoachNarrationRequest` and `CoachNarrator` in `src/domain/integration/`.
  - `HttpCoachNarrator` in `src/format/coach/` calls Gemini (`generativelanguage.googleapis.com`), OpenAI (`api.openai.com`), or Anthropic (`api.anthropic.com`) over `JsonHttp.postJson`, caches verified narrations by `(provider, cacheKey)` so revisiting a screen with unchanged state makes zero network calls, runs `verifyCoachNarration` on every response, and falls back to `request.fallbackText` on any network error, non-200 status, or verification failure.
  - `InMemoryCoachNarrator` in `src/fixtures/` records requests and answers from memory for tests and stories.
- **Settings > Coach UI**:
  - In `CoachSettingsSection.tsx`, add a row to choose the AI coaching provider (`Off (built-in coach)`, `Google Gemini`, `OpenAI`, `Anthropic`) and, when a provider is chosen, an API key field to save or clear the key.

## Description
Add `postJson` to `JsonHttp`, implement `CoachAiStore` and `CoachNarrator` with their implementations and contract tests, and expose provider and API key configuration in `Settings > Coach`.

## Acceptance Criteria
```gherkin
Scenario: Offline or no key configured
  Given CoachAiConfig has provider "none" or an empty API key
  When CoachNarrator.narrate is called
  Then it returns fallbackText immediately and makes zero HTTP requests

Scenario: BYOK provider configured (Gemini, OpenAI, or Anthropic)
  Given a valid API key and provider are saved in CoachAiStore
  When CoachNarrator.narrate is called with an ExecutiveBrief or MealBreakdownAnalysis request
  Then it posts the prompt to the chosen provider, verifies the returned text with verifyCoachNarration, and caches the result by cacheKey

Scenario: Hallucinated number or failed request falls back to Track 1
  Given the provider returns a number not in allowedNumbers or throws a network error
  When CoachNarrator.narrate is called
  Then it returns the deterministic fallbackText
```

## Progress (built)
- Extended `JsonHttp`, `CapacitorJsonHttp`, and `InMemoryJsonHttp` with `postJson`.
- Added `CoachAiProvider`, `CoachAiConfig`, `CoachAiStore`, `LocalStorageCoachAiStore`, `InMemoryCoachAiStore`, and `coachAiStoreContract`.
- Added `CoachNarrationRequest`, `CoachNarrator`, `HttpCoachNarrator`, `InMemoryCoachNarrator`, `executiveBriefNarrationRequest`, and `mealBreakdownNarrationRequest`.
- Wired `coachAi` and `coachNarrator` in `openAppServices.ts` and `fixtureServices.ts`, and added the provider chooser and API key entry to `CoachSettingsSection.tsx`.
- Guarded by `test/format/httpCoachNarrator.test.ts` and `test/platform/coachAiStore.test.ts`.
