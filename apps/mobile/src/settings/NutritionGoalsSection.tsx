import { useState } from 'react';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import { NutritionGoals } from '../domain/NutritionGoals';
import { WaterUnits } from '../domain/water/WaterUnits';
import { detailLevelLabel } from '../format/detailLevelLabel';
import { waterAmount } from '../format/waterAmount';
import { FormatError } from '../lang/FormatError';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { NumberEntry } from '../ui/NumberEntry';
import { useSettingsSection } from './useSettingsSection';
import { useOverlays } from '../ui/useOverlays';

/** Litres to at most two decimals, for the water goal's field. */
const litres = (ml: number) => toStringAsFixed(ml / 1000, 2).replace(/\.?0+$/, '');

const sodiumRange = 'A whole number from 1,500 to 6,000 mg.';

/**
 * The two goals (MM-311, MM-313): a daily sodium limit, off until switched
 * on, and a daily water goal, on unless switched off, suggested for the
 * person (MM-358) until they type their own, and withheld where a care team
 * sets what they drink (MM-359). A refusal says the range (the panel's
 * UX-4); a water goal above 4 L, and the sodium limit with kidney disease,
 * carries a plain note (SA-5).
 */
export function NutritionGoalsSection() {
  // Folds in place, closed until opened (MM-398).
  const fold = useSettingsSection('nutritionGoals');
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const setup = useLoaded(state.setup);
  const detail = useLoaded(state.detailLevel) ?? 'standard';
  const goals = useLoaded(state.nutritionGoals) ?? NutritionGoals.none;
  const imperial = setup?.unitSystem === 'imperial';
  const kidney = setup?.screening.chronicKidneyDisease ?? false;
  const sodium = goals.sodiumLimitMg;
  // The goal in force: the person's own, or the one suggested for them (MM-358).
  const water = useCell(state.waterGoal);
  const [setting, setSetting] = useState(false);
  const screening = setup?.screening;
  // Where a care team sets what is drunk, nothing is suggested (MM-358, MM-359).
  let careTeam: string | undefined;
  if (screening?.chronicKidneyDisease) careTeam = 'With kidney disease, your care team sets your fluids.';
  else if (screening?.bariatricSurgery) careTeam = 'After bariatric surgery, your care team sets your fluids.';
  else if (screening?.fluidLimitedByClinician) careTeam = 'Your clinician limits your fluids.';
  const who = screening?.chronicKidneyDisease === true || screening?.bariatricSurgery === true ? 'care team' : 'clinician';
  // On unless switched off; where nothing is suggested, only once an amount is set.
  const waterOn = !goals.waterGoalOff && (careTeam === undefined || goals.waterGoalMl !== undefined || setting);
  // Read with the field, not beside it (the panel's UX-2); a limit is never asked for as a goal to fill (SA S-1).
  // No line narrates the field: an amount the person typed needs no note (MM-401).
  let amountNote: string | undefined;
  if (careTeam !== undefined) {
    amountNote = `Only if your ${who} gave you an amount of water to drink. This counts plain water only, not other drinks or food.`;
  } else if (water?.suggested === true) amountNote = 'Suggested from your protein target and training.';
  const amountField = `Daily water goal, ${imperial ? 'fluid ounces' : 'litres'}`;
  const waterRange = imperial ? '17 to 202 fl oz.' : '0.5 to 6 L.';
  // With an eating-disorder history the note comes sooner, at the cap of a suggestion (the panel's safety S-4).
  const highAt = screening?.eatingDisorderHistory === true ? NutritionGoals.highWaterGoalEatingDisorderMl : NutritionGoals.highWaterGoalMl;
  const high = water !== undefined && water.ml > highAt;

  /** A switch whose save fails says so and stays as it was, never springing back in silence (MM-325). */
  const switched = (goal: string, save: Promise<void>) =>
    void save.catch(() => overlays.snack(`The ${goal} could not be saved. Nothing was changed.`));

  // Below Full detail the limit is kept but shown nowhere; say where it shows (the panel's UX-7).
  const where = DetailLevel.showsExtras(detail)
    ? 'Shown in Micros on the Food screen.'
    : `Shown in Micros on the Food screen at Full nutrition detail (yours is ${detailLevelLabel(detail)}).`;

  return (
    <MmSection icon="flag" title="Nutrition goals" {...fold}>
      <MmListGroup>
        <MmSwitchRow
          leadingIcon="tune"
          title="Daily sodium limit"
          subtitle={
            kidney
              ? `With kidney disease, a care team usually sets this limit. ${where}`
              : `2,300 mg is the US guideline for adults. ${where}`
          }
          value={sodium !== undefined}
          onChange={(on) =>
            switched(
              'sodium limit',
              services.preferences.saveSodiumLimit(on ? NutritionGoals.suggestedSodiumLimitMg : undefined, today),
            )
          }
        />
        {sodium === undefined ? null : (
          <MmListRow
            title="Amount"
            entry={
              <NumberEntry
                title="Daily sodium limit, milligrams"
                unit="mg"
                initial={String(sodium)}
                hint={sodiumRange}
                refusal="That limit is out of range."
                saves="sodium limit"
                saveKind="secondary"
                onSave={async (mg) => {
                  if (!NutritionGoals.sodiumLimitAllowed(mg)) throw new FormatError('Out of range');
                  await services.preferences.saveSodiumLimit(mg, today);
                }}
              />
            }
          />
        )}
        <MmSwitchRow
          leadingIcon="water"
          title="Daily water goal"
          subtitle={
            careTeam === undefined
              ? 'Plain water only. Drink to thirst, spread through the day; more in heat.'
              : `${careTeam}${waterOn ? ' Type an amount below only if they gave you one.' : ''}`
          }
          value={waterOn}
          onChange={(on) => {
            setSetting(on);
            switched('water goal', services.preferences.saveWaterGoalOff(!on));
          }}
        />
        {!waterOn || (water === undefined && !setting) ? null : (
          <MmListRow
            title="Amount"
            entry={
              <NumberEntry
                // A new suggestion, or a return to it, starts the field again.
                key={`${water?.ml ?? 'none'}-${String(water?.suggested)}`}
                title={amountField}
                unit={imperial ? 'fl oz' : 'L'}
                initial={water === undefined ? undefined : imperial ? String(roundHalfAwayFromZero(WaterUnits.mlToFlOz(water.ml))) : litres(water.ml)}
                hint={[amountNote, high ? 'More than most people need; spread it through the day.' : undefined, waterRange]
                  .filter((part) => part !== undefined)
                  .join(' ')}
                refusal="That goal is out of range."
                saves="water goal"
                saveKind="secondary"
                onSave={async (value) => {
                  const ml = imperial ? WaterUnits.flOzToMl(value) : value * 1000;
                  if (!NutritionGoals.waterGoalAllowed(ml)) throw new FormatError('Out of range');
                  await services.preferences.saveWaterGoal(ml);
                }}
              />
            }
          />
        )}
        {/* Their own amount set, the way back to the one suggested for them (MM-358). */}
        {!waterOn || goals.waterGoalMl === undefined || water?.suggestedMl === undefined ? null : (
          <MmListRow
            leadingIcon="history"
            title="Use the suggested amount"
            subtitle={`Back to ${waterAmount(water.suggestedMl, imperial ? 'imperial' : 'metric')}, from your protein target and training.`}
            onPress={() => {
              // The row goes once pressed: focus moves to the field, now holding the suggestion (the panel's UX-3).
              const back = services.preferences.saveWaterGoal(undefined).then(() => {
                requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`input[aria-label="${amountField}"]`)?.focus());
              });
              switched('water goal', back);
            }}
          />
        )}
      </MmListGroup>
    </MmSection>
  );
}
