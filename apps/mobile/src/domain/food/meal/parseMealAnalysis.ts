import { Micronutrient } from '../micros/Micronutrient';
import { Micronutrients } from '../micros/Micronutrients';
import type { FoodEvidence } from './FoodEvidence';
import { isSpecificCitation } from './isSpecificCitation';
import { mealAnalysisFormatName, mealAnalysisFormatVersion } from './mealAnalysisFormat';
import { eatenWhenIn } from './eatenWhenIn';
import type { MealAnalysisReading } from './MealAnalysisReading';
import type { MealItemDraft } from './MealItemDraft';
import type { UsualPortion } from './UsualPortion';

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);

/** The JSON in `text`: a fenced code block that holds an object, or else the outermost braces. */
function jsonIn(text: string): string | undefined {
  for (const match of text.matchAll(/```[a-zA-Z]*\s*\n?([\s\S]*?)```/g)) {
    const body = (match[1] ?? '').trim();
    if (body.startsWith('{')) return body;
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return start < 0 || end <= start ? undefined : text.slice(start, end + 1);
}

/** Parses `json`, then again with the curly quotes and odd spaces a chat app may have put in on copy. */
function parsed(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return JSON.parse(json.replace(/[“”„‟″]/g, '"').replace(/[   ]/g, ' '));
  }
}

/** A number given as a number or as digits; anything else is not given. */
function numberOf(value: unknown): number | undefined {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : undefined;
}

const textOf = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined);

/** Kept as the assistant's when it says it verified a specific source; otherwise an estimate, to be looked up. */
function evidenceOf(source: unknown): FoodEvidence {
  const citation = isObject(source) ? textOf(source['citation']) : textOf(source);
  const verified = isObject(source) && source['verified'] === true;
  return { kind: verified && isSpecificCitation(citation) ? 'cited' : 'estimated', citation };
}

/** A usual portion as `{ "description": "1 tbsp", "grams": 15 }`; what is not both is not given. */
function usualPortionOf(value: unknown): UsualPortion | undefined {
  if (!isObject(value)) return undefined;
  const description = textOf(value['description']);
  const grams = numberOf(value['grams']);
  return description === undefined || grams === undefined ? undefined : { description, grams };
}

function itemOf(value: unknown, at: number): MealItemDraft {
  const item = isObject(value) ? value : {};
  const micros: Partial<Record<Micronutrient, number>> = {};
  for (const n of Micronutrient.values) {
    const amount = numberOf(item[Micronutrient.column(n)]);
    if (amount !== undefined) micros[n] = amount;
  }
  return {
    name: textOf(item['name']) ?? `Food ${at + 1}`,
    lookup: textOf(item['lookup']),
    grams: numberOf(item['grams']),
    usualPortion: usualPortionOf(item['usual_portion']),
    kcal: numberOf(item['kcal']),
    proteinG: numberOf(item['protein_g']),
    carbsG: numberOf(item['carbs_g']),
    fatG: numberOf(item['fat_g']),
    fiberG: numberOf(item['fiber_g']),
    micros: new Micronutrients(micros),
    evidence: evidenceOf(item['source']),
  };
}

/**
 * The meal in an answer pasted from the person's assistant (MM-586). The
 * JSON is found wherever it is, so the assistant's sentences around it do
 * no harm. What is wrong with an item is not decided here: the item is read
 * as given and `mealItemProblems` says what it lacks.
 */
export function parseMealAnalysis(text: string): MealAnalysisReading {
  const json = jsonIn(text);
  if (json === undefined) {
    return { kind: 'unreadable', reason: 'There is no meal in this text. Paste the whole answer, with its code block.' };
  }
  let value: unknown;
  try {
    value = parsed(json);
  } catch {
    return {
      kind: 'unreadable',
      reason: 'The code block is not complete JSON; part of it may not have been copied. Copy the whole code block again.',
    };
  }
  const listed: unknown = isObject(value) ? value['items'] : undefined;
  if (!isObject(value) || !Array.isArray(listed)) {
    return { kind: 'unreadable', reason: 'This is not a meal in the app’s format: it has no list of items.' };
  }
  if (value['format'] !== undefined && value['format'] !== mealAnalysisFormatName) {
    return { kind: 'unreadable', reason: `This answer is in another format (“${String(value['format'])}”).` };
  }
  const version = numberOf(value['version']);
  if (version !== undefined && version !== mealAnalysisFormatVersion) {
    return { kind: 'unreadable', reason: `This answer is in version ${version} of the format; the app reads version ${mealAnalysisFormatVersion}.` };
  }
  const items = (listed as unknown[]).map((item, at) => itemOf(item, at));
  if (items.length === 0) return { kind: 'unreadable', reason: 'The meal has no items in it.' };
  const eaten = textOf(value['eaten_at']);
  return { kind: 'read', draft: { name: textOf(value['name']) ?? '', items, ...(eaten === undefined ? {} : eatenWhenIn(eaten)) } };
}
