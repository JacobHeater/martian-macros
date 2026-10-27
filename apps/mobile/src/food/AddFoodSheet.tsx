import { useEffect, useId, useRef, useState } from 'react';
import { MacroSplitChart } from '../charts/MacroSplitChart';
import { useNetCarbs } from './useNetCarbs';
import { useInsightPreview } from '../coach/useInsightPreview';
import { gradeOfCustomFood } from '../engine/gradeOfCustomFood';
import { gradeOfFoodEntry } from '../engine/gradeOfFoodEntry';
import { useAsync } from '../app/useAsync';
import { atwaterKcal } from '../domain/atwaterKcal';
import type { CalendarDate } from '../domain/CalendarDate';
import type { CustomFood } from '../domain/food/custom/CustomFood';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import type { MealSize } from '../domain/food/estimate/MealSize';
import { Micronutrients } from '../domain/food/micros/Micronutrients';
import { HandModel } from '../domain/food/hand/HandModel';
import { conversionFor } from '../domain/food/portion/conversionFor';
import { convertedQuantity } from '../domain/food/portion/convertedQuantity';
import { gramsFor } from '../domain/food/portion/gramsFor';
import type { NutritionBasis } from '../domain/food/portion/NutritionBasis';
import { NutritionTotals } from '../domain/food/portion/NutritionTotals';
import { parseQuantity } from '../domain/food/portion/parseQuantity';
import type { Portion } from '../domain/food/portion/Portion';
import { PortionUnit } from '../domain/food/portion/PortionUnit';
import type { ReferenceNutrition } from '../domain/food/portion/ReferenceNutrition';
import { scaleNutrition } from '../domain/food/portion/scaleNutrition';
import { unitsOffered } from '../domain/food/portion/unitsOffered';
import { FoodEntry } from '../domain/FoodEntry';
import type { LoggedMeal } from '../domain/food/meal/LoggedMeal';
import { IntakeDay } from '../domain/IntakeDay';
import { timesLoggedAt } from '../domain/food/meal/timesLoggedAt';
import { macrosMatchEnergy } from '../domain/macrosMatchEnergy';
import type { Meal } from '../domain/Meal';
import { QuantitySource } from '../domain/QuantitySource';
import type { CatalogFood } from '../foodCatalog/CatalogFood';
import type { CatalogServing } from '../foodCatalog/CatalogServing';
import { Fmt } from '../format/Fmt';
import { parseNumber } from '../format/parseNumber';
import { portionAmount } from '../format/portionAmount';
import { portionUnitChipLabel } from '../format/portionUnitChipLabel';
import { portionUnitOf } from '../format/portionUnitOf';
import { quantitySourceLabel } from '../format/quantitySourceLabel';
import { quantityText } from '../format/quantityText';
import { referenceBasisLabel } from '../format/referenceBasisLabel';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { DayStepper } from '../ui/DayStepper';
import { MmButton } from '../ui/MmButton';
import { MmIconButton } from '../ui/MmIconButton';
import { useOverlays } from '../ui/useOverlays';
import { MmChoiceChip } from '../ui/MmChoiceChip';
import { MmListRow } from '../ui/MmListRow';
import { MmTextField } from '../ui/MmTextField';
import { Notice } from '../ui/Notice';
import { AlcoholFields } from './AlcoholFields';
import { customCatalogFood } from './custom/customCatalogFood';
import { MyFoodsStep } from './custom/MyFoodsStep';
import { defaultMeal } from './defaultMeal';
import { eatenAtWhenLogged } from './eatenAtWhenLogged';
import { editableNumber } from './editableNumber';
import { entriesCopiedTo } from './entriesCopiedTo';
import { EstimateMealStep } from './estimate/EstimateMealStep';
import { AnalyzeMealStep } from './meal/AnalyzeMealStep';
import { gradeOfLoggedMeal } from './meal/gradeOfLoggedMeal';
import { RecentMealRow } from './meal/RecentMealRow';
import { relogMeal } from './meal/relogMeal';
import { FoodAmountStep } from './FoodAmountStep';
import { FoodGrade } from './FoodGrade';
import { FoodSearchResults } from './FoodSearchResults';
import { copyOfPackFood } from './custom/copyOfPackFood';
import { OnlineSearchResults } from './online/OnlineSearchResults';
import { MealChips } from './MealChips';
import { RecentFoodRow } from './RecentFoodRow';
import { BarcodeScanStep } from './scan/BarcodeScanStep';
import { TimeEatenRow } from './TimeEatenRow';
import './food.css';

interface AddFoodSheetProps {
  day: CalendarDate;
  /** Preselected meal; otherwise one is chosen from the time of day. */
  meal?: Meal | undefined;
  /** An entry already logged, to be corrected in place (MM-48). */
  entry?: FoodEntry | undefined;
  /** Opens with this already typed in the search field (MM-152). */
  initialQuery?: string | undefined;
  /** Opens on the estimate step at this size (MM-152). */
  estimateSize?: MealSize | undefined;
  /** Called once the food is logged or saved. */
  onDone: () => void;
  /** Set while the meal's list holds foods, to ask before the sheet is left with them (MM-631). */
  mayLeave?: { current: (() => Promise<boolean>) | undefined } | undefined;
}

/** What the form holds while a food is being typed or edited. */
interface Form {
  readonly name: string;
  readonly kcal: string;
  readonly protein: string;
  readonly carbs: string;
  readonly fat: string;
  readonly alcohol: string;
  /** What else the label states (MM-49): typed at Full detail, kept at every level. */
  readonly fiber: string;
  readonly sodium: string;
  readonly sugars: string;
  readonly saturatedFat: string;
  readonly quantity: string;
  readonly source: QuantitySource;
  readonly unit: PortionUnit | undefined;
  readonly quantityWasEntered: boolean;
  readonly basis: NutritionBasis;
  /** An entry logged before amounts were recorded: no amount is asked for it and none is invented. */
  readonly legacy: boolean;
  /** Why the amount must be entered again: its method changed (MM-216), or its unit, with no common measure (MM-628). */
  readonly amountNeedsReentry: false | 'method' | 'unit';
  /** The amount another unit was converted to, exact while its figure is untouched, and what it was (MM-628). */
  readonly converted?: { readonly shown: string; readonly value: number; readonly from: string } | undefined;
  /**
   * For an entry calculated from a food's reference nutrition: its amount
   * can be changed and the totals follow; its totals are not typed.
   */
  readonly calcRef: ReferenceNutrition | undefined;
  readonly calcAlcoholPerKcal: number | undefined;
}

const blank: Form = {
  name: '',
  kcal: '',
  protein: '',
  carbs: '',
  fat: '',
  alcohol: '',
  fiber: '',
  sodium: '',
  sugars: '',
  saturatedFat: '',
  quantity: '1',
  source: 'labelServing',
  unit: 'serving',
  quantityWasEntered: false,
  basis: 'calculated',
  legacy: false,
  amountNeedsReentry: false,
  calcRef: undefined,
  calcAlcoholPerKcal: undefined,
};

const alcoholPerKcal = (e: FoodEntry) => (e.alcoholG !== undefined && e.kcal > 0 ? e.alcoholG / e.kcal : undefined);

/** The entry's fiber, sodium, sugars and saturated fat as the form's fields, each divided by `servings`. */
function extrasOf(e: FoodEntry, servings: number): Pick<Form, 'fiber' | 'sodium' | 'sugars' | 'saturatedFat'> {
  const each = (value: number | undefined) => (value === undefined ? '' : editableNumber(value / servings));
  return {
    fiber: each(e.fiberG),
    sodium: each(e.sodiumMg),
    sugars: each(e.micros.of('sugars')),
    saturatedFat: each(e.micros.of('saturatedFat')),
  };
}

/** The form refilled from an entry: a recent food logged again, or one being corrected. */
function filledFrom(e: FoodEntry): Form {
  const portion = e.portion;
  let form: Form = {
    ...blank,
    name: e.name,
    kcal: editableNumber(e.kcal),
    protein: editableNumber(e.proteinG),
    carbs: editableNumber(e.carbsG),
    fat: editableNumber(e.fatG),
    alcohol: e.alcoholG === undefined ? '' : editableNumber(e.alcoholG),
    ...extrasOf(e, 1),
    source: e.source,
    basis: 'enteredTotals',
  };
  // A food of an analysed meal comes back as one usual portion of it (MM-595, MM-596), never the amount the meal had.
  const usual = portion?.reference;
  if (e.source === 'photoEstimate' && usual?.basis === 'per100g' && usual.servingGrams !== undefined && usual.servingGrams > 0) {
    const grams = usual.servingGrams;
    const eaten = portion?.quantity !== undefined && portion.quantity > 0 ? portion.quantity : grams;
    return {
      ...form,
      ...extrasOf(e, eaten / grams),
      source: 'labelServing',
      unit: 'serving',
      quantity: '1',
      quantityWasEntered: true,
      calcRef: {
        basis: 'perServing',
        servingUnit: 'serving',
        servingDescription: usual.servingDescription,
        servingGrams: grams,
        nutrition: usual.nutrition.times(grams / 100),
      },
      calcAlcoholPerKcal: alcoholPerKcal(e),
    };
  }
  // A food calculated from its reference comes back on it, so a new amount is calculated as it was (MM-623).
  if (portion?.basis === 'calculated' && portion.reference !== undefined && portion.unit !== undefined && portion.quantity !== undefined) {
    return {
      ...form,
      unit: portion.unit,
      quantity: editableNumber(portion.quantity),
      quantityWasEntered: true,
      calcRef: portion.reference,
      calcAlcoholPerKcal: alcoholPerKcal(e),
    };
  }
  if (portion?.quantity !== undefined && portion.unit !== undefined) {
    form = { ...form, unit: portion.unit, quantity: editableNumber(portion.quantity), quantityWasEntered: true };
    if (e.source === 'labelServing' && portion.unit === 'serving' && portion.quantity > 0) {
      const servings = portion.quantity;
      form = {
        ...form,
        ...extrasOf(e, servings),
        calcRef: {
          basis: 'perServing',
          servingUnit: 'serving',
          nutrition: new NutritionTotals({
            kcal: e.kcal / servings,
            proteinG: e.proteinG / servings,
            carbsG: e.carbsG / servings,
            fatG: e.fatG / servings,
          }),
        },
        calcAlcoholPerKcal: alcoholPerKcal(e),
      };
    }
    return form;
  }
  return { ...form, unit: unitsOffered(e.source)[0], quantity: '', quantityWasEntered: false };
}

/** The form as it opens on an entry being corrected. */
function editing(entry: FoodEntry): Form {
  const portion = entry.portion;
  if (portion === undefined) return { ...filledFrom(entry), legacy: true, unit: undefined, quantity: '' };
  if (portion.basis === 'calculated' && portion.reference !== undefined) {
    return {
      ...blank,
      name: entry.name,
      source: entry.source,
      calcRef: portion.reference,
      calcAlcoholPerKcal: alcoholPerKcal(entry),
      unit: portion.unit,
      quantity: editableNumber(portion.quantity ?? 1),
      quantityWasEntered: portion.quantity !== undefined,
    };
  }
  return filledFrom(entry);
}

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/** "1 food", "3 foods". */
const foodsText = (count: number) => (count === 1 ? '1 food' : `${count} foods`);

/** How many times in four weeks make a food usual at a meal, and first among the recent foods there (MM-639). */
const usualTimes = 2;

/** How many recent foods the sheet lists before "More recent foods" (MM-439). */
const recentsFirst = 5;

const calculatedUnits: readonly PortionUnit[] = [
  'serving',
  'gram',
  'ounce',
  'cup',
  'tablespoon',
  'teaspoon',
  'milliliter',
  'fluidOunce',
  'palm',
  'cuppedHand',
  'thumb',
];

type Step =
  | { readonly at: 'choices' }
  | { readonly at: 'manual' }
  | { readonly at: 'scanning' }
  | { readonly at: 'estimating' }
  | { readonly at: 'analyzing' }
  | { readonly at: 'myFoods'; readonly barcode?: string | undefined; readonly draft?: CustomFood | undefined }
  | {
      readonly at: 'amount';
      readonly food: CatalogFood;
      readonly servings: readonly CatalogServing[];
      readonly alternate?: CatalogFood | undefined;
      readonly startOnAlternate?: boolean | undefined;
      readonly custom?: CustomFood | undefined;
      /** The barcode the food was scanned by, so "Fix this food" keeps it (MM-153). */
      readonly barcode?: string | undefined;
    };

/**
 * Logs one food: found by search, scanned, one of the user's own,
 * estimated, or typed by its macros. Recent foods refill the form in one
 * tap. An entry already logged is corrected here too.
 */
export function AddFoodSheet({ day: firstDay, meal: firstMeal, entry, initialQuery, estimateSize, onDone, mayLeave }: AddFoodSheetProps) {
  const { services, state } = useApp();
  const { gradeOfFood } = useInsightPreview();
  const netCarbs = useNetCarbs();
  const today = useCell(state.today);
  const overlays = useOverlays();
  const hand = useCell(state.handSize);
  const recents = useLoaded(state.recentFoods) ?? [];
  const recentMeals = useLoaded(state.recentMeals) ?? [];
  // The four weeks before the day, to know what is usual at a meal (MM-639).
  const lastWeeks = useLoaded(state.foodBefore(firstDay)) ?? [];
  const [allRecents, setAllRecents] = useState(false);
  const customFoods = useLoaded(state.customFoods) ?? [];
  // The form shows the fields for the chosen level and stores what it holds (MM-49).
  const level = useLoaded(state.detailLevel) ?? 'standard';
  const showsCarbsAndFat = DetailLevel.showsCarbsAndFat(level);
  // A grade beside each food found (MM-370), as the pack's results have: a saved food's own, a recent food's as it was logged.
  const gradeBeside = (name: string) => {
    const own = customFoods.find((food) => food.name === name);
    const recent = recents.find((food) => food.name === name);
    const grade = gradeOfFood?.(name) ?? (own !== undefined ? gradeOfCustomFood(own) : recent !== undefined ? gradeOfFoodEntry(recent, { hand }) : undefined);
    return grade === undefined ? undefined : <FoodGrade grade={grade} subject={name} />;
  };
  const catalog = useLoaded(state.foodCatalog);
  const isEditing = entry !== undefined;

  const [search, setSearch] = useState(isEditing ? '' : (initialQuery ?? ''));
  // Everything ever logged that the search names (MM-596): the app's own foods and meals, found however old.
  const typed = search.trim();
  const fromLog = useAsync(
    async () =>
      typed === ''
        ? { foods: [], meals: [] }
        : { foods: await services.food.searchLoggedFoods(typed), meals: await services.food.searchLoggedMeals(typed) },
    typed,
    { keep: true },
  );
  const [step, setStep] = useState<Step>(() => {
    if (isEditing) return { at: 'manual' };
    return estimateSize === undefined ? { at: 'choices' } : { at: 'estimating' };
  });
  const [form, setForm] = useState<Form>(() => (entry === undefined ? blank : editing(entry)));
  /** A recent food or one from the log, being logged again: what its extras scale from, never the entry edited (MM-623). */
  const [template, setTemplate] = useState<FoodEntry>();
  /** What the entry's extras and origin come from: the entry being corrected, or the food being logged again. */
  const base = entry ?? template;
  const [askAlcohol, setAskAlcohol] = useState(false);
  /** Whether the last save failed: said above the action, the form kept to try again (MM-624). */
  const [saveFailed, setSaveFailed] = useState(false);
  const relogging = useRef(false);
  /**
   * The foods of one meal being entered together (MM-631, the owner's D-1 and D-2): logged in one step, as
   * loose foods, at the list's meal and time. Kept only while the sheet is open.
   */
  const [listed, setListed] = useState<readonly FoodEntry[]>([]);
  /** Whether the list could not be logged: said above its action (MM-624). */
  const [listFailed, setListFailed] = useState(false);
  /** Whether the list's line takes focus once drawn: after a food is added or taken out (the UX guard's UX-1). */
  const [focusList, setFocusList] = useState(false);
  const listLine = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!focusList || listLine.current === null) return;
    listLine.current.focus();
    setFocusList(false);
  });
  // Leaving with foods in the list asks first (MM-631).
  useEffect(() => {
    if (mayLeave === undefined) return;
    mayLeave.current =
      listed.length === 0
        ? undefined
        : () =>
            overlays.confirm({
              title: `Discard ${foodsText(listed.length)}?`,
              message: 'They are not logged yet.',
              confirmLabel: 'Discard',
              cancelLabel: 'Keep',
            });
  }, [listed, mayLeave, overlays]);
  const [meal, setMeal] = useState<Meal>(() => entry?.meal ?? firstMeal ?? defaultMeal(services.clock));
  const [day, setDay] = useState(entry?.date ?? firstDay);
  // An entry being corrected keeps its time until it is changed; a new one logged for today starts at now (MM-570).
  const [eatenAt, setEatenAt] = useState<number | undefined>(() =>
    entry === undefined ? eatenAtWhenLogged(firstDay, services.clock) : entry.eatenAt,
  );
  const set = (changes: Partial<Form>) => setForm((current) => ({ ...current, ...changes }));

  const p = parseNumber(form.protein) ?? 0;
  const c = parseNumber(form.carbs) ?? 0;
  const f = parseNumber(form.fat) ?? 0;
  const a = parseNumber(form.alcohol) ?? 0;
  const fromMacros = atwaterKcal({ proteinG: p, carbsG: c, fatG: f, alcoholG: a });
  const typedKcal = parseNumber(form.kcal);
  /**
   * Calories as typed, or derived from macros when left blank. At Simple
   * detail the macros that would derive them are not asked, so calories are
   * typed, and no caution compares them with what is not there (MM-428).
   */
  const energy = typedKcal ?? (showsCarbsAndFat && fromMacros > 0 ? fromMacros : undefined);
  const amount = form.converted !== undefined && form.quantity === form.converted.shown ? form.converted.value : parseQuantity(form.quantity);
  const calc = form.calcRef;
  const amountRequired = calc !== undefined || (!form.legacy && form.source !== 'quickAdd');
  const amountOk = !amountRequired || amount !== undefined;

  /** The reference a per-serving entry is calculated from. */
  const perServingRef: ReferenceNutrition | undefined =
    form.basis !== 'calculated' || energy === undefined
      ? undefined
      : {
          basis: 'perServing',
          nutrition: new NutritionTotals({ kcal: energy, proteinG: p, carbsG: c, fatG: f }),
          servingUnit: 'serving',
        };

  /** The totals this entry will log, or undefined while they cannot be known. */
  const totals = ((): NutritionTotals | undefined => {
    if (calc !== undefined) {
      return amount === undefined || form.unit === undefined
        ? undefined
        : scaleNutrition(amount, form.unit, calc, { hand });
    }
    if (energy === undefined) return undefined;
    if (perServingRef !== undefined) {
      return amount === undefined ? undefined : scaleNutrition(amount, 'serving', perServingRef);
    }
    return new NutritionTotals({ kcal: energy, proteinG: p, carbsG: c, fatG: f });
  })();

  const valid =
    form.name.trim() !== '' &&
    amountOk &&
    totals !== undefined &&
    totals.kcal > 0 &&
    (calc !== undefined || (p >= 0 && c >= 0 && f >= 0));

  /** How many servings multiply per-serving numbers, said in the Logs line; on either path (MM-218). */
  const servingsLogged = (form.unit === 'serving' || perServingRef !== undefined) && amount !== undefined && amount !== 1 ? amount : undefined;
  const ids = useId();
  /** What keeps the action off, in the person's words (MM-220). */
  const stillNeeded: string[] = [
    ...(form.name.trim() === '' ? ['a name'] : []),
    ...(!amountOk ? ['an amount'] : []),
    ...(totals === undefined || totals.kcal <= 0 ? [showsCarbsAndFat ? 'calories above zero (typed, or from the macros)' : 'calories above zero'] : []),
    ...(calc === undefined && (p < 0 || c < 0 || f < 0) ? ['macros that are not negative'] : []),
  ];
  const mismatch =
    showsCarbsAndFat &&
    typedKcal !== undefined &&
    fromMacros !== 0 &&
    !macrosMatchEnergy({ kcal: typedKcal, proteinG: p, carbsG: c, fatG: f, alcoholG: a });

  const fill = (e: FoodEntry) => {
    setForm(filledFrom(e));
    setTemplate(e);
    setStep({ at: 'manual' });
    setSearch('');
  };

  const selectMethod = (method: QuantitySource) => {
    if (method === form.source) return;
    set({
      amountNeedsReentry: form.quantityWasEntered && form.quantity.trim() !== '' ? 'method' : false,
      converted: undefined,
      quantityWasEntered: false,
      source: method,
      unit: unitsOffered(method)[0],
      quantity: '',
      basis: method === 'labelServing' ? 'calculated' : 'enteredTotals',
      legacy: false,
    });
  };

  /** The method an edited calculated entry is now measured by. */
  const calcMethod = (): QuantitySource => {
    const unit = form.unit ?? 'serving';
    if (PortionUnit.isWeight(unit)) return 'weighed';
    if (unit === 'palm' || unit === 'cuppedHand' || unit === 'thumb') return unit;
    if (unit === 'serving') return form.source === 'householdMeasure' ? 'householdMeasure' : 'labelServing';
    return 'householdMeasure';
  };

  /**
   * An edited entry, or a food logged again, keeps the nutrients beyond the
   * macros its source stated, scaled by how much its energy changed (they
   * scale with the amount).
   */
  const scaledExtra = (value: number | undefined) => {
    if (value === undefined || base === undefined || totals === undefined) return undefined;
    return base.kcal <= 0 ? value : (value * totals.kcal) / base.kcal;
  };

  /**
   * Another unit: the same portion said in it when the two share an exact
   * measure for this food, or for typed totals weight to weight and volume
   * to volume; otherwise the amount is asked again (MM-628).
   */
  const changeUnit = (next: PortionUnit, reference: ReferenceNutrition | undefined) => {
    const from = form.unit;
    if (from === next) return;
    // A figure the person has not given is not a portion to keep.
    if (!form.quantityWasEntered) {
      set({ unit: next, converted: undefined });
      return;
    }
    const same =
      amount === undefined || from === undefined ? undefined : convertedQuantity(amount, { unit: from, reference }, { unit: next, reference }, { hand });
    if (same === undefined || amount === undefined || from === undefined) {
      set({ unit: next, quantity: '', quantityWasEntered: false, amountNeedsReentry: amount === undefined ? false : 'unit', converted: undefined });
      return;
    }
    const shown = quantityText(same);
    const was = from === 'serving' && reference?.servingDescription !== undefined ? `× ${reference.servingDescription}` : portionUnitOf(from, amount);
    set({
      unit: next,
      quantity: shown,
      quantityWasEntered: true,
      amountNeedsReentry: false,
      converted: { shown, value: same, from: `${quantityText(amount)} ${was}` },
    });
  };

  /** Edits nutrition per serving for servings, or totals for other amounts. */
  const enterTotalsMyself = () => {
    const alcohol =
      totals === undefined || form.calcAlcoholPerKcal === undefined ? undefined : totals.kcal * form.calcAlcoholPerKcal;
    const source = calcMethod();
    const servings = source === 'labelServing' ? amount : 1.0;
    const each = (value: number) => editableNumber(value / (servings ?? 1));
    const extra = (value: number | undefined) => (value === undefined ? '' : each(value));
    set({
      source,
      ...(totals === undefined
        ? {}
        : {
            kcal: each(totals.kcal),
            protein: each(totals.proteinG),
            carbs: each(totals.carbsG),
            fat: each(totals.fatG),
            alcohol: alcohol === undefined ? '' : each(alcohol),
            // The label's other lines follow the amount, as the macros do.
            fiber: extra(scaledExtra(base?.fiberG)),
            sodium: extra(scaledExtra(base?.sodiumMg)),
            sugars: extra(scaledExtra(base?.micros.of('sugars'))),
            saturatedFat: extra(scaledExtra(base?.micros.of('saturatedFat'))),
          }),
      calcRef: undefined,
      calcAlcoholPerKcal: undefined,
      basis: source === 'labelServing' ? 'calculated' : 'enteredTotals',
    });
  };

  const portion = (): Portion | undefined => {
    if (form.legacy) return undefined;
    if (calc !== undefined) {
      const unit = form.unit;
      const byHand = unit !== undefined && PortionUnit.isHand(unit);
      return {
        method: calcMethod(),
        basis: 'calculated',
        quantity: amount,
        unit,
        reference: calc,
        origin: base?.portion?.origin,
        preparation: base?.portion?.preparation,
        conversion: unit === undefined ? undefined : conversionFor(unit, calc, { hand }),
        impliedGrams: byHand ? gramsFor(amount ?? 0, unit, calc, { hand }) : undefined,
        handModelVersion: byHand ? HandModel.version : undefined,
      };
    }
    if (form.source === 'quickAdd') return { method: form.source, basis: 'enteredTotals' };
    return {
      method: form.source,
      basis: form.basis,
      quantity: amount,
      unit: form.basis === 'calculated' ? 'serving' : form.unit,
      reference: perServingRef,
    };
  };


  /** The entry the form describes, or undefined while its totals cannot be known. */
  const toSave = (): FoodEntry | undefined => {
    if (totals === undefined) return undefined;
    const logged = portion();
    let alcoholG: number | undefined;
    if (calc === undefined) alcoholG = a > 0 ? a * (form.basis === 'calculated' ? (amount ?? 1) : 1) : undefined;
    else {
      alcoholG =
        form.calcAlcoholPerKcal === undefined ? scaledExtra(base?.alcoholG) : totals.kcal * form.calcAlcoholPerKcal;
    }
    // The micronutrients scale with the amount, as fiber and sodium do (MM-308), for a food logged again too (MM-623).
    const scaledMicros = base === undefined ? Micronutrients.none : base.micros.times(base.kcal <= 0 ? 1 : totals.kcal / base.kcal);
    /** A typed label line, times the servings when the numbers are per serving; blank is unknown, never zero. */
    const typed = (text: string) => {
      const value = parseNumber(text);
      return value === undefined || value < 0 ? undefined : value * (form.basis === 'calculated' ? (amount ?? 1) : 1);
    };
    const saved = new FoodEntry({
      id: entry?.id ?? 0,
      date: day,
      meal,
      name: form.name.trim(),
      kcal: totals.kcal,
      proteinG: totals.proteinG,
      carbsG: totals.carbsG,
      fatG: totals.fatG,
      source: logged?.method ?? form.source,
      portion: logged,
      fiberG: calc === undefined ? typed(form.fiber) : scaledExtra(base?.fiberG),
      sugarAlcoholsG: scaledExtra(base?.sugarAlcoholsG),
      sodiumMg: calc === undefined ? typed(form.sodium) : scaledExtra(base?.sodiumMg),
      alcoholG,
      micros:
        calc === undefined
          ? scaledMicros.with('sugars', typed(form.sugars)).with('saturatedFat', typed(form.saturatedFat))
          : scaledMicros,
      eatenAt,
    });
    return saved;
  };

  const save = async () => {
    const saved = toSave();
    if (saved === undefined) return;
    // A failure is said, never swallowed (MM-624, as MM-591): nothing is logged, and the form stays to try again.
    try {
      if (entry === undefined && listed.length > 0) {
        // The last food of the meal's list, logged with the others (MM-631).
        await logList([saved]);
        return;
      }
      await (entry === undefined ? services.food.addFood(saved) : services.food.updateFood(saved));
    } catch {
      setSaveFailed(true);
      return;
    }
    onDone();
    // An entry moved to another day leaves this day's list; say where it went (MM-221).
    if (entry !== undefined && entry.date !== day) overlays.snack(`Moved to ${Fmt.day(day, today)}.`);
  };

  /**
   * Puts foods in the meal's list and goes back to finding the next, with
   * what was searched still there (MM-631). The first food's meal and time
   * become the list's.
   */
  const addToList = (entries: readonly FoodEntry[]) => {
    const first = entries[0];
    if (listed.length === 0 && first !== undefined) {
      setMeal(first.meal);
      setEatenAt(first.eatenAt);
    }
    setListed((current) => [...current, ...entries]);
    // Said, and the list's line takes focus, so a person who cannot see it grow knows it did (the UX guard's UX-1).
    overlays.snack(`Added ${entries.map((food) => food.name).join(' and ')} · ${foodsText(listed.length + entries.length)} in this meal`);
    setFocusList(true);
    setListFailed(false);
    setSaveFailed(false);
    setForm(blank);
    setTemplate(undefined);
    setStep({ at: 'choices' });
  };

  /**
   * Logs the list, and `last` with it, in one step at the list's meal and
   * time (MM-631, MM-625); rejects, logging none, when that cannot be done.
   */
  const logList = async (last: readonly FoodEntry[] = []) => {
    const all = [...listed, ...last].map((food) => food.copyWith({ date: day, meal, eatenAt }));
    await services.food.applyFoodChanges({ add: all });
    setListed([]);
    overlays.snack(`Logged ${foodsText(all.length)}`);
    onDone();
  };

  /** Adds the typed food to the meal's list (MM-631). */
  const addTypedToList = () => {
    const saved = toSave();
    if (saved !== undefined) addToList([saved]);
  };

  const pick = async (food: CatalogFood, barcode?: string) => {
    const [alternate, servings] =
      catalog === undefined ? [undefined, []] : await Promise.all([catalog.pairOf(food), catalog.servingsOf(food)]);
    // The state this food was last weighed in, however long ago, is where the switch starts (MM-151).
    const last = alternate === undefined ? undefined : await services.food.lastLoggedFrom(food.packId, [food.id, alternate.id]);
    const startOnAlternate =
      last?.portion?.unit !== undefined && PortionUnit.isWeight(last.portion.unit) && last.portion.origin?.foodId === alternate?.id;
    setStep({ at: 'amount', food, servings, alternate, startOnAlternate, barcode });
  };
  const pickCustom = (custom: CustomFood) =>
    setStep({ at: 'amount', food: customCatalogFood(custom), servings: [], custom });
  /** Back to the choices: the food being logged again is let go, so a food typed next inherits nothing (MM-623). */
  const choices = () => {
    setTemplate(undefined);
    setStep({ at: 'choices' });
  };

  if (step.at === 'amount') {
    return (
      <FoodAmountStep
        food={step.food}
        alternate={step.alternate}
        startOnAlternate={step.startOnAlternate}
        servings={step.servings}
        custom={step.custom}
        day={firstDay}
        meal={meal}
        onBack={choices}
        onDone={onDone}
        listed={listed.length}
        onAddToList={addToList}
        onLogWithList={(entries) => logList(entries)}
        onFix={
          step.custom === undefined
            ? () => setStep({ at: 'myFoods', draft: copyOfPackFood(step.food, step.servings, step.barcode) })
            : undefined
        }
      />
    );
  }
  if (step.at === 'myFoods') return <MyFoodsStep initialBarcode={step.barcode} draft={step.draft} onBack={choices} onPick={pickCustom} />;
  if (step.at === 'estimating') {
    return (
      <EstimateMealStep
        day={firstDay}
        meal={meal}
        initialSize={estimateSize ?? 'regular'}
        onManual={() => setStep({ at: 'manual' })}
        onBack={choices}
        onDone={onDone}
      />
    );
  }
  if (step.at === 'analyzing') {
    return <AnalyzeMealStep day={firstDay} meal={meal} onBack={choices} onDone={onDone} />;
  }
  if (step.at === 'scanning') {
    return (
      <BarcodeScanStep
        onFound={(food, gtin) => void pick(food, gtin)}
        onFoundCustom={pickCustom}
        onReadLabel={(gtin) => setStep({ at: 'myFoods', barcode: gtin })}
        onManual={() => setStep({ at: 'manual' })}
        onBack={choices}
      />
    );
  }

  const query = search.trim();
  const matches = (name: string) => name.toLowerCase().includes(query.toLowerCase());
  /** Whether the search found any of the person's own foods or anything in their log (MM-596, MM-637). */
  const ownFound = customFoods.some((food) => matches(food.name)) || (fromLog?.foods.length ?? 0) > 0 || (fromLog?.meals.length ?? 0) > 0;
  // The recent foods and meals as one list, newest first (MM-587): a meal by its newest food. What is usual at
  // the meal being added to comes first, most often first (MM-639), then what was last logged at it (MM-629).
  const newestOf = (m: LoggedMeal) => Math.max(...m.items.map((item) => item.id));
  const times = timesLoggedAt(meal, lastWeeks);
  /** How often a name was logged at this meal in the last four weeks, when that makes it usual there. */
  const usual = (name: string) => {
    const count = times.get(name.toLowerCase()) ?? 0;
    return count >= usualTimes ? count : 0;
  };
  const recentRows: readonly ({ kind: 'food'; entry: FoodEntry } | { kind: 'meal'; meal: LoggedMeal })[] = [
    ...recents.map((entry) => ({ kind: 'food' as const, entry, newest: entry.id, here: entry.meal === meal, usual: usual(entry.name) })),
    ...recentMeals.map((m) => ({ kind: 'meal' as const, meal: m, newest: newestOf(m), here: m.meal === meal, usual: usual(m.name) })),
  ].sort((a, b) => b.usual - a.usual || Number(b.here) - Number(a.here) || b.newest - a.newest);
  /** A food from the log's grade, as it was logged (MM-596). */
  const entryGradeBeside = (e: FoodEntry) => {
    const grade = gradeOfFood?.(e.name) ?? gradeOfFoodEntry(e, { hand });
    return <FoodGrade grade={grade} subject={e.name} />;
  };
  const mealGradeBeside = (m: LoggedMeal) => {
    const grade = gradeOfLoggedMeal(m, { hand });
    return grade === undefined ? undefined : <FoodGrade grade={grade} subject={m.name} scope="meal" />;
  };
  /**
   * Logs a recent meal again, to the sheet's day and slot, at its time, in one press (MM-587): once, however
   * often the row is pressed while it is being logged, and a failure is said (MM-624).
   */
  const logAgain = async (m: LoggedMeal) => {
    // With foods in the meal's list, a meal joins them, at the list's meal and time (MM-631).
    if (listed.length > 0) {
      addToList(entriesCopiedTo(day, m.items, { meal }));
      return;
    }
    if (relogging.current) return;
    relogging.current = true;
    try {
      await relogMeal(services.food, m, { date: day, meal, eatenAt });
    } catch {
      overlays.snack(`${m.name} could not be logged, so nothing was.`);
      return;
    } finally {
      relogging.current = false;
    }
    overlays.snack(`Logged ${m.name}`);
    onDone();
  };

  /**
   * The amount: units to choose, and a field that takes decimals and
   * simple fractions. An Estimate has none; an old entry is not asked for
   * one.
   */
  const amountFields = () => {
    if (form.legacy) {
      return (
        <>
          <div className="app-gap-small" />
          <Notice text="This entry was logged without an amount. To add one, choose how it was measured." />
        </>
      );
    }
    if (form.source === 'quickAdd') return null;
    const units = unitsOffered(form.source);
    const unit = form.unit;
    const empty = form.quantity.trim() === '';
    let label = 'Amount';
    if (form.source === 'labelServing') label = 'Servings eaten';
    else if (form.source === 'palm' || form.source === 'cuppedHand' || form.source === 'thumb') {
      label = `How many ${unit === undefined ? '' : portionUnitOf(unit, 2)}`;
    }
    let helper: string | undefined;
    if (form.amountNeedsReentry !== false && empty) {
      helper = form.amountNeedsReentry === 'method' ? 'Enter how much again for this method.' : 'Enter how much again in this unit.';
    } else if (amount === undefined) helper = empty ? 'How much did you eat?' : 'An amount above zero is needed.';
    else if (form.converted !== undefined && form.quantity === form.converted.shown) helper = `Same amount as ${form.converted.from}.`;
    return (
      <>
        {units.length > 1 ? (
          <div className="app-row food-chips" role="group" aria-label="Unit">
            {units.map((u) => (
              <MmChoiceChip key={u} label={portionUnitChipLabel(u)} selected={unit === u} onSelect={() => changeUnit(u, undefined)} />
            ))}
          </div>
        ) : null}
        <div className="app-gap-small" />
        <MmTextField
          label={label}
          suffix={
            unit === undefined || (units.length === 1 && unit === 'serving') ? undefined : portionUnitOf(unit, amount ?? 2)
          }
          kind="quantity"
          value={form.quantity}
          helper={helper}
          helperIsWarning={amount === undefined && !empty}
          onChange={(text) =>
            set({
              quantity: text,
              quantityWasEntered: text.trim() !== '',
              ...(parseQuantity(text) === undefined ? {} : { amountNeedsReentry: false as const }),
            })
          }
        />
      </>
    );
  };

  /** How it was measured, the amount, what the numbers are for, and the numbers themselves. */
  const typedFields = () => {
    const perServing = form.basis === 'calculated';
    return (
      <>
        <p className="food-label food-label-spaced">How was it measured?</p>
        <div className="app-row" role="group" aria-label="How was it measured?">
          {/* A photo estimate comes only from an AI meal analysis (MM-586), never from typing. */}
          {QuantitySource.values.filter((source) => source !== 'photoEstimate').map((source) => (
            <MmChoiceChip
              key={source}
              label={quantitySourceLabel(source)}
              // An old entry without an amount has no method chosen until the person chooses one (MM-221).
              selected={!form.legacy && form.source === source}
              onSelect={() => selectMethod(source)}
            />
          ))}
        </div>
        {amountFields()}
        <p className="food-label food-label-spaced">
          {perServing ? 'Nutrition per serving' : form.source === 'quickAdd' ? 'Nutrition for everything eaten' : 'Nutrition for this amount'}
        </p>
        {/* Calories first, the number people know, then what makes it up (the owner, 2026-10-26, MM-643). */}
        <MmTextField
          label={perServing ? 'Calories per serving' : 'Calories'}
          kind="number"
          value={form.kcal}
          hint={showsCarbsAndFat && fromMacros > 0 ? `${whole(fromMacros)} from macros` : undefined}
          helper={
            mismatch
              // The kept basis, never a second "logged" figure beside the Logs line (the panel's PD-1, F2).
              ? `Macros add up to ${whole(fromMacros)} kcal${perServing ? ' per serving' : ''}; the ${whole(typedKcal ?? 0)} typed is kept. Double-check the label.`
              : showsCarbsAndFat
                ? 'Leave blank to calculate from macros.'
                : 'As the label states them.'
          }
          helperIsWarning={mismatch}
          onChange={(kcal) => set({ kcal })}
        />
        <div className="food-fields">
          <MmTextField label="Protein g" kind="number" dense value={form.protein} onChange={(protein) => set({ protein })} />
          {/* Simple detail asks for calories and protein only (MM-49); what is typed at another level is kept. */}
          {showsCarbsAndFat ? (
            <>
              <MmTextField label="Carbs g" kind="number" dense value={form.carbs} onChange={(carbs) => set({ carbs })} />
              <MmTextField label="Fat g" kind="number" dense value={form.fat} onChange={(fat) => set({ fat })} />
            </>
          ) : null}
        </div>
        {showsCarbsAndFat ? null : (
          // What Simple leaves out is said, so a zero seen later at Standard is no surprise (the panel's UX-5).
          <p className="app-caption food-reference-line">Carbs and fat are not asked at Simple detail and are logged as 0.</p>
        )}
        {DetailLevel.showsExtras(level) ? (
          <>
            {/* Full detail takes the label's other lines too, two to a line as a saved food's are (MM-309), unfolded because Full asked for them. */}
            <p className="food-label food-label-spaced">More from the label (optional)</p>
            <div className="food-extra-fields">
              <MmTextField label="Fiber g" kind="number" dense value={form.fiber} onChange={(fiber) => set({ fiber })} />
              <MmTextField label="Sugars g" kind="number" dense value={form.sugars} onChange={(sugars) => set({ sugars })} />
              <MmTextField
                label="Saturated fat g"
                kind="number"
                dense
                value={form.saturatedFat}
                onChange={(saturatedFat) => set({ saturatedFat })}
              />
              <MmTextField label="Sodium mg" kind="number" dense value={form.sodium} onChange={(sodium) => set({ sodium })} />
            </div>
          </>
        ) : null}
        <div className="app-gap-small" />
        {askAlcohol || form.alcohol !== '' ? (
          <>
            {/* Grams, or standard drinks that fill them in (MM-127). */}
            <AlcoholFields grams={form.alcohol} onGrams={(alcohol) => set({ alcohol })} />
            <div className="app-gap-small" />
          </>
        ) : (
          <MmButton label="Includes alcohol?" kind="text" onPress={() => setAskAlcohol(true)} />
        )}
      </>
    );
  };

  /**
   * An entry calculated from a food's own numbers: change the amount and
   * the totals follow, or type the totals yourself.
   */
  const calculatedFields = (reference: ReferenceNutrition) => {
    const candidates = calculatedUnits.filter((u) => scaleNutrition(1, u, reference, { hand }) !== undefined);
    const unit = form.unit;
    return (
      <>
        <div className="app-row food-chips" role="group" aria-label="Unit">
          {candidates.map((u) => (
            <MmChoiceChip
              key={u}
              label={u === 'serving' ? (reference.servingDescription ?? 'Servings') : portionUnitChipLabel(u)}
              selected={unit === u}
              onSelect={() => changeUnit(u, reference)}
            />
          ))}
        </div>
        <div className="app-gap-small" />
        <MmTextField
          label={unit === 'serving' ? 'How many' : 'Amount'}
          suffix={unit === undefined || unit === 'serving' ? undefined : portionUnitOf(unit, amount ?? 2)}
          kind="quantity"
          value={form.quantity}
          helper={
            form.amountNeedsReentry === 'unit' && form.quantity.trim() === ''
              ? 'Enter how much again in this unit.'
              : amount === undefined
                ? 'An amount above zero is needed.'
                : form.converted !== undefined && form.quantity === form.converted.shown
                  ? `Same amount as ${form.converted.from}.`
                  : undefined
          }
          helperIsWarning={amount === undefined && !(form.amountNeedsReentry === 'unit' && form.quantity.trim() === '')}
          onChange={(quantity) => set({ quantity })}
        />
        {/* The numbers the entry rests on, in the terms they were typed (MM-221). */}
        <p className="app-caption food-reference-line">
          {referenceBasisLabel(reference.basis)}: {whole(reference.nutrition.kcal)} kcal · {whole(reference.nutrition.proteinG)} g protein
          {showsCarbsAndFat ? ` · ${whole(reference.nutrition.carbsG)} g carbs · ${whole(reference.nutrition.fatG)} g fat` : ''}
        </p>
        <MmButton
          label={unit === 'serving' ? 'Edit nutrition per serving' : 'Enter the totals myself'}
          kind="text"
          onPress={enterTotalsMyself}
        />
      </>
    );
  };

  /**
   * The name, the amount and the numbers: what the sheet collects once a
   * food is being typed or edited and not searched for.
   */
  /** The typed form's action: this food alone, or with the meal's list (MM-631). */
  const formLogLabel = listed.length > 0 ? `Log ${listed.length + 1} foods` : 'Log it';

  const formFields = () => (
    <>
      {/* When it was eaten comes first, before what and how much (MM-576). */}
      <div className="app-gap-small" />
      {/* In a meal's list, its meal and time are the list's, set once (MM-631). */}
      {listed.length > 0 && !isEditing ? null : (
        <>
          <MealChips meal={meal} onChange={setMeal} />
          <TimeEatenRow eatenAt={eatenAt} meal={meal} onChange={setEatenAt} />
        </>
      )}
      <div className="app-gap-small" />
      <MmTextField label="Food name" value={form.name} onChange={(name) => set({ name })} helper={form.name.trim() === '' ? 'A name is needed.' : undefined} />
      {calc === undefined ? typedFields() : calculatedFields(calc)}
      {/* The split needs all three macros; Simple detail does not draw it (MM-49), as on the hero. */}
      {totals !== undefined && showsCarbsAndFat && totals.proteinG >= 0 && totals.carbsG >= 0 && totals.fatG >= 0 ? (
        <>
          <p className="food-label food-label-spaced">Macro split</p>
          <MacroSplitChart
            isPreview
            netCarbs={netCarbs}
            intake={
              new IntakeDay({
                date: day,
                kcal: totals.kcal,
                proteinG: totals.proteinG,
                carbsG: totals.carbsG,
                fatG: totals.fatG,
              })
            }
          />
        </>
      ) : null}
      {/* What will be recorded, in every state the action is enabled, and before it is (MM-218): one wording across the sheet. */}
      {totals !== undefined ? (
        <p id={`${ids}-logs`} className="app-subhead food-totals" data-testid="logged-totals">
          Logs {whole(totals.kcal)} kcal · {whole(totals.proteinG)} g protein
          {showsCarbsAndFat ? ` · ${whole(totals.carbsG)} g carbs · ${whole(totals.fatG)} g fat` : ''}
          {servingsLogged !== undefined ? ` (${editableNumber(servingsLogged)} servings)` : ''}
        </p>
      ) : null}
      <div className="app-gap" />
      {valid ? null : (
        // An action that is off says what is still needed, beside it (MM-220).
        <p id={`${ids}-needed`} className="app-caption food-still-needed">{`Still needed: ${stillNeeded.join(', ')}.`}</p>
      )}
      {saveFailed ? (
        <Notice
          icon="warning"
          text={
            isEditing
              ? 'The change could not be saved, so the food is as it was. Press Save changes to try again.'
              : `The food could not be logged, so nothing was. Press ${formLogLabel} to try again.`
          }
        />
      ) : null}
      <MmButton
        label={isEditing ? 'Save changes' : formLogLabel}
        icon={!isEditing && listed.length > 0 ? 'check' : undefined}
        expand
        onPress={valid ? () => save() : undefined}
        // The action carries what it will record and what keeps it off, for a reader landing on it (the guard's F1, F3).
        describedBy={[totals === undefined ? undefined : `${ids}-logs`, valid ? undefined : `${ids}-needed`].filter((id) => id !== undefined).join(' ') || undefined}
      />
      {isEditing ? null : (
        // One meal of several foods, without logging each (MM-631).
        <MmButton label="Add another food" kind="secondary" icon="plus" expand onPress={valid ? addTypedToList : undefined} />
      )}
    </>
  );

  /**
   * The meal's list (MM-631): its meal and time, set once, its foods with a
   * way to take one out, and its one action. While a search is typed it is
   * its one line, so the results stay in view (the designer's PD-1).
   */
  const listBlock = (folded: boolean) => {
    const kcal = listed.reduce((sum, food) => sum + food.kcal, 0);
    const logNow = async () => {
      try {
        await logList();
      } catch {
        setListFailed(true);
      }
    };
    const takeOut = (at: number) => {
      const food = listed[at];
      if (food === undefined) return;
      setListed((current) => current.filter((_, k) => k !== at));
      setFocusList(true);
      overlays.snack(`Removed ${food.name}`, {
        label: 'Undo',
        onAction: () => setListed((current) => [...current.slice(0, at), food, ...current.slice(at)]),
      });
    };
    const line = (
      <p ref={listLine} tabIndex={-1} className="food-label food-label-spaced">
        {`In this meal · ${foodsText(listed.length)} · ${Fmt.kcal(kcal)}`}
      </p>
    );
    if (folded) return line;
    return (
      <>
        {/* Meal and time first, then what they hold, as an analysed meal's review has it (MM-318, the designer's PD-2). */}
        <div className="app-gap-small" />
        <MealChips meal={meal} onChange={setMeal} />
        <TimeEatenRow eatenAt={eatenAt} meal={meal} onChange={setEatenAt} />
        {line}
        {listed.map((food, at) => (
          <MmListRow
            // A food may be in the list twice; its place tells them apart.
            key={`${at}-${food.name}`}
            title={food.name}
            subtitle={[portionAmount(food), Fmt.kcal(food.kcal)].filter((part) => part !== undefined).join(' · ')}
            trailingAction={<MmIconButton icon="delete" label={`Remove ${food.name}`} onPress={() => takeOut(at)} />}
          />
        ))}
        <div className="app-gap-small" />
        {listFailed ? (
          <Notice icon="warning" text={`The foods could not be logged, so none were. Press Log ${foodsText(listed.length)} to try again.`} />
        ) : null}
        <MmButton label={`Log ${foodsText(listed.length)}`} icon="check" expand onPress={() => logNow()} />
        <div className="app-gap" />
      </>
    );
  };

  const searching = !isEditing && step.at === 'choices';
  return (
    <div className="food-sheet">
      <h2 className="app-headline">{isEditing ? 'Edit food' : 'Add food'}</h2>
      {searching ? <MmTextField label="Search foods" value={search} onChange={setSearch} /> : null}
      {searching && listed.length > 0 ? listBlock(query !== '') : null}
      {/* With foods in the list, only the ways that add to it: AI analysis, Saved and Estimate log on their own (MM-631). */}
      {searching && query === '' && listed.length > 0 ? (
        <MmButton label="Scan" kind="secondary" icon="barcode" expand onPress={() => setStep({ at: 'scanning' })} />
      ) : null}
      {searching && query === '' && listed.length === 0 ? (
        <>
          {/* The person's own AI, one press from a meal's "+" rather than inside Estimate (MM-598): 12 px from the
              search and from the row under it, which fills the same width (MM-600). */}
          <div className="app-gap-small" />
          <MmButton label="AI meal analysis" kind="secondary" icon="assistant" expand onPress={() => setStep({ at: 'analyzing' })} />
          <div className="app-row food-chips food-chips-fill">
            <MmButton label="Scan" kind="secondary" icon="barcode" onPress={() => setStep({ at: 'scanning' })} />
            <MmButton label="Saved" kind="secondary" icon="history" onPress={() => setStep({ at: 'myFoods' })} />
            <MmButton label="Estimate" kind="secondary" icon="food" onPress={() => setStep({ at: 'estimating' })} />
          </div>
        </>
      ) : null}
      {isEditing ? (
        <>
          {/* The same control as the Food screen's day header, so it says what it does here: it moves the entry (MM-221). */}
          <p className="food-label" aria-hidden="true">
            Logged on
          </p>
          <DayStepper
            name="Logged on"
            label={Fmt.day(day, today)}
            onPrevious={() => setDay(day.addDays(-1))}
            onNext={day.isBefore(today) ? () => setDay(day.addDays(1)) : undefined}
            onLabelPress={undefined}
          />
        </>
      ) : null}
      {searching ? (
        <>
          {query !== '' ? (
            <>
              {/* The person's own foods and log, apart from the food database's, each under its own heading (MM-637). */}
              {ownFound ? <p className="food-label food-label-spaced">Your foods and meals</p> : null}
              {customFoods
                .filter((food) => matches(food.name))
                .map((food) => (
                  <MmListRow
                    key={`custom-${food.id}`}
                    title={food.name}
                    subtitle={
                      `${food.kind === 'recipe' ? 'Your recipe' : 'Your food'} · ` +
                      `${food.servingDescription} · ${Fmt.kcal(food.perServing.kcal)}`
                    }
                    opens
                    onPress={() => pickCustom(food)}
                    trailingAction={gradeBeside(food.name)}
                  />
                ))}
              {/* Everything ever logged that matches, not only the recent (MM-596). */}
              {(fromLog?.meals ?? []).map((m) => (
                <RecentMealRow key={`logged-meal-${m.key}`} lead="From your log" meal={m} onPress={() => void logAgain(m)} trailingAction={mealGradeBeside(m)} />
              ))}
              {(fromLog?.foods ?? []).map((e) => (
                <RecentFoodRow key={`logged-${e.id}`} lead="From your log" entry={e} onPress={() => fill(e)} trailingAction={entryGradeBeside(e)} />
              ))}
              <FoodSearchResults query={query} onPick={(food) => void pick(food)} alsoFound={ownFound} />
              {/* Beside the phone's results, never inside them, so it keeps its state while they settle (MM-58). */}
              <OnlineSearchResults query={query} onPick={(food) => void pick(food)} />
            </>
          ) : recentRows.length > 0 ? (
            <>
              <p className="food-label food-label-spaced">Recent foods</p>
              {/* Rows, never a sideways scroller: a long name wraps (MM-439). The five newest first, as search pages its results (MM-410). */}
              {/* A meal is among them as one row, by when it was last logged (MM-587). */}
              {(allRecents ? recentRows : recentRows.slice(0, recentsFirst)).map((row, index) =>
                row.kind === 'meal' ? (
                  <RecentMealRow
                    key={`meal-${row.meal.key}`}
                    meal={row.meal}
                    onPress={() => void logAgain(row.meal)}
                    trailingAction={mealGradeBeside(row.meal)}
                    autoFocus={allRecents && index === recentsFirst}
                  />
                ) : (
                  <RecentFoodRow
                    key={row.entry.id}
                    entry={row.entry}
                    onPress={() => fill(row.entry)}
                    trailingAction={gradeBeside(row.entry.name)}
                    autoFocus={allRecents && index === recentsFirst}
                  />
                ),
              )}
              {allRecents || recentRows.length <= recentsFirst ? null : (
                <MmButton label="More recent foods" kind="text" expand onPress={() => setAllRecents(true)} />
              )}
            </>
          ) : null}
          <div className="app-gap-small" />
          <MmButton
            label="Enter manually"
            kind="secondary"
            expand
            onPress={() => {
              setTemplate(undefined);
              if (query !== '') set({ name: query });
              setSearch('');
              setStep({ at: 'manual' });
            }}
          />
          {query === '' || listed.length > 0 ? null : (
            // Not found, or not worth finding: the estimate stays in reach from the results (MM-219).
            <MmButton label="Estimate a meal" kind="text" expand onPress={() => setStep({ at: 'estimating' })} />
          )}
        </>
      ) : (
        <>
          {isEditing ? null : <MmButton label="Back to food choices" kind="text" onPress={choices} />}
          {formFields()}
        </>
      )}
    </div>
  );
}
