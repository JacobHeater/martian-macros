import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { coachBannedWords } from './support/coachBannedWords';

/**
 * MM-108: the app states, it does not judge or moralize. These words must
 * not appear in any text the app shows. Carried over from voice_test.dart.
 *
 * Text the app shows is found two ways: quoted strings, and the words
 * written between the tags of a screen. A quoted string with no space (a
 * kind, a key, a path) or whose every word carries a hyphen (a class list)
 * is a name the code uses, not text.
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
  // MM-610's verdicts, for the coach's analysis and everything else.
  'too much',
  'unhealthy',
  'fattening',
  'empty calories',
  'burn rate',
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

/** A quoted string the code uses as a name, not as text: no space, a path, or a class list. */
const isName = (text: string) =>
  /^[a-z][A-Za-z0-9]*$/.test(text) ||
  /^[.@/]/.test(text) ||
  /^[a-z0-9-]+$/.test(text) ||
  /^[a-z0-9]*-[a-z0-9-]*( [a-z0-9]*-[a-z0-9-]*)+$/.test(text);

/** The text in one file's source; `jsx` adds the words written between tags. */
function textsOf(source: string, jsx: boolean): string[] {
  const found: string[] = [];
  let commented = false;
  for (const line of source.split('\n')) {
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
        if (isName(text)) continue;
        if (text.length >= 3 && /[A-Za-z]{3}/.test(text)) found.push(text);
      }
    }
    if (!jsx) continue;
    // Words written between tags: on the line of a tag, or on lines of their own.
    for (const match of line.matchAll(/>([^<>{}]*[A-Za-z]{3}[^<>{}]*)</g)) found.push(match[1] ?? '');
    if (/^[A-Z][^=;]*[a-z.,]$/.test(t) && t.includes(' ') && !code.test(t)) found.push(t);
  }
  return found;
}

function texts(): (readonly [file: string, text: string])[] {
  return filesIn(src).flatMap((path) => {
    const file = within(path);
    if (notShown.some((folder) => file.startsWith(folder))) return [];
    return textsOf(readFileSync(path, 'utf8'), path.endsWith('.tsx')).map((text) => [file, text] as const);
  });
}

const all = texts();

/**
 * MM-617: the coach's analysis text (`format/coach/`) is held to the
 * coach's list instead of the one above: its verdicts on choices ("too
 * much", "that was the mistake") are the owner's voice there, and banned
 * everywhere else. Profanity, words about the person's body or worth, and
 * cheat, sinful, deserve, earn and burn off are banned in it too.
 */
const coachVoice = 'format/coach/';
const isCoachVoice = (file: string) => file.startsWith(coachVoice);

/** The words a text of `file` may not use: the coach's list in the coach's analysis, MM-108's everywhere else. */
function bannedFor(file: string, text: string): string[] {
  if (isCoachVoice(file)) return coachBannedWords.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  return banned.filter((word) => bannedPattern(word).test(text));
}

it('the text is found', () => {
  expect(all.length).toBeGreaterThan(1000);
  // Both kinds are found: a quoted sentence, and words between tags.
  expect(all.some(([, text]) => text === 'Your first targets are worked out from your first weigh-in.')).toBe(true);
  expect(all.some(([, text]) => text.endsWith('Your goal stays as it is unless you change it.'))).toBe(true);
});

// QA-6: a lower-case phrase is text; only a name with no space, or a class list, is passed over.
it('a lower-case phrase is found, a name and a class list are not', () => {
  expect(textsOf("subtitle: 'a bad day',\nlabel: 'your real weight',", false)).toEqual(['a bad day', 'your real weight']);
  expect(textsOf("kind: 'weigh-in', path: './x', className: 'app-text coach-range',", false)).toEqual([]);
});

/** How a banned word is matched: a short one as a whole word, a longer one anywhere. */
const bannedPattern = (word: string) => new RegExp(word.length <= 4 ? `\\b${word}\\b` : word, 'i');
const bannedIn = (text: string) => banned.filter((word) => bannedPattern(word).test(text));

describe('no text uses', () => {
  for (const word of banned) {
    it(`"${word}"`, () => {
      const pattern = bannedPattern(word);
      const hits = all
        .filter(
          ([file, text]) =>
            !isCoachVoice(file) &&
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
 * MM-108, "Consistent terms": each glossary term in design/voice-and-wording.md
 * is the one name for its thing. The names it is never called are checked
 * here, where a test can tell them apart from the code's own names.
 */
const neverCalled: readonly (readonly [term: string, pattern: RegExp])[] = [
  ['trend weight', /\b(true|real) weight\b/i],
  ['energy expenditure', /\bTDEE\b/],
  ['calibration', /\bsetup period\b/i],
  ['goal', /\bplan type\b/i],
  ['targets', /\b(calorie|protein|daily|macro) goals?\b/i],
];

describe('the glossary is kept', () => {
  for (const [term, pattern] of neverCalled) {
    it(`"${term}" is never called ${String(pattern)}`, () => {
      expect(all.filter(([, text]) => pattern.test(text)).map(([file, text]) => `${file}: "${text}"`)).toEqual([]);
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

// MM-371: a grade letter is allowed; a banned word beside it is still caught, by the test's own pattern.
it('a grade letter passes and a banned word beside it does not', () => {
  expect(bannedIn('Grade D')).toEqual([]);
  expect(bannedIn('Grade D-')).toEqual([]);
  expect(bannedIn('Grade D: junk')).toEqual(['junk']);
  expect(textsOf("detail: 'Grade D: junk',", false).flatMap(bannedIn)).toEqual(['junk']);
});

describe("the coach's analysis text (MM-617)", () => {
  const coach = all.filter(([file]) => isCoachVoice(file));

  it('is found: the grammar and its phrasings', () => {
    expect(coach.length).toBeGreaterThan(300);
    expect(coach.some(([, text]) => text === "Tomorrow: back to {target}. Don't skip meals to make up for today.")).toBe(true);
  });

  it("passes the coach's list", () => {
    expect(coach.flatMap(([file, text]) => bannedFor(file, text).map((name) => `${file}: ${name} in "${text}"`))).toEqual([]);
  });

  it('a verdict on a choice passes there and nowhere else; the coach\'s list holds there', () => {
    const verdict = 'Too much. That was the mistake.';
    expect(bannedFor('format/coach/coachPhrasings.ts', verdict)).toEqual([]);
    expect(bannedFor('format/insightText.ts', verdict)).toEqual(['too much']);
    expect(bannedFor('format/coach/coachPhrasings.ts', 'You earned a cheat day.')).toEqual(['cheat', 'earn']);
    expect(bannedFor('format/coach/coachPhrasings.ts', "You're fat and lazy.")).toEqual(['fat, aimed at the person', 'lazy']);
    expect(bannedFor('format/coach/coachPhrasings.ts', 'What the hell.')).toEqual(['profanity']);
  });

  it('only the format layer has the coach\'s voice: no other folder is called coach/ under format/', () => {
    expect(new Set(coach.map(([file]) => file.split('/').slice(0, 2).join('/')))).toEqual(new Set(['format/coach']));
  });
});
