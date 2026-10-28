import type { CoachAiProvider } from '../../domain/integration/CoachAiProvider';
import type { CoachAiStore } from '../../domain/integration/CoachAiStore';
import type { CoachNarrationOutcome } from '../../domain/integration/CoachNarrationOutcome';
import type { CoachNarrationRequest } from '../../domain/integration/CoachNarrationRequest';
import type { CoachNarrator } from '../../domain/integration/CoachNarrator';
import type { CoachTool } from '../../domain/integration/CoachTool';
import type { CoachToolAnswer } from '../../domain/integration/CoachToolAnswer';
import type { JsonHttp } from '../../domain/integration/JsonHttp';
import type { JsonResponse } from '../../domain/integration/JsonResponse';
import { whyCoachNarrationRejected } from './whyCoachNarrationRejected';

// gemini-2.5-flash is retired for new keys: the owner's phone got 404 "no longer available to new users" (2026-10-28, MM-671).
const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';
const openAiEndpoint = 'https://api.openai.com/v1/chat/completions';
const anthropicEndpoint = 'https://api.anthropic.com/v1/messages';
/** Room for four sentences, and for what Gemini thinks first, which counts against the same limit (MM-671). */
const maxOutputTokens = 1024;
/** A saturated (503) or rate-limited (429) provider is asked again after each of these waits (the owner's 503, MM-671). */
const retryAfterMs: readonly number[] = [1000, 2500];
const retried = new Set([429, 503]);
/** Rounds of tool calls a model may make before it must answer in words (MM-685, chosen without asking). */
const maxToolRounds = 8;

/** A tool the model asked for, by the id the provider gave the call. */
interface ToolCall {
  readonly id: string;
  readonly name: string;
  readonly input: unknown;
}

/** What one answer from the provider held: words, or calls for tools, or both. */
interface Turn {
  readonly text: string;
  readonly calls: readonly ToolCall[];
  /** The assistant's message as the provider gave it, sent back as the conversation goes on. */
  readonly message: unknown;
}

/**
 * One provider's conversation (MM-685): the request body as it stands,
 * how an answer is read, and how the tools' answers are appended so the
 * model goes on. Each provider carries tools and their results in its own
 * form.
 */
interface Conversation {
  body(): unknown;
  read(body: unknown): Turn;
  answered(turn: Turn, answers: readonly { readonly call: ToolCall; readonly answer: CoachToolAnswer }[]): void;
}

const asRecord = (value: unknown): Record<string, unknown> => (value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {});
const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function geminiConversation(request: CoachNarrationRequest): Conversation {
  const contents: unknown[] = [{ role: 'user', parts: [{ text: request.userPrompt }] }];
  const tools = request.toolbox?.tools;
  return {
    body: () => ({
      systemInstruction: { parts: [{ text: request.systemPrompt }] },
      contents,
      // Gemini 3.8 takes a thinking level, never the older budget (a 400) nor a temperature; its thought
      // counts against maxOutputTokens, so the limit leaves room for it (ai.google.dev, MM-671).
      generationConfig: { maxOutputTokens, thinkingConfig: { thinkingLevel: 'low' } },
      ...(tools === undefined || tools.length === 0
        ? {}
        : { tools: [{ functionDeclarations: tools.map((t) => ({ name: t.name, description: t.description, parameters: t.input })) }] }),
    }),
    read: (body) => {
      const content = asRecord(asRecord(asList(asRecord(body).candidates)[0]).content);
      // A thought summary, when one is returned, is a part marked `thought`; the words are the rest.
      const parts = asList(content.parts).map(asRecord).filter((part) => part.thought !== true);
      const text = parts.map((part) => (typeof part.text === 'string' ? part.text : '')).join('').trim();
      const calls = parts.flatMap((part, at): ToolCall[] => {
        const call = asRecord(part.functionCall);
        return typeof call.name === 'string' ? [{ id: `${at}`, name: call.name, input: call.args ?? {} }] : [];
      });
      return { text, calls, message: { role: 'model', parts: asList(content.parts) } };
    },
    answered: (turn, answers) => {
      contents.push(turn.message);
      contents.push({ role: 'user', parts: answers.map(({ call, answer }) => ({ functionResponse: { name: call.name, response: { result: answer.result } } })) });
    },
  };
}

function openAiConversation(request: CoachNarrationRequest): Conversation {
  const messages: unknown[] = [
    { role: 'system', content: request.systemPrompt },
    { role: 'user', content: request.userPrompt },
  ];
  const tools = request.toolbox?.tools;
  return {
    body: () => ({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: maxOutputTokens,
      messages,
      ...(tools === undefined || tools.length === 0
        ? {}
        : { tools: tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input } })) }),
    }),
    read: (body) => {
      const message = asRecord(asRecord(asList(asRecord(body).choices)[0]).message);
      const text = typeof message.content === 'string' ? message.content.trim() : '';
      const calls = asList(message.tool_calls).flatMap((raw): ToolCall[] => {
        const call = asRecord(raw);
        const fn = asRecord(call.function);
        if (typeof call.id !== 'string' || typeof fn.name !== 'string') return [];
        let input: unknown = {};
        try {
          input = typeof fn.arguments === 'string' && fn.arguments.trim() !== '' ? JSON.parse(fn.arguments) : {};
        } catch {
          input = {};
        }
        return [{ id: call.id, name: fn.name, input }];
      });
      return { text, calls, message };
    },
    answered: (turn, answers) => {
      messages.push(turn.message);
      for (const { call, answer } of answers) messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(answer.result) });
    },
  };
}

function anthropicConversation(request: CoachNarrationRequest): Conversation {
  const messages: unknown[] = [{ role: 'user', content: request.userPrompt }];
  const tools = request.toolbox?.tools;
  return {
    body: () => ({
      // claude-3-5-haiku-latest is retired (the owner's 404, 2026-10-28). Haiku 5.5 is the current fast model;
      // it refuses a temperature and thinks by default, which a few sentences do not need (MM-671).
      model: 'claude-haiku-5-5',
      max_tokens: maxOutputTokens,
      thinking: { type: 'disabled' },
      system: request.systemPrompt,
      messages,
      ...(tools === undefined || tools.length === 0 ? {} : { tools: tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.input })) }),
    }),
    read: (body) => {
      // The words are the text blocks; a thinking block, when the model returns one, comes before them.
      const content = asList(asRecord(body).content).map(asRecord);
      const text = content
        .filter((block) => block.type === 'text' || (block.type === undefined && typeof block.text === 'string'))
        .map((block) => (typeof block.text === 'string' ? block.text : ''))
        .join('')
        .trim();
      const calls = content.flatMap((block): ToolCall[] =>
        block.type === 'tool_use' && typeof block.id === 'string' && typeof block.name === 'string' ? [{ id: block.id, name: block.name, input: block.input ?? {} }] : [],
      );
      return { text, calls, message: { role: 'assistant', content: asList(asRecord(body).content) } };
    },
    answered: (turn, answers) => {
      messages.push(turn.message);
      messages.push({
        role: 'user',
        content: answers.map(({ call, answer }) => ({ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(answer.result) })),
      });
    },
  };
}

const conversations: Readonly<Record<Exclude<CoachAiProvider, 'none'>, (request: CoachNarrationRequest) => Conversation>> = {
  gemini: geminiConversation,
  openai: openAiConversation,
  anthropic: anthropicConversation,
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
 * A request with a toolbox (MM-685) is a conversation: each tool the model
 * calls is answered by the app and the model asked again, up to
 * `maxToolRounds`, and the numbers in the tools' answers join those it may
 * say.
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

    const conversation = conversations[config.provider](request);
    const allowedNumbers = [...request.allowedNumbers];
    let candidate: string | undefined;
    try {
      for (let round = 0; ; round += 1) {
        let response = await this.post(config.provider, apiKey, conversation.body());
        // "This model is currently experiencing high demand": a spike passes in a moment, so it is asked again.
        for (const ms of retryAfterMs) {
          if (!retried.has(response.statusCode)) break;
          await this.wait(ms);
          response = await this.post(config.provider, apiKey, conversation.body());
        }
        if (response.statusCode !== 200) {
          return { kind: 'refused', status: response.statusCode, detail: errorMessageOf(response.body) };
        }
        const turn = conversation.read(response.body);
        const toolbox = request.toolbox;
        if (turn.calls.length === 0 || toolbox === undefined) {
          candidate = turn.text;
          break;
        }
        // A model that only ever asks for tools is one with no words (MM-685).
        if (round >= maxToolRounds) return { kind: 'empty' };
        const answers: { call: ToolCall; answer: CoachToolAnswer }[] = [];
        for (const call of turn.calls) {
          const answer = await answerOf(toolbox, call);
          allowedNumbers.push(...answer.numbers);
          answers.push({ call, answer });
        }
        conversation.answered(turn, answers);
      }
    } catch (error) {
      return { kind: 'unreachable', detail: error instanceof Error ? error.message : String(error) };
    }
    if (candidate === undefined || candidate === '') return { kind: 'empty' };
    const reason = whyCoachNarrationRejected(candidate, {
      protectedPath: request.protectedPath,
      proteinUnrecoverable: request.proteinUnrecoverable,
      allowedNumbers,
    });
    if (reason !== undefined) return { kind: 'rejected', text: candidate, reason };
    this.cache.set(fullKey, candidate);
    return { kind: 'narrated', text: candidate, cached: false };
  }

  private post(provider: Exclude<CoachAiProvider, 'none'>, apiKey: string, body: unknown): Promise<JsonResponse> {
    switch (provider) {
      case 'gemini':
        return this.http.postJson(new URL(geminiEndpoint), body, { headers: { 'x-goog-api-key': apiKey } });
      case 'openai':
        return this.http.postJson(new URL(openAiEndpoint), body, { headers: { Authorization: `Bearer ${apiKey}` } });
      case 'anthropic':
        return this.http.postJson(new URL(anthropicEndpoint), body, {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        });
    }
  }
}

/** A tool's answer, or the error it raised, said to the model as data (MM-685); an unknown tool is an error too. */
async function answerOf(toolbox: { readonly tools: readonly CoachTool[]; call(name: string, input: unknown): Promise<CoachToolAnswer> }, call: ToolCall): Promise<CoachToolAnswer> {
  if (!toolbox.tools.some((tool) => tool.name === call.name)) return { result: { error: `No tool called ${call.name}.` }, numbers: [] };
  try {
    return await toolbox.call(call.name, call.input);
  } catch (error) {
    return { result: { error: error instanceof Error ? error.message : String(error) }, numbers: [] };
  }
}
