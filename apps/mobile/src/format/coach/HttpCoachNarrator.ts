import type { CoachAiProvider } from '../../domain/integration/CoachAiProvider';
import type { CoachAiStore } from '../../domain/integration/CoachAiStore';
import type { CoachNarrationRequest } from '../../domain/integration/CoachNarrationRequest';
import type { CoachNarrator } from '../../domain/integration/CoachNarrator';
import type { JsonHttp } from '../../domain/integration/JsonHttp';
import { verifyCoachNarration } from './verifyCoachNarration';

const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const openAiEndpoint = 'https://api.openai.com/v1/chat/completions';
const anthropicEndpoint = 'https://api.anthropic.com/v1/messages';

function extractGeminiText(body: unknown): string | undefined {
  const candidates = (body as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] } | undefined)?.candidates;
  const text = candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === 'string' ? text.trim() : undefined;
}

function extractOpenAiText(body: unknown): string | undefined {
  const choices = (body as { choices?: { message?: { content?: unknown } }[] } | undefined)?.choices;
  const text = choices?.[0]?.message?.content;
  return typeof text === 'string' ? text.trim() : undefined;
}

function extractAnthropicText(body: unknown): string | undefined {
  const content = (body as { content?: { text?: unknown }[] } | undefined)?.content;
  const text = content?.[0]?.text;
  return typeof text === 'string' ? text.trim() : undefined;
}

/**
 * `CoachNarrator` that calls the user's chosen BYOK provider (Gemini, OpenAI,
 * or Anthropic) over `JsonHttp.postJson`, caches verified responses by state
 * hash (`cacheKey`), and falls back to `request.fallbackText` whenever BYOK is
 * off, the network is unreachable, or `verifyCoachNarration` rejects the
 * model's response (MM-665).
 */
export class HttpCoachNarrator implements CoachNarrator {
  private readonly store: CoachAiStore;
  private readonly http: JsonHttp;
  private readonly cache = new Map<string, string>();

  constructor({ store, http }: { store: CoachAiStore; http: JsonHttp }) {
    this.store = store;
    this.http = http;
  }

  async narrate(request: CoachNarrationRequest): Promise<string> {
    const config = await this.store.loadConfig();
    const apiKey = config.apiKey.trim();
    if (config.provider === 'none' || apiKey === '') {
      return request.fallbackText;
    }

    const fullKey = `${config.provider}|${request.cacheKey}`;
    const cached = this.cache.get(fullKey);
    if (cached !== undefined) return cached;

    try {
      const candidate = await this.requestFromProvider(config.provider, apiKey, request);
      if (
        candidate !== undefined &&
        verifyCoachNarration(candidate, {
          protectedPath: request.protectedPath,
          proteinUnrecoverable: request.proteinUnrecoverable,
          allowedNumbers: request.allowedNumbers,
        })
      ) {
        this.cache.set(fullKey, candidate);
        return candidate;
      }
    } catch {
      // Network failure or timeout: fall back cleanly to the deterministic archetype.
    }
    return request.fallbackText;
  }

  private async requestFromProvider(
    provider: Exclude<CoachAiProvider, 'none'>,
    apiKey: string,
    request: CoachNarrationRequest,
  ): Promise<string | undefined> {
    switch (provider) {
      case 'gemini': {
        const response = await this.http.postJson(
          new URL(geminiEndpoint),
          {
            systemInstruction: { parts: [{ text: request.systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: request.userPrompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 180 },
          },
          { headers: { 'x-goog-api-key': apiKey } },
        );
        return response.statusCode === 200 ? extractGeminiText(response.body) : undefined;
      }
      case 'openai': {
        const response = await this.http.postJson(
          new URL(openAiEndpoint),
          {
            model: 'gpt-4o-mini',
            temperature: 0.2,
            max_tokens: 180,
            messages: [
              { role: 'system', content: request.systemPrompt },
              { role: 'user', content: request.userPrompt },
            ],
          },
          { headers: { Authorization: `Bearer ${apiKey}` } },
        );
        return response.statusCode === 200 ? extractOpenAiText(response.body) : undefined;
      }
      case 'anthropic': {
        const response = await this.http.postJson(
          new URL(anthropicEndpoint),
          {
            model: 'claude-3-5-haiku-latest',
            max_tokens: 180,
            temperature: 0.2,
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
        return response.statusCode === 200 ? extractAnthropicText(response.body) : undefined;
      }
    }
  }
}
