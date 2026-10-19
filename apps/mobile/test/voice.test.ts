import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * MM-108: the app states, it does not judge or moralize. These words must
 * not appear in any text the app shows. Carried over from voice_test.dart.
 *
 * Text the app shows is found two ways: quoted strings, and the words
 * written between the tags of a screen. A quoted string that is one
 * lower-case word is a name the code uses (a kind, a key), not text.
 */
const banned = [
  'good',
  'bad',
  'clean',
  'junk',
  'guilt',
  'cheat',
  'oops',
  'earn',
  'burn off',
  'lbs',
  'true weight',
  'sinful',
  'naughty',
  'indulg',
  'deserve',
  'starvation mode',
  'metabolic damage',
  'toning',
];

const src = resolve('src');

function filesIn(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    if (statSync(path).isDirectory()) return filesIn(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

const within = (path: string) => path.substring(src.length + 1).split(sep).join('/');

// The gallery is developer tooling; fixtures and the pipeline are never shown to a user. The
// built-in exercises are the names lifts go by ("Good morning", "Power clean"), not the app's words.
const notShown = [
  'gallery/',
  'fixtures/',
  'foodPipeline/',
  'healthIngest/testing/',
  'domain/training/builtInExercises.ts',
];

const quoted = [/'((?:[^'\\\n]|\\.)+)'/g, /"((?:[^"\\\n]|\\.)+)"/g, /`((?:[^`\\]|\\.)+)`/g];
const code = /^(import |export |const |let |return |if |else|for |while |switch |case |type |interface |function |await |void |throw |try |catch |new |\/\/|\/\*|\*)/;

function texts(): (readonly [file: string, text: string])[] {
  const found: (readonly [string, string])[] = [];
  for (const path of filesIn(src)) {
    const file = within(path);
    if (notShown.some((folder) => file.startsWith(folder))) continue;
    const jsx = path.endsWith('.tsx');
    let commented = false;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const t = line.trim();
      if (t.startsWith('/*')) commented = !t.includes('*/');
      else if (commented) {
        if (t.includes('*/')) commented = false;
        continue;
      }
      if (t.startsWith('import ') || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) continue;
      for (const pattern of quoted) {
        for (const match of line.matchAll(pattern)) {
          const text = match[1] ?? '';
          // One lower-case word is a name the code uses, and a path or a class name is not text.
          if (/^[a-z][A-Za-z0-9]*$/.test(text) || /^[.@/]/.test(text) || /^[a-z0-9-]+( [a-z0-9-]+)*$/.test(text)) continue;
          if (text.length >= 3 && /[A-Za-z]{3}/.test(text)) found.push([file, text]);
        }
      }
      if (!jsx) continue;
      // Words written between tags: on the line of a tag, or on lines of their own.
      for (const match of line.matchAll(/>([^<>{}]*[A-Za-z]{3}[^<>{}]*)</g)) found.push([file, match[1] ?? '']);
      if (/^[A-Z][^=;]*[a-z.,]$/.test(t) && t.includes(' ') && !code.test(t)) found.push([file, t]);
    }
  }
  return found;
}

const all = texts();

it('the text is found', () => {
  expect(all.length).toBeGreaterThan(1000);
  // Both kinds are found: a quoted sentence, and words between tags.
  expect(all.some(([, text]) => text === 'Your first targets are worked out from your first weigh-in.')).toBe(true);
  expect(all.some(([, text]) => text.startsWith('Partial days are left out of your metabolism estimate'))).toBe(true);
});

describe('no text uses', () => {
  for (const word of banned) {
    it(`"${word}"`, () => {
      const pattern = new RegExp(word.length <= 4 ? `\\b${word}\\b` : word, 'i');
      const hits = all
        .filter(
          ([file, text]) =>
            pattern.test(text) &&
            // The one use: the name of the highest level of the coach's confidence.
            !(word === 'good' && text === 'Good' && file === 'format/confidenceLabel.ts'),
        )
        .map(([file, text]) => `${file}: "${text}"`);
      expect(hits).toEqual([]);
    });
  }
});

/**
 * MM-401: filler. Lines that narrate what the screen already shows, tell a
 * person to press what is plainly pressable, promise what is coming, or
 * cheer them on (design/anti-cruft-and-anti-slop.md, "No narration"). The
 * owner caught each of these on a phone; none comes back.
 */
const filler = [
  /nothing logged yet/i,
  /\bstart with (breakfast|lunch|dinner|a snack|your|the first)\b/i,
  /\b(press|tap|click) (here )?to (change|edit|open)\b/i,
  /\btype your own\b/i,
  /\byour own amount\b/i,
  /\b(is|are) coming(?: soon)?(?:\.|$)/i,
  /\bcoming soon\b/i,
  /\bget(ting)? started\b/i,
  /\blet['’]s\b/i,
  /\bhere you can\b/i,
  /\bthis is where\b/i,
  /\bmake it your\b/i,
  /\ba little (color|colour) preview\b/i,
  /\byou['’]re (doing )?(great|awesome|amazing)\b/i,
  /\byour journey\b/i,
];

describe('no text is filler', () => {
  for (const pattern of filler) {
    it(String(pattern), () => {
      expect(all.filter(([, text]) => pattern.test(text)).map(([file, text]) => `${file}: "${text}"`)).toEqual([]);
    });
  }
});

// MM-371: a grade letter is allowed; a banned word beside it is still caught.
it('a grade letter passes and a banned word beside it does not', () => {
  const hits = (text: string) => banned.filter((word) => text.toLowerCase().includes(word));
  expect(hits('Grade D')).toEqual([]);
  expect(hits('Grade D: junk')).toEqual(['junk']);
});
