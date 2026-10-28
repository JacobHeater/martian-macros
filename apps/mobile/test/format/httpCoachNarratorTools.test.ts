import { describe, expect, it } from 'vitest';
import type { CoachNarrationRequest } from '../../src/domain/integration/CoachNarrationRequest';
import type { CoachToolbox } from '../../src/domain/integration/CoachToolbox';
import { InMemoryCoachAiStore } from '../../src/fixtures/InMemoryCoachAiStore';
import { InMemoryJsonHttp } from '../../src/fixtures/InMemoryJsonHttp';
import { HttpCoachNarrator } from '../../src/format/coach/HttpCoachNarrator';

/**
 * MM-685: a request with a toolbox is a conversation. Each tool the model
 * calls is answered by the app and the model asked again; the numbers in
 * the tools' answers join those it may say; a model that only ever asks
 * for tools has no words.
 */
const toolbox = (): CoachToolbox & { readonly calls: { name: string; input: unknown }[] } => {
  const calls: { name: string; input: unknown }[] = [];
  return {
    calls,
    tools: [
      { name: 'search_catalog', description: 'Foods by name.', input: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
    ],
    call: async (name, input) => {
      calls.push({ name, input });
      return { result: { foods: [{ name: 'Chicken breast', kcal: 165, proteinG: 31 }] }, numbers: [165, 31] };
    },
  };
};

const request = (box: CoachToolbox): CoachNarrationRequest => ({
  cacheKey: 'meal:test',
  systemPrompt: 'Coach.',
  userPrompt: '{"mealKcal":844}',
  fallbackText: 'Built-in words for the meal.',
  protectedPath: false,
  proteinUnrecoverable: false,
  allowedNumbers: [844],
  toolbox: box,
});

/** Answers in the order the requests come: the first body for the first request, and so on. */
class Scripted extends InMemoryJsonHttp {
  private readonly script: unknown[];
  constructor(script: unknown[]) {
    super();
    this.script = script;
  }
  override async postJson(url: URL, body: unknown, options?: { headers?: Readonly<Record<string, string>> | undefined }) {
    this.requests.push({ url, headers: options?.headers ?? {}, body });
    const next = this.script.shift();
    return { statusCode: 200, body: next };
  }
}

const words = 'The biscuit is the drag at 844 kcal. Chicken breast, 165 kcal for 31 g, gets you closest.';

describe('the tool loop', () => {
  it('Anthropic: a tool_use is answered with a tool_result and the words cite the tool’s numbers', async () => {
    const store = new InMemoryCoachAiStore();
    await store.saveConfig({ provider: 'anthropic', apiKey: 'sk-ant' });
    const http = new Scripted([
      { content: [{ type: 'tool_use', id: 'call_1', name: 'search_catalog', input: { query: 'chicken' } }] },
      { content: [{ type: 'text', text: words }] },
    ]);
    const box = toolbox();
    const outcome = await new HttpCoachNarrator({ store, http }).probe(request(box));
    expect(outcome).toEqual({ kind: 'narrated', text: words, cached: false });
    expect(box.calls).toEqual([{ name: 'search_catalog', input: { query: 'chicken' } }]);
    expect(http.requests).toHaveLength(2);
    const first = http.requests[0]!.body as { tools: { name: string; input_schema: unknown }[] };
    expect(first.tools[0]).toMatchObject({ name: 'search_catalog', input_schema: { type: 'object' } });
    const second = http.requests[1]!.body as { messages: { role: string; content: unknown }[] };
    expect(second.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
    expect(second.messages[2]!.content).toEqual([{ type: 'tool_result', tool_use_id: 'call_1', content: JSON.stringify({ foods: [{ name: 'Chicken breast', kcal: 165, proteinG: 31 }] }) }]);
  });

  it('OpenAI: tool_calls are answered as tool messages', async () => {
    const store = new InMemoryCoachAiStore();
    await store.saveConfig({ provider: 'openai', apiKey: 'sk-openai' });
    const http = new Scripted([
      { choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name: 'search_catalog', arguments: '{"query":"chicken"}' } }] } }] },
      { choices: [{ message: { role: 'assistant', content: words } }] },
    ]);
    const box = toolbox();
    const outcome = await new HttpCoachNarrator({ store, http }).probe(request(box));
    expect(outcome).toMatchObject({ kind: 'narrated', text: words });
    expect(box.calls).toEqual([{ name: 'search_catalog', input: { query: 'chicken' } }]);
    const first = http.requests[0]!.body as { tools: { type: string; function: { name: string } }[] };
    expect(first.tools[0]).toMatchObject({ type: 'function', function: { name: 'search_catalog' } });
    const second = http.requests[1]!.body as { messages: { role: string; tool_call_id?: string }[] };
    expect(second.messages.map((m) => m.role)).toEqual(['system', 'user', 'assistant', 'tool']);
    expect(second.messages[3]).toMatchObject({ role: 'tool', tool_call_id: 'c1' });
  });

  it('Gemini: a functionCall is answered with a functionResponse', async () => {
    const store = new InMemoryCoachAiStore();
    await store.saveConfig({ provider: 'gemini', apiKey: 'AIzaSyKey' });
    const http = new Scripted([
      { candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'search_catalog', args: { query: 'chicken' } } }] } }] },
      { candidates: [{ content: { parts: [{ text: words }] } }] },
    ]);
    const box = toolbox();
    const outcome = await new HttpCoachNarrator({ store, http }).probe(request(box));
    expect(outcome).toMatchObject({ kind: 'narrated', text: words });
    const first = http.requests[0]!.body as { tools: { functionDeclarations: { name: string }[] }[] };
    expect(first.tools[0]!.functionDeclarations[0]).toMatchObject({ name: 'search_catalog' });
    const second = http.requests[1]!.body as { contents: { role: string; parts: unknown[] }[] };
    expect(second.contents.map((c) => c.role)).toEqual(['user', 'model', 'user']);
    expect(second.contents[2]!.parts[0]).toEqual({ functionResponse: { name: 'search_catalog', response: { result: { foods: [{ name: 'Chicken breast', kcal: 165, proteinG: 31 }] } } } });
  });

  it('refuses words whose numbers came from neither the figures nor a tool', async () => {
    const store = new InMemoryCoachAiStore();
    await store.saveConfig({ provider: 'anthropic', apiKey: 'sk-ant' });
    const http = new Scripted([{ content: [{ type: 'text', text: 'Chicken breast, 165 kcal for 31 g, gets you closest.' }] }]);
    const outcome = await new HttpCoachNarrator({ store, http }).probe(request(toolbox()));
    expect(outcome).toMatchObject({ kind: 'rejected', reason: 'It used a number not in your figures (165)' });
  });

  it('an unknown tool, or one that fails, is answered as an error the model reads', async () => {
    const store = new InMemoryCoachAiStore();
    await store.saveConfig({ provider: 'anthropic', apiKey: 'sk-ant' });
    const http = new Scripted([
      { content: [{ type: 'tool_use', id: 'c1', name: 'no_such_tool', input: {} }, { type: 'tool_use', id: 'c2', name: 'search_catalog', input: {} }] },
      { content: [{ type: 'text', text: 'The meal was 844 kcal. Hold the line.' }] },
    ]);
    const box: CoachToolbox = {
      tools: toolbox().tools,
      call: async () => {
        throw new Error('The catalog is not open.');
      },
    };
    const outcome = await new HttpCoachNarrator({ store, http }).probe(request(box));
    expect(outcome).toMatchObject({ kind: 'narrated' });
    const second = http.requests[1]!.body as { messages: { content: { tool_use_id: string; content: string }[] }[] };
    expect(second.messages[2]!.content.map((r) => [r.tool_use_id, r.content])).toEqual([
      ['c1', JSON.stringify({ error: 'No tool called no_such_tool.' })],
      ['c2', JSON.stringify({ error: 'The catalog is not open.' })],
    ]);
  });

  it('a model that only ever asks for tools has no words', async () => {
    const store = new InMemoryCoachAiStore();
    await store.saveConfig({ provider: 'anthropic', apiKey: 'sk-ant' });
    const call = { content: [{ type: 'tool_use', id: 'c', name: 'search_catalog', input: { query: 'x' } }] };
    const http = new Scripted(Array.from({ length: 12 }, () => call));
    const outcome = await new HttpCoachNarrator({ store, http }).probe(request(toolbox()));
    expect(outcome).toEqual({ kind: 'empty' });
    expect(http.requests.length).toBeLessThanOrEqual(10);
  });

  it('a request without a toolbox carries no tools and is asked once', async () => {
    const store = new InMemoryCoachAiStore();
    await store.saveConfig({ provider: 'anthropic', apiKey: 'sk-ant' });
    const http = new Scripted([{ content: [{ type: 'text', text: 'The meal was 844 kcal. Hold the line.' }] }]);
    const plain: CoachNarrationRequest = { ...request(toolbox()), toolbox: undefined };
    const outcome = await new HttpCoachNarrator({ store, http }).probe(plain);
    expect(outcome).toMatchObject({ kind: 'narrated' });
    expect(http.requests[0]!.body).not.toHaveProperty('tools');
  });
});
