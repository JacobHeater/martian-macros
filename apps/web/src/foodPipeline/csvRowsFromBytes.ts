import { csvRows } from './csvRows';

async function* decoded(bytes: AsyncIterable<Uint8Array> | Iterable<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder('utf-8');
  for await (const piece of bytes) yield decoder.decode(piece, { stream: true });
  yield decoder.decode();
}

/** `csvRows` over UTF-8 bytes that arrive in pieces. */
export function csvRowsFromBytes(bytes: AsyncIterable<Uint8Array> | Iterable<Uint8Array>): AsyncGenerator<string[]> {
  return csvRows(decoded(bytes));
}
