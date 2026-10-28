import type { CoachAiProvider } from '../../domain/integration/CoachAiProvider';
import type { CoachAiStore } from '../../domain/integration/CoachAiStore';
import type { CoachNarrationOutcome } from '../../domain/integration/CoachNarrationOutcome';
import type { CoachNarrationRequest } from '../../domain/integration/CoachNarrationRequest';
import type { CoachNarrator } from '../../domain/integration/CoachNarrator';
import type { JsonHttp } from '../../domain/integration/JsonHttp';
import type { JsonResponse } from '../../domain/integration/JsonResponse';
import { whyCoachNarrationRejected } from './whyCoachNarrationRejected';

// gemini-2.5-flash is retired for new keys: the owner's phone got 404 "no longer available to new users" (2026-10-28, MM-671).
const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';
const openAiEndpoint = 'https://api.openai.com/v1/chat/completions';
const anthropicEndpoint = 'https://api.anthropic.com/v1/messages';
/** Room for three sentences, and for what Gemini thinks first, which counts against the same limit (MM-671). */
const maxOutputTokens = 1024;
/** A saturated (503) or rate-limited (429) provider is asked again after each of these waits (the owner's 503, MM-671). */
const retryAfterMs: readonly number[] = [1000, 2500];
const retried = new Set([429, 503]);

function extractGeminiText(body: unknown): string | undefined {
  const candidates = (body as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] } | undefined)?.candidates;
  // A thought summary, when one is returned, is a part marked `thought`; the words are the rest.
  const parts = (candidates?.[0]?.content?.parts ?? []) as { text?: unknown; thought?: unknown }[];
  const text = parts
    .filter((part) => part.thought !== true)
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('');
  return text.trim();
}

function extractOpenAiText(body: unknown): string | undefined {
  const choices = (body as { choices?: { message?: { content?: unknown } }[] } | undefined)?.choices;
  const text = choices?.[0]?.message?.content;
  return typeof text === 'string' ? text.trim() : undefined;
}

function extractAnthropicText(body: unknown): string | undefined {
  // The words are the first text block; a thinking block, when the model returns one, comes before it.
  const content = (body as { content?: { type?: unknown; text?: unknown }[] } | undefined)?.content ?? [];
  const text = content.find((block) => block.type === 'text' || (block.type === undefined && typeof block.text === 'string'))?.text;
  return typeof text === 'string' ? text.trim() : undefined;
}

const extractText: Readonly<Record<Exclude<CoachAiProvider, 'none'>, (body: unknown) => string | undefined>> = {
  gemini: extractGeminiText,
  openai: extractOpenAiText,
  anthropic: extractAnthropicText,
};

/** The provider's own message for an error status; all three put it at `error.message`. */
function errorMessageOf(body: unknown): string {
  const message = (body as { error?: { message?: unknown } } | undefined)?.error?.message;
  if (typeof message === 'string' && message.trim() !== '') return message.trim();
  if (body === undefined || body === null || body === '') return '';
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}

/**
 * `CoachNarrator` that calls the user's chosen BYOK provider (Gemini, OpenAI,
 * or Anthropic) over `JsonHttp.postJson`, caches verified responses by state
 * hash (`cacheKey`), and falls back to `request.fallbackText` whenever BYOK is
 * off, the network is unreachable, or `verifyCoachNarration` rejects the
 * model's response (MM-665). `probe` tells what came of one request (MM-671).
 */
export class HttpCoachNarrator implements CoachNarrator {
  private readonly store: CoachAiStore;
  private readonly http: JsonHttp;
  private readonly wait: (ms: number) => Promise<void>;
  private readonly cache = new Map<string, string>();

  constructor({
    store,
    http,
    wait = (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  }: {
    store: CoachAiStore;
    http: JsonHttp;
    /** How a retry waits; a test passes one that does not. */
    wait?: (ms: number) => Promise<void>;
  }) {
    this.store = store;
    this.http = http;
    this.wait = wait;
  }

  async narrate(request: CoachNarrationRequest, options?: { readonly fresh?: boolean }): Promise<string> {
    const outcome = await this.attempt(request, options?.fresh === true);
    return outcome.kind === 'narrated' ? outcome.text : request.fallbackText;
  }

  probe(request: CoachNarrationRequest, options?: { readonly fresh?: boolean }): Promise<CoachNarrationOutcome> {
    return this.attempt(request, options?.fresh === true);
  }

  private async attempt(request: CoachNarrationRequest, fresh: boolean): Promise<CoachNarrationOutcome> {
    const config = await this.store.loadConfig();
    const apiKey = config.apiKey.trim();
    if (config.provider === 'none' || apiKey === '') return { kind: 'off' };

    const fullKey = `${config.provider}|${request.cacheKey}`;
    if (!fresh) {
      const cached = this.cache.get(fullKey);
      if (cached !== undefined) return { kind: 'narrated', text: cached, cached: true };
    }

    let response: JsonResponse;
    try {
      response = await this.requestFromProvider(config.provider, apiKey, request);
      // "This model is currently experiencing high demand": a spike passes in a moment, so it is asked again.
      for (const ms of retryAfterMs) {
        if (!retried.has(response.statusCode)) break;
        await this.wait(ms);
        response = await this.requestFromProvider(config.provider, apiKey, request);
      }
    } catch (error) {
      return { kind: 'unreachable', detail: error instanceof Error ? error.message : String(error) };
    }
    if (response.statusCode !== 200) {
      return { kind: 'refused', status: response.statusCode, detail: errorMessageOf(response.body) };
    }
    const candidate = extractText[config.provider](response.body);
    if (candidate === undefined || candidate === '') return { kind: 'empty' };
    const reason = whyCoachNarrationRejected(candidate, {
      protectedPath: request.protectedPath,
      proteinUnrecoverable: request.proteinUnrecoverable,
      allowedNumbers: request.allowedNumbers,
    });
    if (reason !== undefined) return { kind: 'rejected', text: candidate, reason };
    this.cache.set(fullKey, candidate);
    return { kind: 'narrated', text: candidate, cached: false };
  }

  private requestFromProvider(
    provider: Exclude<CoachAiProvider, 'none'>,
    apiKey: string,
    request: CoachNarrationRequest,
  ): Promise<JsonResponse> {
    switch (provider) {
      case 'gemini':
        return this.http.postJson(
          new URL(geminiEndpoint),
          {
            systemInstruction: { parts: [{ text: request.systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: request.userPrompt }] }],
            // Gemini 3.8 takes a thinking level, never the older budget (a 400) nor a temperature; its thought
            // counts against maxOutputTokens, so the limit leaves room for it (ai.google.dev, MM-671).
            generationConfig: { maxOutputTokens, thinkingConfig: { thinkingLevel: 'low' } },
          },
          { headers: { 'x-goog-api-key': apiKey } },
        );
      case 'openai':
        return this.http.postJson(
          new URL(openAiEndpoint),
          {
            model: 'gpt-4o-mini',
            temperature: 0.2,
            max_tokens: maxOutputTokens,
            messages: [
              { role: 'system', content: request.systemPrompt },
              { role: 'user', content: request.userPrompt },
            ],
          },
          { headers: { Authorization: `Bearer ${apiKey}` } },
        );
      case 'anthropic':
        return this.http.postJson(
          new URL(anthropicEndpoint),
          {
            // claude-3-5-haiku-latest is retired (the owner's 404, 2026-10-28). Haiku 5.5 is the current fast model;
            // it refuses a temperature and thinks by default, which three sentences do not need (MM-671).
            model: 'claude-haiku-5-5',
            max_tokens: maxOutputTokens,
            thinking: { type: 'disabled' },
            system: request.systemPrompt,
            messages: [{ role: 'user', content: request.userPrompt }],
          },
          {
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
          },
        );
    }
  }
}
