import { NutritionGoals } from '../domain/NutritionGoals';
import { WaterUnits } from '../domain/water/WaterUnits';
import { FormatError } from '../lang/FormatError';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { NumberEntry } from '../ui/NumberEntry';

/** Litres to at most two decimals, for the water goal's field. */
const litres = (ml: number) => toStringAsFixed(ml / 1000, 2).replace(/\.?0+$/, '');

/**
 * The two goals a person may switch on (MM-311, MM-313): a daily sodium
 * limit and a daily water goal. Both start off; switched on, each is
 * suggested and its amount can be typed in the row below.
 */
export function NutritionGoalsSection() {
  const { services, state } = useApp();
  const setup = useLoaded(state.setup);
  const goals = useLoaded(state.nutritionGoals) ?? NutritionGoals.none;
  const imperial = setup?.unitSystem === 'imperial';
  const kidney = setup?.screening.chronicKidneyDisease ?? false;
  const sodium = goals.sodiumLimitMg;
  const water = goals.waterGoalMl;

  return (
    <MmSection icon="flag" title="Nutrition goals">
      <MmListGroup>
        <MmSwitchRow
          leadingIcon="tune"
          title="Daily sodium limit"
          subtitle={
            kidney
              ? 'With kidney disease, a care team usually sets this limit.'
              : 'Shown with the micronutrients at Full detail. 2,300 mg is the usual adult limit.'
          }
          value={sodium !== undefined}
          onChange={(on) => void services.preferences.saveSodiumLimit(on ? NutritionGoals.suggestedSodiumLimitMg : undefined)}
        />
        {sodium === undefined ? null : (
          <MmListRow
            title="Sodium limit"
            entry={
              <NumberEntry
                title="Daily sodium limit, milligrams"
                unit="mg"
                initial={String(sodium)}
                hint="A whole number from 500 to 6,000 mg."
                saves="sodium limit"
                saveKind="secondary"
                onSave={async (mg) => {
                  if (!NutritionGoals.sodiumLimitAllowed(mg)) throw new FormatError('Out of range');
                  await services.preferences.saveSodiumLimit(mg);
                }}
              />
            }
          />
        )}
        <MmSwitchRow
          leadingIcon="water"
          title="Daily water goal"
          subtitle="Shown with today’s water. Plain water only."
          value={water !== undefined}
          onChange={(on) => void services.preferences.saveWaterGoal(on ? NutritionGoals.suggestedWaterGoalMl : undefined)}
        />
        {water === undefined ? null : (
          <MmListRow
            title="Water goal"
            entry={
              <NumberEntry
                title={`Daily water goal, ${imperial ? 'fluid ounces' : 'litres'}`}
                unit={imperial ? 'fl oz' : 'L'}
                initial={imperial ? String(roundHalfAwayFromZero(WaterUnits.mlToFlOz(water))) : litres(water)}
                hint={imperial ? 'From 17 to 202 fl oz.' : 'From 0.5 to 6 L.'}
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
      </MmListGroup>
    </MmSection>
  );
}
