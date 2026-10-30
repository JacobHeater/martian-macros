import { CalendarDate } from '../domain/CalendarDate';
import { CustomFood } from '../domain/food/custom/CustomFood';
import { CustomFoodKind } from '../domain/food/custom/CustomFoodKind';
import { DayCompleteness } from '../domain/DayCompleteness';
import { DayKind } from '../domain/DayKind';
import type { FoodIngredient } from '../domain/food/custom/FoodIngredient';
import type { RecipeIngredient } from '../domain/food/custom/RecipeIngredient';
import { FoodGroup } from '../domain/food/FoodGroup';
import type { FoodEvidence } from '../domain/food/meal/FoodEvidence';
import { FoodEvidenceKind } from '../domain/food/meal/FoodEvidenceKind';
import type { LoggedMealTag } from '../domain/food/meal/LoggedMealTag';
import { Micronutrient } from '../domain/food/micros/Micronutrient';
import { Micronutrients } from '../domain/food/micros/Micronutrients';
import { ConversionKind } from '../domain/food/portion/ConversionKind';
import type { FoodOrigin } from '../domain/food/portion/FoodOrigin';
import { NutritionBasis } from '../domain/food/portion/NutritionBasis';
import { NutritionTotals } from '../domain/food/portion/NutritionTotals';
import type { Portion } from '../domain/food/portion/Portion';
import { PortionUnit } from '../domain/food/portion/PortionUnit';
import { Preparation } from '../domain/food/portion/Preparation';
import { ReferenceBasis } from '../domain/food/portion/ReferenceBasis';
import type { ReferenceNutrition } from '../domain/food/portion/ReferenceNutrition';
import { FoodEntry } from '../domain/FoodEntry';
import { Meal } from '../domain/Meal';
import { QuantitySource } from '../domain/QuantitySource';
import { WaterEntry } from '../domain/water/WaterEntry';
import type { FoodCopy } from './FoodCopy';
import type { WholeDay } from './WholeDay';
import { foodCopyFormat } from './foodCopyFormat';

type Json = Record<string, unknown>;

/** Thrown for anything that is not the format; the reader turns it into "could not be read". */
class Unreadable extends Error {}

const object = (value: unknown): Json => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Unreadable('not an object');
  return value as Json;
};
const list = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) throw new Unreadable('not a list');
  return value;
};
const optNumber = (o: Json, key: string): number | undefined => {
  const value = o[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Unreadable(`${key} is not a number`);
  return value;
};
const number = (o: Json, key: string): number => {
  const value = optNumber(o, key);
  if (value === undefined) throw new Unreadable(`${key} is missing`);
  return value;
};
const optInteger = (o: Json, key: string): number | undefined => {
  const value = optNumber(o, key);
  if (value !== undefined && !Number.isInteger(value)) throw new Unreadable(`${key} is not whole`);
  return value;
};
const optText = (o: Json, key: string): string | undefined => {
  const value = o[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new Unreadable(`${key} is not text`);
  return value;
};
const text = (o: Json, key: string): string => {
  const value = optText(o, key);
  if (value === undefined) throw new Unreadable(`${key} is missing`);
  return value;
};
function optNamed<T extends string>(values: readonly T[], o: Json, key: string): T | undefined {
  const value = optText(o, key);
  if (value === undefined) return undefined;
  const found = values.find((known) => known === value);
  if (found === undefined) throw new Unreadable(`${key} is not known: ${value}`);
  return found;
}
function named<T extends string>(values: readonly T[], o: Json, key: string): T {
  const value = optNamed(values, o, key);
  if (value === undefined) throw new Unreadable(`${key} is missing`);
  return value;
}

const totals = (value: unknown) => {
  const o = object(value);
  return new NutritionTotals({ kcal: number(o, 'kcal'), proteinG: number(o, 'proteinG'), carbsG: number(o, 'carbsG'), fatG: number(o, 'fatG') });
};

const micros = (value: unknown): Micronutrients => {
  if (value === undefined) return Micronutrients.none;
  const o = object(value);
  return new Micronutrients(Object.fromEntries(Micronutrient.values.map((n) => [n, optNumber(o, n)])) as Partial<Record<Micronutrient, number | undefined>>);
};

const evidence = (value: unknown): FoodEvidence | undefined => {
  if (value === undefined || value === null) return undefined;
  const o = object(value);
  return { kind: named(FoodEvidenceKind.values, o, 'kind'), citation: optText(o, 'citation') };
};

const reference = (value: unknown): ReferenceNutrition | undefined => {
  if (value === undefined || value === null) return undefined;
  const o = object(value);
  return {
    basis: named(ReferenceBasis.values, o, 'basis'),
    nutrition: totals(o['nutrition']),
    servingDescription: optText(o, 'servingDescription'),
    servingGrams: optNumber(o, 'servingGrams'),
    servingMilliliters: optNumber(o, 'servingMilliliters'),
    servingUnit: optNamed(PortionUnit.values, o, 'servingUnit'),
    densityGPerMl: optNumber(o, 'densityGPerMl'),
  };
};

const origin = (value: unknown): FoodOrigin | undefined => {
  if (value === undefined || value === null) return undefined;
  const o = object(value);
  const foodId = number(o, 'foodId');
  if (!Number.isInteger(foodId)) throw new Unreadable('foodId is not whole');
  return { packId: text(o, 'packId'), foodId, source: text(o, 'source'), sourceId: optText(o, 'sourceId') };
};

const portion = (value: unknown): Portion | undefined => {
  if (value === undefined || value === null) return undefined;
  const o = object(value);
  const conversion = o['conversion'] === undefined || o['conversion'] === null ? undefined : object(o['conversion']);
  return {
    method: named(QuantitySource.values, o, 'method'),
    basis: named(NutritionBasis.values, o, 'basis'),
    quantity: optNumber(o, 'quantity'),
    unit: optNamed(PortionUnit.values, o, 'unit'),
    reference: reference(o['reference']),
    origin: origin(o['origin']),
    preparation: optNamed(Preparation.values, o, 'preparation'),
    conversion: conversion === undefined ? undefined : { kind: named(ConversionKind.values, conversion, 'kind'), gramsPerUnit: number(conversion, 'gramsPerUnit') },
    impliedGrams: optNumber(o, 'impliedGrams'),
    handModelVersion: optInteger(o, 'handModelVersion'),
  };
};

const loggedMeal = (value: unknown): LoggedMealTag | undefined => {
  if (value === undefined || value === null) return undefined;
  const o = object(value);
  return { key: text(o, 'key'), name: text(o, 'name') };
};

/** The day's marks, when the copy is a whole day (MM-719). */
const whole = (value: unknown): WholeDay | undefined => {
  if (value === undefined || value === null) return undefined;
  const o = object(value);
  return { kind: named(DayKind.values, o, 'kind'), completeness: named(DayCompleteness.values, o, 'completeness') };
};

/** An entry as it is to be logged on this phone: a new one (id 0), whatever id it had. */
const entry = (value: unknown): FoodEntry => {
  const o = object(value);
  const date = number(o, 'date');
  if (!Number.isInteger(date)) throw new Unreadable('date is not whole');
  return new FoodEntry({
    id: 0,
    date: CalendarDate.fromEpochDay(date),
    meal: named(Meal.values, o, 'meal'),
    name: text(o, 'name'),
    kcal: number(o, 'kcal'),
    proteinG: number(o, 'proteinG'),
    carbsG: number(o, 'carbsG'),
    fatG: number(o, 'fatG'),
    source: named(QuantitySource.values, o, 'source'),
    portion: portion(o['portion']),
    fiberG: optNumber(o, 'fiberG'),
    sugarAlcoholsG: optNumber(o, 'sugarAlcoholsG'),
    sodiumMg: optNumber(o, 'sodiumMg'),
    alcoholG: optNumber(o, 'alcoholG'),
    micros: micros(o['micros']),
    eatenAt: optInteger(o, 'eatenAt'),
    loggedMeal: loggedMeal(o['loggedMeal']),
    evidence: evidence(o['evidence']),
  });
};

/** A drink as it is to be logged on this phone: a new one (id 0), on its day, at the moment it was had there (MM-718). */
const water = (value: unknown): WaterEntry => {
  const o = object(value);
  const date = number(o, 'date');
  if (!Number.isInteger(date)) throw new Unreadable('date is not whole');
  const ml = number(o, 'ml');
  if (ml <= 0) throw new Unreadable('ml is not an amount');
  const at = number(o, 'at');
  if (!Number.isInteger(at)) throw new Unreadable('at is not a moment');
  return new WaterEntry({ id: 0, date: CalendarDate.fromEpochDay(date), ml, at: new Date(at) });
};

const ingredient = (value: unknown): RecipeIngredient => {
  const o = object(value);
  const source = o['source'] === undefined || o['source'] === null ? undefined : object(o['source']);
  return {
    name: text(o, 'name'),
    grams: optNumber(o, 'grams'),
    totals: totals(o['totals']),
    source: source === undefined ? undefined : { packId: text(source, 'packId'), foodId: number(source, 'foodId') },
  };
};

const madeOf = (value: unknown): FoodIngredient[] =>
  value === undefined
    ? []
    : list(value).map((line) => {
        const o = object(line);
        return { name: text(o, 'name'), grams: optNumber(o, 'grams') };
      });

/** A Library food as the sending phone had it, its id there kept so entries can be linked to this phone's. */
const food = (value: unknown): CustomFood => {
  const o = object(value);
  const id = number(o, 'id');
  if (!Number.isInteger(id)) throw new Unreadable('id is not whole');
  return new CustomFood({
    id,
    name: text(o, 'name'),
    kind: named(CustomFoodKind.values, o, 'kind'),
    servingDescription: text(o, 'servingDescription'),
    servingGrams: optNumber(o, 'servingGrams'),
    perServing: totals(o['perServing']),
    barcode: optText(o, 'barcode'),
    servings: optNumber(o, 'servings'),
    cookedWeightGrams: optNumber(o, 'cookedWeightGrams'),
    ingredients: o['ingredients'] === undefined ? [] : list(o['ingredients']).map(ingredient),
    fiberG: optNumber(o, 'fiberG'),
    sugarAlcoholsG: optNumber(o, 'sugarAlcoholsG'),
    micros: micros(o['micros']),
    group: FoodGroup.fromName(optText(o, 'group')),
    evidence: evidence(o['evidence']),
    madeOf: madeOf(o['madeOf']),
  });
};

/**
 * The copy of foods or water `bytes` hold (MM-715, MM-718), as `foodCopyBytes` wrote it, or undefined when they
 * hold anything else: not JSON, another format or version, a missing field, a number that is not one, a meal, unit
 * or kind the app does not know, nothing to add. Nothing is guessed: a copy that does not read whole is not read at
 * all.
 */
export function foodCopyOfBytes(bytes: Uint8Array): FoodCopy | undefined {
  try {
    const o = object(JSON.parse(new TextDecoder().decode(bytes)));
    if (o['format'] !== foodCopyFormat.format || o['version'] !== foodCopyFormat.version) return undefined;
    const day = number(o, 'day');
    if (!Number.isInteger(day)) return undefined;
    const entries = list(o['entries']).map(entry);
    const drinks = list(o['water']).map(water);
    if (entries.length === 0 && drinks.length === 0) return undefined;
    return { day: CalendarDate.fromEpochDay(day), entries, water: drinks, foods: list(o['foods']).map(food), whole: whole(o['whole']) };
  } catch {
    return undefined;
  }
}
