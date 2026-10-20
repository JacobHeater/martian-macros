import { useState, useId } from 'react';
import { MacroSplitChart } from '../charts/MacroSplitChart';
import { useNetCarbs } from './useNetCarbs';
import { useInsightPreview } from '../coach/useInsightPreview';
import { gradeOfCustomFood } from '../engine/gradeOfCustomFood';
import { gradeOfFoodEntry } from '../engine/gradeOfFoodEntry';
import { atwaterKcal } from '../domain/atwaterKcal';
import type { CalendarDate } from '../domain/CalendarDate';
import type { CustomFood } from '../domain/food/custom/CustomFood';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import type { MealSize } from '../domain/food/estimate/MealSize';
import { Micronutrients } from '../domain/food/micros/Micronutrients';
import { HandModel } from '../domain/food/hand/HandModel';
import { conversionFor } from '../domain/food/portion/conversionFor';
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
import { IntakeDay } from '../domain/IntakeDay';
import { macrosMatchEnergy } from '../domain/macrosMatchEnergy';
import type { Meal } from '../domain/Meal';
import { QuantitySource } from '../domain/QuantitySource';
import type { CatalogFood } from '../foodCatalog/CatalogFood';
import type { CatalogServing } from '../foodCatalog/CatalogServing';
import { Fmt } from '../format/Fmt';
import { parseNumber } from '../format/parseNumber';
import { portionUnitChipLabel } from '../format/portionUnitChipLabel';
import { portionUnitOf } from '../format/portionUnitOf';
import { quantitySourceLabel } from '../format/quantitySourceLabel';
import { referenceBasisLabel } from '../format/referenceBasisLabel';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { DayStepper } from '../ui/DayStepper';
import { MmActionChip } from '../ui/MmActionChip';
import { MmButton } from '../ui/MmButton';
import { useOverlays } from '../ui/useOverlays';
import { MmChoiceChip } from '../ui/MmChoiceChip';
import { MmListRow } from '../ui/MmListRow';
import { MmTextField } from '../ui/MmTextField';
import { Notice } from '../ui/Notice';
import { customCatalogFood } from './custom/customCatalogFood';
import { MyFoodsStep } from './custom/MyFoodsStep';
import { defaultMeal } from './defaultMeal';
import { editableNumber } from './editableNumber';
import { EstimateMealStep } from './estimate/EstimateMealStep';
import { FoodAmountStep } from './FoodAmountStep';
import { FoodGrade } from './FoodGrade';
import { FoodSearchResults } from './FoodSearchResults';
import { OnlineSearchResults } from './online/OnlineSearchResults';
import { MealChips } from './MealChips';
import { BarcodeScanStep } from './scan/BarcodeScanStep';
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
  readonly amountNeedsReentry: boolean;
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

const calculatedUnits: readonly PortionUnit[] = [
  'serving',
  'gram',
  'ounce',
  'cup',
  'tablespoon',
  'teaspoon',
  'milliliter',
  'palm',
  'cuppedHand',
  'thumb',
];

type Step =
  | { readonly at: 'choices' }
  | { readonly at: 'manual' }
  | { readonly at: 'scanning' }
  | { readonly at: 'estimating' }
  | { readonly at: 'myFoods'; readonly barcode?: string | undefined }
  | {
      readonly at: 'amount';
      readonly food: CatalogFood;
      readonly servings: readonly CatalogServing[];
      readonly alternate?: CatalogFood | undefined;
      readonly startOnAlternate?: boolean | undefined;
      readonly custom?: CustomFood | undefined;
    };

/**
 * Logs one food: found by search, scanned, one of the user's own,
 * estimated, or typed by its macros. Recent foods refill the form in one
 * tap. An entry already logged is corrected here too.
 */
export function AddFoodSheet({ day: firstDay, meal: firstMeal, entry, initialQuery, estimateSize, onDone }: AddFoodSheetProps) {
  const { services, state } = useApp();
  const { gradeOfFood } = useInsightPreview();
  const netCarbs = useNetCarbs();
  const today = useCell(state.today);
  const overlays = useOverlays();
  const hand = useCell(state.handSize);
  const recents = useLoaded(state.recentFoods) ?? [];
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
  const [step, setStep] = useState<Step>(() => {
    if (isEditing) return { at: 'manual' };
    return estimateSize === undefined ? { at: 'choices' } : { at: 'estimating' };
  });
  const [form, setForm] = useState<Form>(() => (entry === undefined ? blank : editing(entry)));
  const [askAlcohol, setAskAlcohol] = useState(false);
  const [meal, setMeal] = useState<Meal>(() => entry?.meal ?? firstMeal ?? defaultMeal(services.clock));
  const [day, setDay] = useState(entry?.date ?? firstDay);
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
  const amount = parseQuantity(form.quantity);
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
    setStep({ at: 'manual' });
    setSearch('');
  };

  const selectMethod = (method: QuantitySource) => {
    if (method === form.source) return;
    set({
      amountNeedsReentry: form.quantityWasEntered && form.quantity.trim() !== '',
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
   * An edited entry keeps the nutrients beyond the macros its source
   * stated, scaled by how much its energy changed (they scale with the
   * amount).
   */
  const scaledExtra = (value: number | undefined) => {
    if (value === undefined || entry === undefined || totals === undefined) return undefined;
    return entry.kcal <= 0 ? value : (value * totals.kcal) / entry.kcal;
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
            fiber: extra(scaledExtra(entry?.fiberG)),
            sodium: extra(scaledExtra(entry?.sodiumMg)),
            sugars: extra(scaledExtra(entry?.micros.of('sugars'))),
            saturatedFat: extra(scaledExtra(entry?.micros.of('saturatedFat'))),
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
        origin: entry?.portion?.origin,
        preparation: entry?.portion?.preparation,
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


  const save = async () => {
    if (totals === undefined) return;
    const logged = portion();
    let alcoholG: number | undefined;
    if (calc === undefined) alcoholG = a > 0 ? a * (form.basis === 'calculated' ? (amount ?? 1) : 1) : undefined;
    else {
      alcoholG =
        form.calcAlcoholPerKcal === undefined ? scaledExtra(entry?.alcoholG) : totals.kcal * form.calcAlcoholPerKcal;
    }
    // The micronutrients scale with the amount, as fiber and sodium do (MM-308).
    const scaledMicros = entry === undefined ? Micronutrients.none : entry.micros.times(entry.kcal <= 0 ? 1 : totals.kcal / entry.kcal);
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
      fiberG: calc === undefined ? typed(form.fiber) : scaledExtra(entry?.fiberG),
      sugarAlcoholsG: scaledExtra(entry?.sugarAlcoholsG),
      sodiumMg: calc === undefined ? typed(form.sodium) : scaledExtra(entry?.sodiumMg),
      alcoholG,
      micros:
        calc === undefined
          ? scaledMicros.with('sugars', typed(form.sugars)).with('saturatedFat', typed(form.saturatedFat))
          : scaledMicros,
    });
    await (entry === undefined ? services.food.addFood(saved) : services.food.updateFood(saved));
    onDone();
    // An entry moved to another day leaves this day's list; say where it went (MM-221).
    if (entry !== undefined && entry.date !== day) overlays.snack(`Moved to ${Fmt.day(day, today)}.`);
  };

  const pick = async (food: CatalogFood) => {
    const [alternate, servings] =
      catalog === undefined ? [undefined, []] : await Promise.all([catalog.pairOf(food), catalog.servingsOf(food)]);
    // The state this food was last weighed in, however long ago, is where the switch starts (MM-151).
    const last = alternate === undefined ? undefined : await services.food.lastLoggedFrom(food.packId, [food.id, alternate.id]);
    const startOnAlternate =
      last?.portion?.unit !== undefined && PortionUnit.isWeight(last.portion.unit) && last.portion.origin?.foodId === alternate?.id;
    setStep({ at: 'amount', food, servings, alternate, startOnAlternate });
  };
  const pickCustom = (custom: CustomFood) =>
    setStep({ at: 'amount', food: customCatalogFood(custom), servings: [], custom });
  const choices = () => setStep({ at: 'choices' });

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
      />
    );
  }
  if (step.at === 'myFoods') return <MyFoodsStep initialBarcode={step.barcode} onBack={choices} />;
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
  if (step.at === 'scanning') {
    return (
      <BarcodeScanStep
        onFound={(food) => void pick(food)}
        onFoundCustom={pickCustom}
        onReadLabel={(gtin) => setStep({ at: 'myFoods', barcode: gtin })}
        onManual={() => setStep({ at: 'manual' })}
        onBack={choices}
      />
    );
  }

  const query = search.trim();
  const matches = (name: string) => name.toLowerCase().includes(query.toLowerCase());

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
    if (form.amountNeedsReentry) helper = 'Enter how much again for this method.';
    else if (amount === undefined) helper = empty ? 'How much did you eat?' : 'An amount above zero is needed.';
    return (
      <>
        {units.length > 1 ? (
          <div className="app-row food-chips" role="group" aria-label="Unit">
            {units.map((u) => (
              <MmChoiceChip key={u} label={portionUnitChipLabel(u)} selected={unit === u} onSelect={() => set({ unit: u })} />
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
              ...(parseQuantity(text) === undefined ? {} : { amountNeedsReentry: false }),
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
          {QuantitySource.values.map((source) => (
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
            <MmTextField
              label="Alcohol g"
              kind="number"
              value={form.alcohol}
              helper="One standard drink is 14 g. Counted at 7 kcal per gram."
              onChange={(alcohol) => set({ alcohol })}
            />
            <div className="app-gap-small" />
          </>
        ) : (
          <MmButton label="Includes alcohol?" kind="text" onPress={() => setAskAlcohol(true)} />
        )}
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
              onSelect={() => set({ unit: u, quantity: '' })}
            />
          ))}
        </div>
        <div className="app-gap-small" />
        <MmTextField
          label={unit === 'serving' ? 'How many' : 'Amount'}
          suffix={unit === undefined || unit === 'serving' ? undefined : portionUnitOf(unit, amount ?? 2)}
          kind="quantity"
          value={form.quantity}
          helper={amount === undefined ? 'An amount above zero is needed.' : undefined}
          helperIsWarning={amount === undefined}
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
  const formFields = () => (
    <>
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
      <div className="app-gap" />
      <MealChips meal={meal} onChange={setMeal} />
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
      <MmButton
        label={isEditing ? 'Save changes' : 'Log it'}
        expand
        onPress={valid ? () => void save() : undefined}
        // The action carries what it will record and what keeps it off, for a reader landing on it (the guard's F1, F3).
        describedBy={[totals === undefined ? undefined : `${ids}-logs`, valid ? undefined : `${ids}-needed`].filter((id) => id !== undefined).join(' ') || undefined}
      />
    </>
  );

  const searching = !isEditing && step.at === 'choices';
  return (
    <div className="food-sheet">
      <h2 className="app-headline">{isEditing ? 'Edit food' : 'Add food'}</h2>
      {searching ? <MmTextField label="Search foods" value={search} onChange={setSearch} /> : null}
      {searching && query === '' ? (
        <div className="app-row food-chips">
          <MmButton label="Scan" kind="secondary" icon="barcode" onPress={() => setStep({ at: 'scanning' })} />
          <MmButton label="Saved" kind="secondary" icon="history" onPress={() => setStep({ at: 'myFoods' })} />
          <MmButton label="Estimate" kind="secondary" icon="food" onPress={() => setStep({ at: 'estimating' })} />
        </div>
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
              {recents
                .filter((e) => matches(e.name))
                .map((e) => (
                  <MmListRow
                    key={`recent-${e.id}`}
                    title={e.name}
                    // An estimated meal keeps its mark when it comes back from recents (MM-150).
                    subtitle={`Your recent food · ${e.source === 'quickAdd' ? 'estimated · ' : ''}${whole(e.kcal)} kcal`}
                    onPress={() => fill(e)}
                    trailingAction={gradeBeside(e.name)}
                  />
                ))}
              <FoodSearchResults
                query={query}
                onPick={(food) => void pick(food)}
                alsoFound={customFoods.some((food) => matches(food.name)) || recents.some((e) => matches(e.name))}
              />
              {/* Beside the phone's results, never inside them, so it keeps its state while they settle (MM-58). */}
              <OnlineSearchResults query={query} onPick={(food) => void pick(food)} />
            </>
          ) : recents.length > 0 ? (
            <>
              <p className="food-label food-label-spaced">Recent foods</p>
              <div className="food-recents">
                {recents.map((e) => (
                  // An estimate keeps its mark where the one-tap path is (MM-150).
                  <MmActionChip key={e.id} label={e.source === 'quickAdd' ? `${e.name} · estimated` : e.name} onPress={() => fill(e)} />
                ))}
              </div>
            </>
          ) : null}
          <div className="app-gap-small" />
          <MmButton
            label="Enter manually"
            kind="secondary"
            expand
            onPress={() => {
              if (query !== '') set({ name: query });
              setSearch('');
              setStep({ at: 'manual' });
            }}
          />
          {query === '' ? null : (
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
