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
import { conversionFor } from '../domain/food/portion/conversionFor';
import { gramsFor } from '../domain/food/portion/gramsFor';
import { NutritionTotals } from '../domain/food/portion/NutritionTotals';
import { parseQuantity } from '../domain/food/portion/parseQuantity';
import { PortionUnit } from '../domain/food/portion/PortionUnit';
import type { ReferenceNutrition } from '../domain/food/portion/ReferenceNutrition';
import { scaleNutrition } from '../domain/food/portion/scaleNutrition';
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
import { quantityText } from '../format/quantityText';
import { roundedToZeroNote } from '../format/roundedToZeroNote';
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
import { MealChips } from './MealChips';
import { microsOfPackFood } from './microsOfPackFood';
import { preparationOf } from './preparationOf';
import './food.css';

interface FoodAmountStepProps {
  food: CatalogFood;
  servings: readonly CatalogServing[];
  day: CalendarDate;
  meal: Meal;
  onBack: () => void;
  /** Called once the food is logged. */
  onDone: () => void;
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
}

const n = (value: number) => `${roundHalfAwayFromZero(value) + 0}`;

const defaultQuantity = (choice: AmountChoice) => (choice.unit === 'gram' ? '100' : choice.unit === 'ounce' ? '4' : '1');

function handMethod(unit: PortionUnit): QuantitySource | undefined {
  if (unit === 'palm' || unit === 'cuppedHand' || unit === 'thumb') return unit;
  return undefined;
}

/** What the food is when it is weighed: cooked, dry or raw. */
function stateLabel(food: CatalogFood): string {
  if (food.preparation === 'cooked') return 'Cooked';
  if (food.preparation === 'raw') return food.name.toLowerCase().includes(', dry') ? 'Dry' : 'Raw';
  return 'As listed';
}

const choiceLabel = (choice: AmountChoice) => {
  const serving = choice.serving;
  if (serving === undefined) return portionUnitChipLabel(choice.unit);
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
      const handUnits: readonly PortionUnit[] = hand === undefined ? [] : ['palm', 'cuppedHand', 'thumb'];
      return [
        ...servings.map((serving) => ({ unit: 'serving' as const, serving })),
        ...(['gram', 'ounce', ...handUnits] as const).map((unit) => ({ unit, serving: undefined })),
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
  const [meal, setMeal] = useState(firstMeal);
  const [oil, setOil] = useState<CookingFat>('none');
  /** The fat chosen here, once chosen; until then the person's usual (MM-152). */
  const [fatChosen, setFatChosen] = useState<CookingFatKind | undefined>(undefined);
  const fat = fatChosen ?? usualFat;

  /** The food being logged: the one chosen, or its raw or cooked counterpart. */
  const food = useAlternate && alternate !== undefined ? alternate : chosen;
  /** A cooked generic food may have been cooked in oil (MM-152). */
  const offersOil = custom === undefined && food.preparation === 'cooked';

  /**
   * The food's nutrition for 100 g, with the chosen serving's details so
   * the entry can say what it was scaled from.
   */
  const reference: ReferenceNutrition =
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
          servingDescription: choice.serving?.description,
          servingGrams: choice.serving?.grams,
          servingUnit: choice.serving === undefined ? undefined : 'serving',
          densityGPerMl: food.densityGPerMl,
        };

  const amount = parseQuantity(quantity);
  const totals = amount === undefined ? undefined : scaleNutrition(amount, choice.unit, reference, { hand });
  const grams = amount === undefined ? undefined : gramsFor(amount, choice.unit, reference, { hand });
  const isHand = PortionUnit.isHand(choice.unit);

  /**
   * A label serving from a packaged product is recorded as one; a serving
   * of a generic food is a household measure; a weight is a weighing.
   */
  const method = (): QuantitySource => {
    if (PortionUnit.isWeight(choice.unit)) return 'weighed';
    const byHand = handMethod(choice.unit);
    if (byHand !== undefined) return byHand;
    const packaged = custom !== undefined || food.source === 'usda_branded' || food.source === 'off';
    return packaged ? 'labelServing' : 'householdMeasure';
  };

  /** A per-100 g nutrient for the grams eaten, or undefined when not known. */
  const extra = (per100g: number | undefined) =>
    per100g === undefined || grams === undefined ? undefined : (per100g * grams) / 100;

  // Carbs net of the fiber and sugar alcohols the food states, for the amount chosen (MM-396).
  const netCarbs = useNetCarbs();
  const netCarbsG = (carbsG: number) => Math.max(0, carbsG - (extra(food.fiberG) ?? 0) - (extra(food.sugarAlcoholsG) ?? 0));

  const log = async () => {
    if (totals === undefined) return;
    await services.food.addFood(
      new FoodEntry({
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
      }),
    );
    const oilTotals = CookingFat.totals(oil, fat);
    if (oilTotals !== undefined && offersOil) {
      // The fat chosen becomes the usual, so it is one tap next time (MM-152).
      if (fat !== usualFat) await services.preferences.saveUsualCookingFat(fat);
      await services.food.addFood(
        new FoodEntry({
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
        }),
      );
    }
    onDone();
  };

  const pick = (next: AmountChoice) => {
    setChoice(next);
    // The raw or cooked switch applies to weighing only.
    if (!PortionUnit.isWeight(next.unit)) setUseAlternate(false);
    setQuantity(defaultQuantity(next));
  };

  /** The size of the difference, which is the education (MM-151). */
  const consequence = (weighed: number, other: CatalogFood) => {
    const line = (f: CatalogFood) =>
      `${n(weighed)} g ${stateLabel(f).toLowerCase()} is about ${n((f.kcal * weighed) / 100)} kcal`;
    return `${line(chosen)}. ${line(other)}.`;
  };

  const note =
    grams === undefined || custom !== undefined ? undefined : roundedToZeroNote(food, { description: 'amount', grams });
  const invalid = quantity.trim() !== '' && amount === undefined;
  const oilTotals = offersOil ? CookingFat.totals(oil, fat) : undefined;
  const showsCarbsAndFat = DetailLevel.showsCarbsAndFat(level);
  /** What the food's source states for its reference amount, and nothing invented (MM-153). */
  const referenceLine =
    `${reference.basis === 'perServing' ? 'Per serving' : reference.basis === 'per100g' ? 'Per 100 g' : 'Per 100 mL'}: ` +
    `${n(reference.nutrition.kcal)} kcal · ${n(reference.nutrition.proteinG)} g protein · ` +
    `${n(reference.nutrition.carbsG)} g carbs · ${n(reference.nutrition.fatG)} g fat`;
  const wholeGrams = grams === undefined ? undefined : quantityText(roundHalfAwayFromZero(grams) + 0);
  let helper: string | undefined;
  if (invalid || amount === undefined) helper = 'An amount above zero is needed.';
  else if (isHand && wholeGrams !== undefined) helper = `About ${wholeGrams} g (estimated)`;
  else if (choice.unit === 'serving' && wholeGrams !== undefined) helper = `${wholeGrams} g`;

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
              { value: false, label: stateLabel(chosen) },
              { value: true, label: stateLabel(alternate) },
            ]}
            selected={useAlternate}
            onChange={(other) => setUseAlternate(other === true)}
          />
          {amount !== undefined && grams !== undefined ? (
            <p className="app-caption">{consequence(grams, alternate)}</p>
          ) : null}
        </>
      ) : null}
      <div className="app-gap-small" />
      <MmTextField
        label={choice.unit === 'serving' ? 'How many servings' : `Amount (${portionUnitOf(choice.unit, 2)})`}
        kind="quantity"
        value={quantity}
        onChange={setQuantity}
        helper={helper}
        helperIsWarning={invalid}
      />
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
              : '')}
        </p>
      )}
      {note === undefined ? null : <Notice kind="info" text={note} />}
      {offersOil ? (
        <>
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
              <div className="app-row food-chips" role="group" aria-label="Which fat">
                {CookingFatKind.values.map((kind) => (
                  <MmChoiceChip key={kind} label={cookingFatKindLabel(kind)} selected={kind === fat} onSelect={() => setFatChosen(kind)} />
                ))}
              </div>
              {oilTotals === undefined ? null : (
                <p className="app-caption food-reference-line">
                  {`Adds ${cookingFatEntryName(fat).toLowerCase()} as its own entry: about ${n(oilTotals.kcal)} kcal · ${n(oilTotals.fatG)} g fat`}
                </p>
              )}
            </>
          )}
        </>
      ) : null}
      {/* The split needs all three macros; at Simple detail it is not drawn (MM-49), as on the hero. */}
      {totals === undefined || !showsCarbsAndFat ? null : (
        <>
          <p className="food-label food-label-spaced">{isHand ? 'Estimated macro split' : 'Macro split'}</p>
          <MacroSplitChart
            isPreview
            intake={
              new IntakeDay({
                date: day,
                kcal: totals.kcal + (oilTotals?.kcal ?? 0),
                proteinG: totals.proteinG + (oilTotals?.proteinG ?? 0),
                carbsG: totals.carbsG + (oilTotals?.carbsG ?? 0),
                netCarbsG: netCarbsG(totals.carbsG) + (oilTotals?.carbsG ?? 0),
                fatG: totals.fatG + (oilTotals?.fatG ?? 0),
              })
            }
            netCarbs={netCarbs}
          />
        </>
      )}
      <div className="app-gap" />
      <MealChips meal={meal} onChange={setMeal} />
      <div className="app-gap" />
      <MmButton label="Log it" expand onPress={totals === undefined ? undefined : () => void log()} describedBy={totals === undefined ? `${ids}-needed` : `${ids}-logs`} />
      <MmButton label="Back to search" kind="text" onPress={onBack} />
    </div>
  );
}
