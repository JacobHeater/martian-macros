import { useState } from 'react';
import { atwaterKcal } from '../../domain/atwaterKcal';
import { CustomFood } from '../../domain/food/custom/CustomFood';
import { parseNutritionLabel } from '../../domain/food/label/parseNutritionLabel';
import { normalizeBarcode } from '../../domain/food/normalizeBarcode';
import { NutritionTotals } from '../../domain/food/portion/NutritionTotals';
import { macrosMatchEnergy } from '../../domain/macrosMatchEnergy';
import { parseNumber } from '../../format/parseNumber';
import { quantityText } from '../../format/quantityText';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { useApp } from '../../app/useApp';
import { MmButton } from '../../ui/MmButton';
import { MmTextField } from '../../ui/MmTextField';
import { Notice } from '../../ui/Notice';
import '../food.css';

interface CustomFoodFormProps {
  /** The food being edited, or undefined for a new one. */
  food?: CustomFood | undefined;
  /** A barcode to save the food against, from a scan that found nothing. */
  initialBarcode?: string | undefined;
  /** Called after saving or when the user backs out. */
  onDone: () => void;
}

/** A stored figure as it is put back in its field: to one decimal place, without a trailing zero. */
const oneDecimal = (value: number) => quantityText(roundHalfAwayFromZero(value * 10) / 10);

/**
 * Define a food once: its name, what a serving is and weighs, and its
 * numbers per serving (MM-45). Editing a saved food changes only the food,
 * never entries already logged from it.
 */
export function CustomFoodForm({ food, initialBarcode, onDone }: CustomFoodFormProps) {
  const { services } = useApp();
  const [name, setName] = useState(food?.name ?? '');
  const [serving, setServing] = useState(food?.servingDescription ?? '1 serving');
  const [grams, setGrams] = useState(food?.servingGrams === undefined ? '' : quantityText(food.servingGrams));
  const [kcal, setKcal] = useState(food === undefined ? '' : oneDecimal(food.perServing.kcal));
  const [protein, setProtein] = useState(food === undefined ? '' : oneDecimal(food.perServing.proteinG));
  const [carbs, setCarbs] = useState(food === undefined ? '' : oneDecimal(food.perServing.carbsG));
  const [fat, setFat] = useState(food === undefined ? '' : oneDecimal(food.perServing.fatG));
  const [barcode, setBarcode] = useState(food === undefined ? (initialBarcode ?? '') : (food.barcode ?? ''));
  /** What the last label read said, shown above the numbers. */
  const [labelNote, setLabelNote] = useState<string>();
  const [reading, setReading] = useState(false);

  const readLabel = async () => {
    setReading(true);
    let text: string | undefined;
    try {
      text = await services.labelReader.readLabel();
    } catch {
      setLabelNote('The camera could not be used. You can type the numbers instead.');
    }
    setReading(false);
    if (text === undefined) return;
    const r = parseNutritionLabel(text);
    if (r.isEmpty) {
      setLabelNote(
        'No Nutrition Facts panel was found. Try again with the label flat and well lit, or type the numbers.',
      );
      return;
    }
    if (r.servingText !== undefined) setServing(r.servingText);
    if (r.servingGrams !== undefined) setGrams(quantityText(r.servingGrams));
    if (r.kcal !== undefined) setKcal(quantityText(r.kcal));
    if (r.proteinG !== undefined) setProtein(quantityText(r.proteinG));
    if (r.carbsG !== undefined) setCarbs(quantityText(r.carbsG));
    if (r.fatG !== undefined) setFat(quantityText(r.fatG));
    const missing = [
      ...(r.kcal === undefined ? ['calories'] : []),
      ...(r.proteinG === undefined ? ['protein'] : []),
      ...(r.carbsG === undefined ? ['carbohydrate'] : []),
      ...(r.fatG === undefined ? ['fat'] : []),
      ...(r.servingGrams === undefined ? ['serving weight'] : []),
    ];
    setLabelNote(
      'Read from the label. Check every number against the package' +
        `${missing.length === 0 ? '.' : `, and fill in ${missing.join(', ')}.`}`,
    );
  };

  const p = parseNumber(protein) ?? 0;
  const c = parseNumber(carbs) ?? 0;
  const f = parseNumber(fat) ?? 0;
  const fromMacros = atwaterKcal({ proteinG: p, carbsG: c, fatG: f });
  const typed = parseNumber(kcal);
  const energy = typed ?? (fromMacros > 0 ? fromMacros : undefined);
  const mismatch =
    typed !== undefined && fromMacros !== 0 && !macrosMatchEnergy({ kcal: typed, proteinG: p, carbsG: c, fatG: f });
  const weighed = parseNumber(grams);
  const servingGrams = weighed !== undefined && weighed > 0 ? weighed : undefined;
  /** The barcode as a GTIN-14, undefined when none was typed, and whether what was typed is one. */
  const gtin = barcode.trim() === '' ? undefined : normalizeBarcode(barcode.trim());
  const barcodeOk = barcode.trim() === '' || gtin !== undefined;
  const valid =
    name.trim() !== '' && serving.trim() !== '' && servingGrams !== undefined && energy !== undefined && energy > 0 && barcodeOk;

  const save = async () => {
    if (energy === undefined) return;
    await services.customFoods.saveCustomFood(
      new CustomFood({
        id: food?.id ?? 0,
        name: name.trim(),
        kind: 'food',
        servingDescription: serving.trim(),
        servingGrams,
        perServing: new NutritionTotals({ kcal: energy, proteinG: p, carbsG: c, fatG: f }),
        barcode: gtin,
      }),
    );
    onDone();
  };

  const whole = roundHalfAwayFromZero(fromMacros) + 0;
  return (
    <div className="food-sheet">
      <h2 className="app-headline">{food === undefined ? 'Save your own food' : 'Edit your food'}</h2>
      {food === undefined ? (
        <>
          <MmButton
            label={reading ? 'Reading…' : 'Read the nutrition label'}
            kind="secondary"
            icon="camera"
            expand
            onPress={reading ? undefined : () => void readLabel()}
          />
          {labelNote === undefined ? null : (
            <>
              <div className="app-gap-small" />
              <Notice text={labelNote} />
            </>
          )}
          <div className="app-gap-small" />
        </>
      ) : null}
      <MmTextField label="Name" value={name} onChange={setName} />
      <div className="app-gap-small" />
      <div className="food-fields">
        <div className="food-field-wide">
          <MmTextField label="One serving is" value={serving} onChange={setServing} />
        </div>
        <MmTextField label="Weighs g" kind="number" value={grams} onChange={setGrams} />
      </div>
      <p className="food-label food-label-spaced">Numbers for one serving</p>
      <div className="food-fields">
        <MmTextField label="Protein g" kind="number" dense value={protein} onChange={setProtein} />
        <MmTextField label="Carbs g" kind="number" dense value={carbs} onChange={setCarbs} />
        <MmTextField label="Fat g" kind="number" dense value={fat} onChange={setFat} />
      </div>
      <div className="app-gap-small" />
      <MmTextField
        label="Calories"
        kind="number"
        value={kcal}
        onChange={setKcal}
        hint={fromMacros > 0 ? `${whole} from macros` : undefined}
        helper={
          mismatch ? `Macros add up to ${whole} kcal. Double-check the label.` : 'Leave blank to calculate from macros.'
        }
        helperIsWarning={mismatch}
      />
      <div className="app-gap-small" />
      <MmTextField
        label="Barcode (optional)"
        kind="number"
        value={barcode}
        onChange={setBarcode}
        helper={barcodeOk ? undefined : 'Those digits are not a valid barcode.'}
        helperIsWarning={!barcodeOk}
      />
      <div className="app-gap" />
      <MmButton label="Save food" expand onPress={valid ? () => void save() : undefined} />
      <MmButton label="Cancel" kind="text" onPress={onDone} />
    </div>
  );
}
