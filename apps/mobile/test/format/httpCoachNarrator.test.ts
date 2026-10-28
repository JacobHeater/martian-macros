import { describe, expect, it } from 'vitest';
import { executiveBriefOf } from '../../src/engine/analysis/executiveBriefOf';
import { mealBreakdownAnalysisOf } from '../../src/engine/analysis/mealBreakdownAnalysisOf';
import { InMemoryCoachAiStore } from '../../src/fixtures/InMemoryCoachAiStore';
import { InMemoryJsonHttp } from '../../src/fixtures/InMemoryJsonHttp';
import type { JsonHttp } from '../../src/domain/integration/JsonHttp';
import type { JsonResponse } from '../../src/domain/integration/JsonResponse';
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
    )!;

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

// MM-671: what came of an ask is told, so Settings' "Test AI coach" can say why the coach fell back.
describe('HttpCoachNarrator.probe (MM-671)', () => {
  const sampleBrief = () =>
    executiveBriefOf(
      inputOf([
        { date: yesterday, entries: [food(yesterday, 'dinner', 'Chicken breast', 2200, 175, 45)] },
        { date: today, entries: [food(today, 'lunch', 'Cheese pizza', 2231, 56, 98)] },
      ]),
      today,
    )!;
  const gemini = async (http: InMemoryJsonHttp) => {
    const store = new InMemoryCoachAiStore();
    await store.saveConfig({ provider: 'gemini', apiKey: 'AIzaSyKey' });
    return new HttpCoachNarrator({ store, http });
  };
  const answer = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] });

  it('is off with no provider or no key, asking nothing', async () => {
    const http = new InMemoryJsonHttp();
    const narrator = new HttpCoachNarrator({ store: new InMemoryCoachAiStore(), http });
    expect(await narrator.probe(executiveBriefNarrationRequest(sampleBrief()))).toEqual({ kind: 'off' });
    expect(http.requests).toHaveLength(0);
  });

  it('tells the provider’s own message when it refuses the request', async () => {
    const http = new InMemoryJsonHttp().answer(
      'generativelanguage.googleapis.com',
      { error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT' } },
      400,
    );
    const narrator = await gemini(http);
    expect(await narrator.probe(executiveBriefNarrationRequest(sampleBrief()))).toEqual({
      kind: 'refused',
      status: 400,
      detail: 'API key not valid. Please pass a valid API key.',
    });
  });

  it('is unreachable when the request throws, and empty when the answer holds no words', async () => {
    const http = new InMemoryJsonHttp().answer('generativelanguage.googleapis.com', {
      candidates: [{ content: { role: 'model' }, finishReason: 'MAX_TOKENS' }],
    });
    const narrator = await gemini(http);
    const req = executiveBriefNarrationRequest(sampleBrief());
    expect(await narrator.probe(req)).toEqual({ kind: 'empty' });
    http.offline = true;
    expect(await narrator.probe(req)).toEqual({ kind: 'unreachable', detail: 'No connection.' });
  });

  it('names the number that failed the check, with the words that used it', async () => {
    const text = 'You have 850 kcal left today and 45 g of protein remaining. Hold your calorie ceiling tonight.';
    const narrator = await gemini(new InMemoryJsonHttp().answer('generativelanguage.googleapis.com', answer(text)));
    expect(await narrator.probe(executiveBriefNarrationRequest(sampleBrief()))).toEqual({
      kind: 'rejected',
      text,
      reason: 'It used a number not in your figures (850)',
    });
  });

  it('answers from the cache unless asked afresh, and a fresh narrate asks again too', async () => {
    const text = 'You have 169 kcal left today and 114 g of protein remaining. Hold your calorie ceiling tonight and front-load protein in the morning.';
    const http = new InMemoryJsonHttp().answer('generativelanguage.googleapis.com', answer(text));
    const narrator = await gemini(http);
    const req = executiveBriefNarrationRequest(sampleBrief());
    expect(await narrator.probe(req)).toEqual({ kind: 'narrated', text, cached: false });
    expect(await narrator.probe(req)).toEqual({ kind: 'narrated', text, cached: true });
    expect(http.requests).toHaveLength(1);
    expect(await narrator.probe(req, { fresh: true })).toEqual({ kind: 'narrated', text, cached: false });
    expect(http.requests).toHaveLength(2);
    await narrator.narrate(req);
    expect(http.requests).toHaveLength(2);
    await narrator.narrate(req, { fresh: true });
    expect(http.requests).toHaveLength(3);
  });

  it('asks gemini-3.8-flash at a low thinking level with room for the words: 2.5 is retired, a budget is refused', async () => {
    const http = new InMemoryJsonHttp().answer('generativelanguage.googleapis.com', answer('x'));
    const narrator = await gemini(http);
    await narrator.probe(executiveBriefNarrationRequest(sampleBrief()));
    expect(http.requests[0]?.url.pathname).toBe('/v1beta/models/gemini-3.8-flash:generateContent');
    const sent = http.requests[0]?.body as { generationConfig: Record<string, unknown> & { thinkingConfig: Record<string, unknown> } };
    expect(sent.generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'low' });
    expect(sent.generationConfig).not.toHaveProperty('temperature');
    expect(sent.generationConfig['maxOutputTokens']).toBeGreaterThanOrEqual(1024);
  });

  // The owner's phone, 2026-10-28: 503 "This model is currently experiencing high demand ... Please try again later."
  it('asks a saturated provider again, twice, with a wait between, and then takes its answer', async () => {
    const text = 'You have 169 kcal left today and 114 g of protein remaining. Hold your calorie ceiling tonight and front-load protein in the morning.';
    const busy = { statusCode: 503, body: { error: { code: 503, message: 'This model is currently experiencing high demand.' } } };
    const answers: JsonResponse[] = [busy, busy, { statusCode: 200, body: answer(text) }];
    let asked = 0;
    const http: JsonHttp = {
      getJson: () => Promise.reject(new Error('not asked')),
      postJson: async () => {
        asked += 1;
        return answers.shift() ?? busy;
      },
    };
    const waits: number[] = [];
    const store = new InMemoryCoachAiStore();
    await store.saveConfig({ provider: 'gemini', apiKey: 'AIzaSyKey' });
    const narrator = new HttpCoachNarrator({
      store,
      http,
      wait: async (ms) => {
        waits.push(ms);
      },
    });
    const req = executiveBriefNarrationRequest(sampleBrief());
    expect(await narrator.probe(req, { fresh: true })).toEqual({ kind: 'narrated', text, cached: false });
    expect(asked).toBe(3);
    expect(waits).toEqual([1000, 2500]);
    // Still busy after the retries: the refusal is told, with the provider's words, and no fourth ask.
    expect(await narrator.probe(req, { fresh: true })).toEqual({ kind: 'refused', status: 503, detail: 'This model is currently experiencing high demand.' });
    expect(asked).toBe(6);
  });

  // The owner's phone, 2026-10-28: Anthropic 404 "model: claude-3-5-haiku-latest".
  it('asks Anthropic for claude-haiku-5-5 with thinking off and no temperature, and reads past a thinking block', async () => {
    const text = '169 kcal remain against 114 g of protein today. Hold your calorie target tonight and front-load protein at breakfast in the morning.';
    const http = new InMemoryJsonHttp().answer('api.anthropic.com', {
      content: [
        { type: 'thinking', thinking: '' },
        { type: 'text', text },
      ],
    });
    const store = new InMemoryCoachAiStore();
    await store.saveConfig({ provider: 'anthropic', apiKey: 'sk-ant' });
    const narrator = new HttpCoachNarrator({ store, http });
    expect(await narrator.probe(executiveBriefNarrationRequest(sampleBrief()))).toEqual({ kind: 'narrated', text, cached: false });
    const sent = http.requests[0]?.body as Record<string, unknown>;
    expect(sent['model']).toBe('claude-haiku-5-5');
    expect(sent['thinking']).toEqual({ type: 'disabled' });
    expect(sent).not.toHaveProperty('temperature');
    expect(sent['max_tokens']).toBeGreaterThanOrEqual(1024);
  });

  it('reads Gemini’s words past a thought summary, when one is returned', async () => {
    const text = 'You have 169 kcal left today and 114 g of protein remaining. Hold your calorie ceiling tonight and front-load protein in the morning.';
    const http = new InMemoryJsonHttp().answer('generativelanguage.googleapis.com', {
      candidates: [{ content: { parts: [{ text: 'Thinking it over.', thought: true }, { text }] } }],
    });
    const narrator = await gemini(http);
    expect(await narrator.probe(executiveBriefNarrationRequest(sampleBrief()))).toEqual({ kind: 'narrated', text, cached: false });
  });
});
