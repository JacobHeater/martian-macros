import { describe, expect, it } from 'vitest';
import type { MmPacksApi } from '../../src/foodCatalog/download/native/MmPacksApi';
import { NativePackHttp } from '../../src/foodCatalog/download/native/NativePackHttp';
import type { PackHttpChunk } from '../../src/foodCatalog/download/native/PackHttpChunk';
import { base64OfBytes } from '../../src/lang/base64OfBytes';

/** The plugin's HTTP side alone, driven by hand. */
function fakePacks(status = 200) {
  const asked: { url: string; rangeStart?: number | undefined }[] = [];
  const aborted: number[] = [];
  let emit: (chunk: PackHttpChunk) => void = () => undefined;
  let next = 1;
  const api = {
    httpGet: async (options: { url: string; rangeStart?: number }) => {
      asked.push(options);
      return { request: next++, status };
    },
    httpAbort: async ({ request }: { request: number }) => {
      aborted.push(request);
    },
    addListener: async (_event: 'packHttpChunk', listener: (chunk: PackHttpChunk) => void) => {
      emit = listener;
      return { remove: async () => undefined };
    },
  } as unknown as MmPacksApi;
  return { api, asked, aborted, emit: (chunk: PackHttpChunk) => emit(chunk) };
}

const read = async (body: AsyncIterable<Uint8Array>): Promise<string> => {
  let text = '';
  for await (const chunk of body) text += new TextDecoder().decode(chunk);
  return text;
};

describe('NativePackHttp', () => {
  it('hands the chunks on in order, already-arrived and awaited alike', async () => {
    const { api, emit } = fakePacks();
    const http = new NativePackHttp(api);
    const response = await http.get(new URL('https://packs.example/a.pack.gz'));
    expect(response.statusCode).toBe(200);
    emit({ request: 1, data: base64OfBytes(new TextEncoder().encode('first ')) });
    const reading = read(response.body);
    emit({ request: 1, data: base64OfBytes(new TextEncoder().encode('second')) });
    emit({ request: 1, done: true });
    expect(await reading).toBe('first second');
  });

  it('passes the byte offset on, and only when there is one', async () => {
    const { api, asked } = fakePacks(206);
    const http = new NativePackHttp(api);
    await http.get(new URL('https://packs.example/a'), { rangeStart: 1200 });
    await http.get(new URL('https://packs.example/b'));
    expect(asked[0]?.rangeStart).toBe(1200);
    expect(asked[1] !== undefined && 'rangeStart' in asked[1]).toBe(false);
  });

  it('a failed connection fails the body, not the app', async () => {
    const { api, emit } = fakePacks();
    const http = new NativePackHttp(api);
    const response = await http.get(new URL('https://packs.example/a'));
    const reading = read(response.body);
    emit({ request: 1, data: base64OfBytes(new Uint8Array([1])) });
    emit({ request: 1, error: 'the connection dropped' });
    await expect(reading).rejects.toThrow('the connection dropped');
  });

  it('abort tells the plugin which transfer to stop', async () => {
    const { api, aborted } = fakePacks();
    const http = new NativePackHttp(api);
    const response = await http.get(new URL('https://packs.example/a'));
    response.abort();
    await Promise.resolve();
    expect(aborted).toEqual([1]);
  });

  it('MM-471: abort wakes a reader waiting on the next chunk', async () => {
    const { api } = fakePacks();
    const http = new NativePackHttp(api);
    const response = await http.get(new URL('https://packs.example/a'));
    const waiting = read(response.body).then(
      () => 'ended',
      () => 'ended',
    );
    await Promise.resolve();
    response.abort();
    expect(await waiting).toBe('ended');
  });

  it('two transfers at once keep their bytes apart', async () => {
    const { api, emit } = fakePacks();
    const http = new NativePackHttp(api);
    const first = await http.get(new URL('https://packs.example/a'));
    const second = await http.get(new URL('https://packs.example/b'));
    emit({ request: 2, data: base64OfBytes(new TextEncoder().encode('of b')) });
    emit({ request: 1, data: base64OfBytes(new TextEncoder().encode('of a')) });
    emit({ request: 1, done: true });
    emit({ request: 2, done: true });
    expect(await read(first.body)).toBe('of a');
    expect(await read(second.body)).toBe('of b');
  });
});
