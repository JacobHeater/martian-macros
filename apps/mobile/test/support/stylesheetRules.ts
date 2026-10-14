import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Every stylesheet under `folder`. */
export function stylesheets(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) return stylesheets(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

/** One rule of a stylesheet: its selectors and its declarations, and whether it is inside the reduced-motion block. */
export interface StyleRule {
  readonly selectors: readonly string[];
  readonly body: string;
  readonly reducedMotion: boolean;
}

/**
 * Every rule of `css`, comments removed, with `@media` and `@keyframes`
 * blocks opened so the rules inside them are seen too. Nothing lays out in
 * the test browser, so the stylesheet tests read the rules themselves.
 */
export function rules(css: string): StyleRule[] {
  const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const found: StyleRule[] = [];
  const walk = (text: string, reducedMotion: boolean) => {
    let at = 0;
    while (at < text.length) {
      const open = text.indexOf('{', at);
      if (open < 0) break;
      const head = text.slice(at, open).trim();
      if (head.startsWith('@media') || head.startsWith('@keyframes') || head.startsWith('@supports')) {
        const close = matchingBrace(text, open);
        if (head.startsWith('@keyframes')) {
          at = close + 1;
          continue;
        }
        walk(text.slice(open + 1, close), reducedMotion || head.includes('prefers-reduced-motion'));
        at = close + 1;
        continue;
      }
      const close = text.indexOf('}', open);
      found.push({
        selectors: head.split(',').map((selector) => selector.trim()).filter((selector) => selector !== ''),
        body: text.slice(open + 1, close),
        reducedMotion,
      });
      at = close + 1;
    }
  };
  walk(plain, false);
  return found;
}

function matchingBrace(text: string, open: number): number {
  let depth = 0;
  for (let at = open; at < text.length; at += 1) {
    if (text[at] === '{') depth += 1;
    else if (text[at] === '}') {
      depth -= 1;
      if (depth === 0) return at;
    }
  }
  return text.length;
}

/** The declarations of every rule in `path` whose selectors include exactly `selector`, joined. */
export function declarationsOf(path: string, selector: string): string {
  return rules(readFileSync(path, 'utf8'))
    .filter((rule) => rule.selectors.includes(selector))
    .map((rule) => rule.body)
    .join('\n');
}
