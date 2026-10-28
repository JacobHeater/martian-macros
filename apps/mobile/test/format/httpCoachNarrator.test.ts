import { describe, expect, it } from 'vitest';
import { executiveBriefOf } from '../../src/engine/analysis/executiveBriefOf';
import { mealBreakdownAnalysisOf } from '../../src/engine/analysis/mealBreakdownAnalysisOf';
import { InMemoryCoachAiStore } from '../../src/fixtures/InMemoryCoachAiStore';
import { InMemoryJsonHttp } from '../../src/fixtures/InMemoryJsonHttp';
import { executiveBriefNarrationRequest } from '../../src/format/coach/executiveBriefNarrationRequest';
import { HttpCoachNarrator } from '../../src/format/coach/HttpCoachNarrator';
import { mealBreakdownNarrationRequest } from '../../src/format/coach/mealBreakdownNarrationRequest';
import { food, inputOf, today, yesterday } from '../engine/support/foodAnalysis';

describe('HttpCoachNarrator (MM-665)', () => {
  const sampleBrief = () =>
    executiveBriefOf(
      inputOf([
        { date: yesterday, entries: [food(yesterday, 'dinner', 'Chicken breast', 2200, 175, 45)] },
        { date: today, entries: [food(today, 'lunch', 'Cheese pizza', 2231, 56, 98)] },
      ]),
      today,
    );

  it('returns the deterministic archetype with zero network requests when BYOK is off or has no key', async () => {
    const store = new InMemoryCoachAiStore();
    const http = new InMemoryJsonHttp();
    const narrator = new HttpCoachNarrator({ store, http });
    const req = executiveBriefNarrationRequest(sampleBrief());

    const text = await narrator.narrate(req);
    expect(text).toBe(req.fallbackText);
    expect(http.requests).toHaveLength(0);
  });

  it('calls Gemini, verifies the response, and caches by cacheKey so repeat calls make 0 requests', async () => {
    const store = new InMemoryCoachAiStore();
    await store.saveConfig({ provider: 'gemini', apiKey: 'AIzaSyKey' });
    const http = new InMemoryJsonHttp().answer('generativelanguage.googleapis.com', {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'You have 169 kcal left today and 114 g of protein remaining. Hold your calorie ceiling tonight and front-load protein in the morning.',
              },
            ],
          },
        },
      ],
    });
    const narrator = new HttpCoachNarrator({ store, http });
    const req = executiveBriefNarrationRequest(sampleBrief());

    const first = await narrator.narrate(req);
    expect(first).toContain('You have 169 kcal left today');
    expect(http.requests).toHaveLength(1);
    expect(http.requests[0]?.headers['x-goog-api-key']).toBe('AIzaSyKey');

    const second = await narrator.narrate(req);
    expect(second).toBe(first);
    expect(http.requests).toHaveLength(1);
  });

  it('supports OpenAI and Anthropic providers', async () => {
    const store = new InMemoryCoachAiStore();
    const http = new InMemoryJsonHttp()
      .answer('api.openai.com', {
        choices: [
          {
            message: {
              content:
                'With 169 kcal left and 114 g of protein still open, the gap cannot fit tonight. Protect your calorie cap and front-load protein in the morning.',
            },
          },
        ],
      })
      .answer('api.anthropic.com', {
        content: [
          {
            text: '169 kcal remain against 114 g of protein today. Hold your calorie target tonight and front-load protein at breakfast in the morning.',
          },
        ],
      });
    const narrator = new HttpCoachNarrator({ store, http });
    const req = executiveBriefNarrationRequest(sampleBrief());

    await store.saveConfig({ provider: 'openai', apiKey: 'sk-openai' });
    const openAiText = await narrator.narrate(req);
    expect(openAiText).toContain('With 169 kcal left');

    await store.saveConfig({ provider: 'anthropic', apiKey: 'sk-ant' });
    const anthropicText = await narrator.narrate(req);
    expect(anthropicText).toContain('169 kcal remain');
  });

  it('falls back to the deterministic archetype when the LLM hallucinates numbers or the network fails', async () => {
    const store = new InMemoryCoachAiStore();
    await store.saveConfig({ provider: 'gemini', apiKey: 'AIzaSyKey' });
    const http = new InMemoryJsonHttp().answer('generativelanguage.googleapis.com', {
      candidates: [
        {
          content: {
            parts: [{ text: 'You have 850 kcal left today and 45 g of protein remaining.' }],
          },
        },
      ],
    });
    const narrator = new HttpCoachNarrator({ store, http });
    const mealAnalysis = mealBreakdownAnalysisOf({
      meal: 'lunch',
      mealEntries: [food(today, 'lunch', 'Loaded nachos', 780, 14, 48)],
      dayEntries: [food(today, 'lunch', 'Loaded nachos', 780, 14, 48)],
      candidates: [food(yesterday, 'lunch', 'Turkey breast wrap', 340, 38, 6)],
      kcalTarget: 2400,
      proteinTargetG: 170,
      protectedPath: false,
    });
    const req = mealBreakdownNarrationRequest(mealAnalysis);

    const hallucinated = await narrator.narrate(req);
    expect(hallucinated).toBe(req.fallbackText);

    http.offline = true;
    const offline = await narrator.narrate(req);
    expect(offline).toBe(req.fallbackText);
  });
});
