import { useState } from 'react';
import { MacroSplitChart } from '../charts/MacroSplitChart';
import { useInsightPreview } from '../coach/useInsightPreview';
import { atwaterKcal } from '../domain/atwaterKcal';
import type { CalendarDate } from '../domain/CalendarDate';
import type { CustomFood } from '../domain/food/custom/CustomFood';
import type { MealSize } from '../domain/food/estimate/MealSize';
import { HandModel } from '../domain/food/hand/HandModel';
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
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { DayStepper } from '../ui/DayStepper';
import { MmActionChip } from '../ui/MmActionChip';
import { MmButton } from '../ui/MmButton';
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
    source: e.source,
    basis: 'enteredTotals',
  };
  if (portion?.quantity !== undefined && portion.unit !== undefined) {
    form = { ...form, unit: portion.unit, quantity: editableNumber(portion.quantity), quantityWasEntered: true };
    if (e.source === 'labelServing' && portion.unit === 'serving' && portion.quantity > 0) {
      const servings = portion.quantity;
      form = {
        ...form,
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
      readonly custom?: CustomFood | undefined;
    };

/**
 * Logs one food: found by search, scanned, one of the user's own,
 * estimated, or typed by its macros. Recent foods refill the form in one
 * tap. An entry already logged is corrected here too.
 */
export function AddFoodSheet({ day: firstDay, meal: firstMeal, entry, initialQuery, estimateSize, onDone }: AddFoodSheetProps) {
  const { services, state } = useApp();
  // A grade beside each food found (MM-370), as the pack's results have: none in the app until grades are built.
  const { gradeOfFood } = useInsightPreview();
  const gradeBeside = (name: string) => {
    const grade = gradeOfFood?.(name);
    return grade === undefined ? undefined : <FoodGrade grade={grade} subject={name} />;
  };
  const today = useCell(state.today);
  const hand = useCell(state.handSize);
  const recents = useLoaded(state.recentFoods) ?? [];
  const customFoods = useLoaded(state.customFoods) ?? [];
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
  /** Calories as typed, or derived from macros when left blank. */
  const energy = typedKcal ?? (fromMacros > 0 ? fromMacros : undefined);
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

  const mismatch =
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

  /** Edits nutrition per serving for servings, or totals for other amounts. */
  const enterTotalsMyself = () => {
    const alcohol =
      totals === undefined || form.calcAlcoholPerKcal === undefined ? undefined : totals.kcal * form.calcAlcoholPerKcal;
    const source = calcMethod();
    const servings = source === 'labelServing' ? amount : 1.0;
    const each = (value: number) => editableNumber(value / (servings ?? 1));
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

  /**
   * An edited entry keeps the nutrients beyond the macros its source
   * stated, scaled by how much its energy changed (they scale with the
   * amount).
   */
  const scaledExtra = (value: number | undefined) => {
    if (value === undefined || entry === undefined || totals === undefined) return undefined;
    return entry.kcal <= 0 ? value : (value * totals.kcal) / entry.kcal;
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
      fiberG: scaledExtra(entry?.fiberG),
      sodiumMg: scaledExtra(entry?.sodiumMg),
      alcoholG,
      // The micronutrients scale with the amount, as fiber and sodium do (MM-308).
      micros:
        entry === undefined || totals === undefined
          ? undefined
          : entry.micros.times(entry.kcal <= 0 ? 1 : totals.kcal / entry.kcal),
    });
    await (entry === undefined ? services.food.addFood(saved) : services.food.updateFood(saved));
    onDone();
  };

  const pick = async (food: CatalogFood) => {
    const [alternate, servings] =
      catalog === undefined ? [undefined, []] : await Promise.all([catalog.pairOf(food), catalog.servingsOf(food)]);
    setStep({ at: 'amount', food, servings, alternate });
  };
  const pickCustom = (custom: CustomFood) =>
    setStep({ at: 'amount', food: customCatalogFood(custom), servings: [], custom });
  const choices = () => setStep({ at: 'choices' });

  if (step.at === 'amount') {
    return (
      <FoodAmountStep
        food={step.food}
        alternate={step.alternate}
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
          <Notice text="This entry was logged without an amount. Choose how it was measured to add one." />
        </>
      );
    }
    if (form.source === 'quickAdd') return <p className="app-caption">Enter calories and macros for this food.</p>;
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
              selected={form.source === source}
              onSelect={() => selectMethod(source)}
            />
          ))}
        </div>
        {amountFields()}
        <p className="food-label food-label-spaced">{perServing ? 'Nutrition per serving' : 'Nutrition for this amount'}</p>
        <div className="food-fields">
          <MmTextField label="Protein g" kind="number" dense value={form.protein} onChange={(protein) => set({ protein })} />
          <MmTextField label="Carbs g" kind="number" dense value={form.carbs} onChange={(carbs) => set({ carbs })} />
          <MmTextField label="Fat g" kind="number" dense value={form.fat} onChange={(fat) => set({ fat })} />
        </div>
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
          hint={fromMacros > 0 ? `${whole(fromMacros)} from macros` : undefined}
          helper={
            mismatch
              ? `Macros add up to ${whole(fromMacros)} kcal. Double-check the label.`
              : 'Leave blank to calculate from macros.'
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
      <MmTextField label="Food name" value={form.name} onChange={(name) => set({ name })} />
      {calc === undefined ? typedFields() : calculatedFields(calc)}
      {totals !== undefined && totals.proteinG >= 0 && totals.carbsG >= 0 && totals.fatG >= 0 ? (
        <>
          <p className="food-label food-label-spaced">Macro split</p>
          <MacroSplitChart
            isPreview
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
      {totals !== undefined && (form.basis === 'calculated' || calc !== undefined) ? (
        <p className="app-subhead food-totals" data-testid="logged-totals">
          Logs {whole(totals.kcal)} kcal · {whole(totals.proteinG)} g protein · {whole(totals.carbsG)} g carbs ·{' '}
          {whole(totals.fatG)} g fat
        </p>
      ) : null}
      <div className="app-gap" />
      <MmButton label={isEditing ? 'Save changes' : 'Log it'} expand onPress={valid ? () => void save() : undefined} />
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
        <DayStepper
          label={Fmt.day(day, today)}
          onPrevious={() => setDay(day.addDays(-1))}
          onNext={day.isBefore(today) ? () => setDay(day.addDays(1)) : undefined}
          onLabelPress={undefined}
        />
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
                    subtitle={`Your recent food · ${whole(e.kcal)} kcal`}
                    onPress={() => fill(e)}
                    trailingAction={gradeBeside(e.name)}
                  />
                ))}
              <FoodSearchResults
                query={query}
                onPick={(food) => void pick(food)}
                alsoFound={customFoods.some((food) => matches(food.name)) || recents.some((e) => matches(e.name))}
              />
            </>
          ) : recents.length > 0 ? (
            <>
              <p className="food-label food-label-spaced">Recent foods</p>
              <div className="food-recents">
                {recents.map((e) => (
                  <MmActionChip key={e.id} label={e.name} onPress={() => fill(e)} />
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
