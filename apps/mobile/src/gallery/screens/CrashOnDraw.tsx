const thrown = new Set<string>();

/**
 * A screen that throws when drawn (MM-679), for the story and the test of
 * the crash notice; never shipped. With `once`, the draw after the first
 * under the same `name` goes through, so Try again has something to show.
 */
export function CrashOnDraw({ name = 'crash', once = false }: { name?: string; once?: boolean } = {}): null {
  if (once && thrown.has(name)) return null;
  thrown.add(name);
  throw new Error('crashOnDraw: thrown on purpose while drawing');
}
