import { useState, useId } from 'react';
import { MacroSplitChart } from '../charts/MacroSplitChart';
import { useNetCarbs } from './useNetCarbs';
import { useInsightPreview } from '../coach/useInsightPreview';
import { gradeOfCatalogFood } from './gradeOfCatalogFood';
import { gradeOfCustomFood } from '../engine/gradeOfCustomFood';
import type { CalendarDate } from '../domain/CalendarDate';
import { CookingFat } from '../domain/food/CookingFat';
import { CookingFatKind } from '../domain/food/CookingFatKind';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import type { CustomFood } from '../domain/food/custom/CustomFood';
import { HandModel } from '../domain/food/hand/HandModel';
import { handUnitsFor } from '../domain/food/hand/handUnitsFor';
import { conversionFor } from '../domain/food/portion/conversionFor';
import { convertedQuantity } from '../domain/food/portion/convertedQuantity';
import { gramsFor } from '../domain/food/portion/gramsFor';
import { NutritionTotals } from '../domain/food/portion/NutritionTotals';
import { parseQuantity } from '../domain/food/portion/parseQuantity';
import { PortionUnit } from '../domain/food/portion/PortionUnit';
import type { ReferenceNutrition } from '../domain/food/portion/ReferenceNutrition';
import { scaleNutrition } from '../domain/food/portion/scaleNutrition';
import { servingVolume } from '../domain/food/portion/servingVolume';
import { FoodEntry } from '../domain/FoodEntry';
import { IntakeDay } from '../domain/IntakeDay';
import type { Meal } from '../domain/Meal';
import type { QuantitySource } from '../domain/QuantitySource';
import type { CatalogFood } from '../foodCatalog/CatalogFood';
import type { CatalogServing } from '../foodCatalog/CatalogServing';
import { cookingFatEntryName } from '../format/cookingFatEntryName';
import { cookingFatKindLabel } from '../format/cookingFatKindLabel';
import { portionUnitChipLabel } from '../format/portionUnitChipLabel';
import { portionUnitOf } from '../format/portionUnitOf';
import { referenceBasisLabel } from '../format/referenceBasisLabel';
import { quantityText } from '../format/quantityText';
import { roundedToZeroNote } from '../format/roundedToZeroNote';
import { servingForm } from '../format/servingForm';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmChoiceChip } from '../ui/MmChoiceChip';
import { MmSegmented } from '../ui/MmSegmented';
import { MmTextField } from '../ui/MmTextField';
import { Notice } from '../ui/Notice';
import type { AmountChoice } from './AmountChoice';
import { FoodGrade } from './FoodGrade';
import { FoodTrustMark } from './FoodTrustMark';
import { eatenAtWhenLogged } from './eatenAtWhenLogged';
import { MealChips } from './MealChips';
import { microsOfPackFood } from './microsOfPackFood';
import { preparationOf } from './preparationOf';
import { TimeEatenRow } from './TimeEatenRow';
import { volumeChoices } from './volumeChoices';
import { weighedConsequence } from './weighedConsequence';
import { weighedStateLabel } from './weighedStateLabel';
import './food.css';

interface FoodAmountStepProps {
  food: CatalogFood;
  servings: readonly CatalogServing[];
  day: CalendarDate;
  meal: Meal;
  onBack: () => void;
  /** Called once the food is logged. */
  onDone: () => void;
  /** Copies a database food into the person's own to correct it ("Fix this food", MM-153); absent for their own foods. */
  onFix?: (() => void) | undefined;
  /** Set when the food is one the user saved: its numbers are per serving. */
  custom?: CustomFood | undefined;
  /**
   * The raw or cooked counterpart of `food`, when the source has both
   * (MM-151): offered as a switch while logging by weight.
   */
  alternate?: CatalogFood | undefined;
  /**
   * Whether to start weighing as `alternate`: the state this food was last
   * logged in, remembered per food (MM-151).
   */
  startOnAlternate?: boolean | undefined;
  /**
   * How many foods the meal's list already holds (MM-631). With any, no
   * meal or time is asked (the list's are used) and "Log it" logs this food
   * with them.
   */
  listed?: number | undefined;
  /** Puts this food, with its fat, in the meal's list instead of logging it (MM-631). */
  onAddToList?: ((entries: readonly FoodEntry[]) => void) | undefined;
  /** Logs this food, with its fat, together with the list's; rejects when nothing could be logged (MM-631). */
  onLogWithList?: ((entries: readonly FoodEntry[]) => Promise<void>) | undefined;
}

const n = (value: number) => `${roundHalfAwayFromZero(value) + 0}`;

const defaultQuantity = (choice: AmountChoice) => (choice.unit === 'gram' ? '100' : choice.unit === 'ounce' ? '4' : '1');

function handMethod(unit: PortionUnit): QuantitySource | undefined {
  if (unit === 'palm' || unit === 'cuppedHand' || unit === 'thumb') return unit;
  return undefined;
}

const choiceLabel = (choice: AmountChoice) => {
  const serving = choice.serving;
  if (serving === undefined) return portionUnitChipLabel(choice.unit);
  // A volume weighed through a serving is of that serving's form: "Tablespoons, chopped" (MM-636).
  if (choice.unit !== 'serving') {
    const form = servingForm(serving.description);
    return form === undefined ? portionUnitChipLabel(choice.unit) : `${portionUnitChipLabel(choice.unit)}, ${form}`;
  }
  return serving.grams > 0 ? `${serving.description} (${n(serving.grams)} g)` : serving.description;
};

/**
 * How much of a database food was eaten (MM-42): the food's own servings or
 * grams, with the macros updating as the amount changes. Logging records
 * how it was measured.
 */
export function FoodAmountStep({
  food: chosen,
  servings,
  day,
  meal: firstMeal,
  onBack,
  onDone,
  custom,
  alternate,
  startOnAlternate = false,
  onFix,
  listed = 0,
  onAddToList,
  onLogWithList,
}: FoodAmountStepProps) {
  const ids = useId();
  const { services, state } = useApp();
  const preview = useInsightPreview();
  const hand = useCell(state.handSize);
  // Simple detail shows calories and protein only (MM-49); what is logged is the whole food.
  const level = useLoaded(state.detailLevel) ?? 'standard';
  const usualFat = useLoaded(state.usualCookingFat) ?? 'oil';

  const [choices] = useState<readonly AmountChoice[]>(() => {
    if (custom === undefined) {
      // The portion the food suits comes first: a palm of chicken, a thumb of butter (MM-46).
      const makeup = new NutritionTotals({ kcal: chosen.kcal, proteinG: chosen.proteinG, carbsG: chosen.carbsG, fatG: chosen.fatG });
      const handUnits: readonly PortionUnit[] = hand === undefined ? [] : handUnitsFor(makeup);
      return [
        ...servings.map((serving) => ({ unit: 'serving' as const, serving })),
        ...(['gram', 'ounce'] as const).map((unit) => ({ unit, serving: undefined })),
        // Volumes, weighed through a serving the source states as one (MM-636).
        ...volumeChoices(servings),
        ...handUnits.map((unit) => ({ unit, serving: undefined })),
      ];
    }
    const grams = custom.servingGrams;
    return [
      { unit: 'serving', serving: { description: custom.servingDescription, grams: grams ?? 0 } },
      ...(grams === undefined ? [] : (['gram', 'ounce'] as const).map((unit) => ({ unit, serving: undefined }))),
    ];
  });

  // Starts on the state (raw, dry or cooked) this food was last logged in (MM-151).
  const remembered = startOnAlternate && alternate !== undefined;
  const byWeight = choices.find((c) => c.unit === 'gram');
  const first = (remembered ? byWeight : undefined) ?? (choices[0] as AmountChoice);

  const [choice, setChoice] = useState<AmountChoice>(first);
  const [useAlternate, setUseAlternate] = useState(remembered);
  const [quantity, setQuantity] = useState(() => defaultQuantity(first));
  /** The amount another unit was converted to, exact, while its figure is untouched, and what it was (MM-628). */
  const [converted, setConverted] = useState<{ readonly shown: string; readonly value: number; readonly from: string }>();
  /** Whether the last unit change had no common measure, so the amount is asked again (MM-628). */
  const [reenter, setReenter] = useState(false);
  /** Whether the amount is the person's, typed or converted from theirs, rather than a unit's usual figure (MM-628). */
  const [entered, setEntered] = useState(false);
  const [meal, setMeal] = useState(firstMeal);
  // Logged for today, it starts at now; for another day, it has no time until one is given (MM-570).
  const [eatenAt, setEatenAt] = useState<number | undefined>(() => eatenAtWhenLogged(day, services.clock));
  const [oil, setOil] = useState<CookingFat>('none');
  /** Whether the last "Log it" failed: said above it, the step kept to try again (MM-624). */
  const [logFailed, setLogFailed] = useState(false);
  /** The fat chosen here, once chosen; until then the person's usual (MM-152). */
  const [fatChosen, setFatChosen] = useState<CookingFatKind | undefined>(undefined);
  const fat = fatChosen ?? usualFat;

  /** The food being logged: the one chosen, or its raw or cooked counterpart. */
  const food = useAlternate && alternate !== undefined ? alternate : chosen;
  /**
   * A generic food that is cooked, or has a cooked form, may have been cooked
   * in fat (MM-152): rice weighed raw is still fried, so the state switch
   * never takes the question away (the panel's UX-1).
   */
  const offersOil = custom === undefined && (chosen.preparation === 'cooked' || alternate?.preparation === 'cooked');

  /**
   * The food's nutrition for 100 g, with a choice's serving details so the
   * entry can say what it was scaled from.
   */
  const referenceFor = (c: AmountChoice): ReferenceNutrition =>
    custom !== undefined
      ? {
          basis: 'perServing',
          nutrition: custom.perServing,
          servingDescription: custom.servingDescription,
          servingGrams: custom.servingGrams,
          servingUnit: 'serving',
        }
      : {
          basis: 'per100g',
          nutrition: new NutritionTotals({ kcal: food.kcal, proteinG: food.proteinG, carbsG: food.carbsG, fatG: food.fatG }),
          servingDescription: c.serving?.description,
          servingGrams: c.serving?.grams,
          // The serving's volume, read from its own words, so a volume can be weighed through it (MM-636).
          servingMilliliters: c.serving === undefined ? undefined : servingVolume(c.serving.description),
          servingUnit: c.serving === undefined ? undefined : 'serving',
          densityGPerMl: food.densityGPerMl,
        };
  const reference = referenceFor(choice);

  // A converted amount is kept exact while its figure is untouched (MM-628).
  const amount = converted !== undefined && quantity === converted.shown ? converted.value : parseQuantity(quantity);
  const totals = amount === undefined ? undefined : scaleNutrition(amount, choice.unit, reference, { hand });
  const grams = amount === undefined ? undefined : gramsFor(amount, choice.unit, reference, { hand });
  const isHand = PortionUnit.isHand(choice.unit);

  /**
   * A label serving from a packaged product is recorded as one; a serving
   * of a generic food is a household measure; a weight is a weighing.
   */
  const method = (): QuantitySource => {
    if (PortionUnit.isWeight(choice.unit)) return 'weighed';
    // A cup or a spoon is a household measure, of a packaged food too (MM-167).
    if (PortionUnit.isVolume(choice.unit)) return 'householdMeasure';
    const byHand = handMethod(choice.unit);
    if (byHand !== undefined) return byHand;
    const packaged = custom !== undefined || food.preparation === 'packaged' || food.source === 'usda_branded' || food.source === 'off';
    return packaged ? 'labelServing' : 'householdMeasure';
  };

  /** A per-100 g nutrient for the grams eaten, or undefined when not known. */
  const extra = (per100g: number | undefined) =>
    per100g === undefined || grams === undefined ? undefined : (per100g * grams) / 100;

  // Carbs net of the fiber and sugar alcohols the food states, for the amount chosen (MM-396).
  const netCarbs = useNetCarbs();
  const netCarbsG = (carbsG: number) => Math.max(0, carbsG - (extra(food.fiberG) ?? 0) - (extra(food.sugarAlcoholsG) ?? 0));

  /** The food as it will be logged, and the fat it was cooked in as its own entry, if any. */
  const toLog = (): FoodEntry[] | undefined => {
    if (totals === undefined) return undefined;
    const logged = new FoodEntry({
      id: 0,
      date: day,
      meal,
      name: food.brand === undefined ? food.name : `${food.name} (${food.brand})`,
      kcal: totals.kcal,
      proteinG: totals.proteinG,
      carbsG: totals.carbsG,
      fatG: totals.fatG,
      source: method(),
      fiberG: extra(food.fiberG),
      sugarAlcoholsG: extra(food.sugarAlcoholsG),
      sodiumMg: extra(food.sodiumMg),
      alcoholG: extra(food.alcoholG),
      micros: grams === undefined ? undefined : microsOfPackFood(food).times(grams / 100),
      portion: {
        method: method(),
        basis: 'calculated',
        quantity: amount,
        unit: choice.unit,
        reference,
        impliedGrams: isHand ? grams : undefined,
        handModelVersion: isHand ? HandModel.version : undefined,
        origin: { packId: food.packId, foodId: food.id, source: food.source, sourceId: food.sourceId },
        preparation: custom === undefined ? preparationOf(food) : undefined,
        conversion: conversionFor(choice.unit, reference, { hand }),
      },
      eatenAt,
    });
    // The fat, as the line above the action says it (`oilTotals` below), its own entry.
    const cookedIn =
      oilTotals === undefined
        ? undefined
        : new FoodEntry({
            id: 0,
            date: day,
            meal,
            name: cookingFatEntryName(fat),
            kcal: oilTotals.kcal,
            proteinG: oilTotals.proteinG,
            carbsG: oilTotals.carbsG,
            fatG: oilTotals.fatG,
            source: 'householdMeasure',
            portion: { method: 'householdMeasure', basis: 'enteredTotals', quantity: 1, unit: CookingFat.unit(oil) },
            // The fat it was cooked in was eaten with it.
            eatenAt,
          });
    return cookedIn === undefined ? [logged] : [logged, cookedIn];
  };

  /** The fat chosen becomes the usual, so it is one tap next time (MM-152); one not remembered costs nothing logged. */
  const rememberFat = async (entries: readonly FoodEntry[]) => {
    if (entries.length > 1 && fat !== usualFat) await services.preferences.saveUsualCookingFat(fat).catch(() => undefined);
  };

  const log = async () => {
    const entries = toLog();
    if (entries === undefined) return;
    // The food and its fat, and the list's foods when there are any (MM-631), are logged together or not at all,
    // and a failure is said, never swallowed (MM-624).
    try {
      if (listed > 0 && onLogWithList !== undefined) await onLogWithList(entries);
      else await services.food.applyFoodChanges({ add: entries });
    } catch {
      setLogFailed(true);
      return;
    }
    await rememberFat(entries);
    if (listed === 0 || onLogWithList === undefined) onDone();
  };

  /** Into the meal's list, to log with the others (MM-631). */
  const addToList = async () => {
    const entries = toLog();
    if (entries === undefined || onAddToList === undefined) return;
    await rememberFat(entries);
    onAddToList(entries);
  };

  /**
   * Another unit: the same portion said in it when the two share an exact
   * measure; otherwise the amount is asked again, never invented (MM-628).
   * With no amount of the person's yet, the unit's usual figure.
   */
  const pick = (next: AmountChoice) => {
    const same =
      amount === undefined
        ? undefined
        : convertedQuantity(amount, { unit: choice.unit, reference }, { unit: next.unit, reference: referenceFor(next) }, { hand });
    setChoice(next);
    // The raw or cooked switch applies to weighing only.
    if (!PortionUnit.isWeight(next.unit)) setUseAlternate(false);
    setReenter(false);
    if (amount === undefined || !entered) {
      setConverted(undefined);
      setQuantity(defaultQuantity(next));
    } else if (same === undefined) {
      setConverted(undefined);
      setQuantity('');
      setReenter(true);
    } else {
      const shown = quantityText(same);
      const was = choice.serving === undefined ? portionUnitOf(choice.unit, amount) : `× ${choice.serving.description}`;
      setConverted({ shown, value: same, from: `${quantityText(amount)} ${was}` });
      setQuantity(shown);
    }
  };

  const note =
    grams === undefined || custom !== undefined ? undefined : roundedToZeroNote(food, { description: 'amount', grams });
  const invalid = quantity.trim() !== '' && amount === undefined;
  const oilTotals = offersOil ? CookingFat.totals(oil, fat) : undefined;
  const showsCarbsAndFat = DetailLevel.showsCarbsAndFat(level);
  /** What the food's source states for its reference amount, and nothing invented (MM-153), in the level's fields (MM-49). */
  const referenceLine =
    `${referenceBasisLabel(reference.basis)}: ${n(reference.nutrition.kcal)} kcal · ${n(reference.nutrition.proteinG)} g protein` +
    (showsCarbsAndFat ? ` · ${n(reference.nutrition.carbsG)} g carbs · ${n(reference.nutrition.fatG)} g fat` : '');
  /** The fat, its own entry, said with the food's totals so the Logs line names everything Log it does (the panel's UX-2). */
  const plusFat =
    oilTotals === undefined
      ? ''
      : ` Plus ${cookingFatEntryName(fat).toLowerCase()} as its own entry: about ${n(oilTotals.kcal)} kcal${showsCarbsAndFat ? ` · ${n(oilTotals.fatG)} g fat` : ''}.`;
  const wholeGrams = grams === undefined ? undefined : quantityText(roundHalfAwayFromZero(grams) + 0);
  let helper: string | undefined;
  if (reenter && quantity.trim() === '') helper = 'Enter how much again in this unit.';
  else if (invalid || amount === undefined) helper = 'An amount above zero is needed.';
  else if (converted !== undefined && quantity === converted.shown) helper = `Same amount as ${converted.from}.`;
  else if (isHand && wholeGrams !== undefined) helper = `About ${wholeGrams} g (estimated)`;
  else if ((choice.unit === 'serving' || PortionUnit.isVolume(choice.unit)) && wholeGrams !== undefined) helper = `${wholeGrams} g`;

  // With the meal's list, the action logs every food of it with this one and its fat, counted as they are (MM-631).
  const inList = listed > 0 && onLogWithList !== undefined;
  const logLabel = inList ? `Log ${listed + (toLog()?.length ?? 1)} foods` : 'Log it';
  const grade = preview.gradeOfFood?.(food.name) ?? (custom === undefined ? gradeOfCatalogFood(food) : gradeOfCustomFood(custom));

  return (
    <div className="food-sheet">
      <h2 className="app-headline">{food.name}</h2>
      {food.brand === undefined ? null : <p className="app-text">{food.brand}</p>}
      <FoodTrustMark food={food} />
      {/* Its grade (MM-370), said in words beside the letter. */}
      <div className="food-amount-grade">
        <FoodGrade grade={grade} subject={food.name} />
        <span className="app-caption">{grade.kind === 'graded' ? 'Grade for the food itself, per calorie' : 'No grade for this food'}</span>
      </div>
      <div className="app-gap" />
      {/* When it was eaten comes first, before what and how much (MM-576). */}
      {/* In a meal's list the list's meal and time are used, set once for every food (MM-631). */}
      {listed > 0 ? null : (
        <>
          <MealChips meal={meal} onChange={setMeal} />
          <TimeEatenRow eatenAt={eatenAt} meal={meal} onChange={setEatenAt} />
          <div className="app-gap" />
        </>
      )}
      <div className="app-row" role="group" aria-label="Amount in">
        {choices.map((c) => (
          <MmChoiceChip key={choiceLabel(c)} label={choiceLabel(c)} selected={c === choice} onSelect={() => pick(c)} />
        ))}
      </div>
      {alternate !== undefined && PortionUnit.isWeight(choice.unit) ? (
        <>
          <p className="food-label food-label-spaced">Weighed as</p>
          <MmSegmented<boolean>
            name="Weighed as"
            segments={[
              { value: false, label: weighedStateLabel(chosen) },
              { value: true, label: weighedStateLabel(alternate) },
            ]}
            selected={useAlternate}
            onChange={(other) => setUseAlternate(other === true)}
          />
          {amount !== undefined && grams !== undefined ? (
            <p className="app-caption">
              {/* Why the switch starts where it does, when that came from memory (MM-151, the panel's UX-6). */}
              {`${weighedConsequence(grams, chosen, alternate)}${remembered && useAlternate ? ` Starts on ${weighedStateLabel(alternate).toLowerCase()}, as last time.` : ''}`}
            </p>
          ) : null}
        </>
      ) : null}
      <div className="app-gap-small" />
      <MmTextField
        label={choice.unit === 'serving' ? 'How many servings' : `Amount (${portionUnitOf(choice.unit, 2)})`}
        kind="quantity"
        value={quantity}
        onChange={(text) => {
          setQuantity(text);
          setEntered(true);
        }}
        helper={helper}
        helperIsWarning={invalid}
      />
      {offersOil ? (
        <>
          {/* Every control that changes what is logged comes before the line that says it (the panel's PD-2). */}
          <p className="food-label food-label-spaced">Cooked with oil?</p>
          <MmSegmented<CookingFat>
            name="Cooked with oil?"
            segments={[
              { value: 'none', label: 'No' },
              { value: 'teaspoon', label: '1 tsp' },
              { value: 'tablespoon', label: '1 tbsp' },
            ]}
            selected={oil}
            onChange={(next) => setOil(next ?? 'none')}
          />
          {oil === 'none' ? null : (
            <>
              {/* Which fat, the usual one first chosen, like the "Amount in" chips above (MM-152). */}
              <p className="food-label food-label-spaced">Which fat</p>
              <div className="app-row" role="group" aria-label="Which fat">
                {CookingFatKind.values.map((kind) => (
                  <MmChoiceChip key={kind} label={cookingFatKindLabel(kind)} selected={kind === fat} onSelect={() => setFatChosen(kind)} />
                ))}
              </div>
            </>
          )}
        </>
      ) : null}
      {/* The numbers the entry rests on, as the source states them (MM-153); the edit sheet shows the same line (MM-221). */}
      <p className="app-caption food-reference-line">{referenceLine}</p>
      {totals === undefined ? (
        <p id={`${ids}-needed`} className="app-caption food-still-needed" data-testid="amount-macros">
          Still needed: an amount above zero.
        </p>
      ) : (
        <p id={`${ids}-logs`} className="app-subhead food-totals" data-testid="amount-macros">
          {`${isHand ? 'Logs an estimate: ' : 'Logs '}${n(totals.kcal)} kcal · ${n(totals.proteinG)} g protein` +
            (showsCarbsAndFat
              ? ` · ${netCarbs ? `${n(netCarbsG(totals.carbsG))} g net carbs (${n(totals.carbsG)} g total)` : `${n(totals.carbsG)} g carbs`} · ` +
                `${n(totals.fatG)} g fat`
              : '') +
            (plusFat === '' ? '' : `.${plusFat}`)}
        </p>
      )}
      {note === undefined ? null : <Notice kind="info" text={note} />}
      {/* The split needs all three macros; at Simple detail it is not drawn (MM-49), as on the hero. It is the food's own: the fat is its own entry (the panel's PD-2). */}
      {totals === undefined || !showsCarbsAndFat ? null : (
        <>
          <p className="food-label food-label-spaced">{isHand ? 'Estimated macro split' : 'Macro split'}</p>
          <MacroSplitChart
            isPreview
            intake={
              new IntakeDay({
                date: day,
                kcal: totals.kcal,
                proteinG: totals.proteinG,
                carbsG: totals.carbsG,
                netCarbsG: netCarbsG(totals.carbsG),
                fatG: totals.fatG,
              })
            }
            netCarbs={netCarbs}
          />
        </>
      )}
      <div className="app-gap" />
      {logFailed ? <Notice icon="warning" text={`The food could not be logged, so nothing was. Press ${logLabel} to try again.`} /> : null}
      <MmButton
        label={logLabel}
        icon={inList ? 'check' : undefined}
        expand
        onPress={totals === undefined ? undefined : () => log()}
        describedBy={totals === undefined ? `${ids}-needed` : `${ids}-logs`}
      />
      {onAddToList === undefined ? null : (
        // One meal of several foods, without logging each (MM-631).
        <MmButton label="Add another food" kind="secondary" icon="plus" expand onPress={totals === undefined ? undefined : () => addToList()} />
      )}
      {onFix === undefined ? null : <MmButton label="Fix this food" kind="text" onPress={onFix} />}
      <MmButton label="Back to search" kind="text" onPress={onBack} />
    </div>
  );
}
