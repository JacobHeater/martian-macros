import type { InsightPriority } from '../../InsightPriority';
import type { TrendDirection } from '../../trends/TrendDirection';
import type { CoachTrade } from '../CoachTrade';

/** MM-606's signals that speak, in catalog order: N1–N9 and N12–N16. */
const values = [
  'proteinMinimum',
  'proteinTarget',
  'proteinByMeal',
  'proteinDensity',
  'fatAgainstTarget',
  'fatShare',
  'carbohydrate',
  'macroSplit',
  'calorieDensity',
  'fiber',
  'sodium',
  'calories',
  'energyUse',
  'mealBalance',
] as const;

const families: Partial<Record<FoodSignalId, string>> = {
  proteinMinimum: 'protein',
  proteinTarget: 'protein',
  proteinByMeal: 'protein',
  proteinDensity: 'protein',
  calories: 'calories',
  fatAgainstTarget: 'calories',
  fatShare: 'calories',
  calorieDensity: 'calories',
  macroSplit: 'calories',
};

/** The make-up of what was eaten, which data quality quiets (MM-606's "data quality first"). */
const composition: readonly FoodSignalId[] = [
  'proteinDensity',
  'fatAgainstTarget',
  'fatShare',
  'carbohydrate',
  'macroSplit',
  'calorieDensity',
  'mealBalance',
];

/** What a trade is for, for the signals in change that may carry one (MM-607). */
const motives: Partial<Record<FoodSignalId, CoachTrade['motive']>> = {
  proteinMinimum: 'protein',
  proteinTarget: 'protein',
  proteinByMeal: 'protein',
  proteinDensity: 'protein',
  fatAgainstTarget: 'fat',
  calorieDensity: 'protein',
  sodium: 'sodium',
  calories: 'calories',
  mealBalance: 'protein',
};

/**
 * Each signal's own place in MM-141's order (MM-606, with the nutrition panel's priorities), never one class for
 * all: N5's low side (fat under its minimum) is coaching, and `priority` says so. The catalog's rules for the same
 * signals agree (protein short and sodium over the limit are patterns; protein by meal and fiber for fullness are
 * education), so the Dashboard's card weighs a finding and a rule alike (MM-610).
 */
const priorities: Record<FoodSignalId, InsightPriority> = {
  proteinMinimum: 'pattern',
  proteinTarget: 'education',
  proteinByMeal: 'education',
  proteinDensity: 'pattern',
  fatAgainstTarget: 'pattern',
  // Folded into N5 or N8, as theirs.
  fatShare: 'pattern',
  carbohydrate: 'education',
  macroSplit: 'pattern',
  calorieDensity: 'education',
  fiber: 'education',
  sodium: 'pattern',
  calories: 'pattern',
  energyUse: 'coaching',
  mealBalance: 'education',
};

/**
 * One of the food signals of MM-606 (N10, N11, N17 and N18 are helpers that
 * feed foods and trades, and say nothing of their own).
 */
export type FoodSignalId = (typeof values)[number];

export const FoodSignalId = {
  values,

  /** The family MM-605's de-duplication keeps one finding of per direction, if any. */
  family(id: FoodSignalId): string | undefined {
    return families[id];
  },

  /** Whether data quality quiets it. */
  isComposition(id: FoodSignalId): boolean {
    return composition.includes(id);
  },

  /** The trade's motive, when a finding in change may carry one. */
  motive(id: FoodSignalId): CoachTrade['motive'] | undefined {
    return motives[id];
  },

  /** The signal's priority (MM-141) for a finding that way: fat under its minimum (N5 low) is coaching, over its target a pattern. */
  priority(id: FoodSignalId, direction?: TrendDirection): InsightPriority {
    if (id === 'fatAgainstTarget' && direction === 'down') return 'coaching';
    return priorities[id];
  },

  /** The catalog order, the last tie-break. */
  order(id: FoodSignalId): number {
    return values.indexOf(id);
  },
} as const;
