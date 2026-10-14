import { DetailLevel } from '../domain/food/detail/DetailLevel';
import { NutritionGoals } from '../domain/NutritionGoals';
import { WaterUnits } from '../domain/water/WaterUnits';
import { detailLevelLabel } from '../format/detailLevelLabel';
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

/** Litres to at most two decimals, for the water goal's field. */
const litres = (ml: number) => toStringAsFixed(ml / 1000, 2).replace(/\.?0+$/, '');

const sodiumRange = 'A whole number from 1,500 to 6,000 mg.';

/**
 * The two goals a person may switch on (MM-311, MM-313): a daily sodium
 * limit and a daily water goal. Both start off; switched on, each is
 * suggested and its amount can be typed in the row below. A refusal says
 * the range (the panel's UX-4); a water goal above 4 L, and either goal
 * with kidney disease, carries a plain note (SA-5).
 */
export function NutritionGoalsSection() {
  const { services, state } = useApp();
  const today = useCell(state.today);
  const setup = useLoaded(state.setup);
  const detail = useLoaded(state.detailLevel) ?? 'standard';
  const goals = useLoaded(state.nutritionGoals) ?? NutritionGoals.none;
  const imperial = setup?.unitSystem === 'imperial';
  const kidney = setup?.screening.chronicKidneyDisease ?? false;
  const sodium = goals.sodiumLimitMg;
  const water = goals.waterGoalMl;
  const waterRange = imperial ? 'From 17 to 202 fl oz.' : 'From 0.5 to 6 L.';
  const high = water !== undefined && water > NutritionGoals.highWaterGoalMl;

  // Below Full detail the limit is kept but shown nowhere; say where it shows (the panel's UX-7).
  const where = DetailLevel.showsExtras(detail)
    ? 'Shown in Micros on the Food screen.'
    : `Shown in Micros on the Food screen at Full nutrition detail (yours is ${detailLevelLabel(detail)}).`;

  return (
    <MmSection icon="flag" title="Nutrition goals">
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
            void services.preferences.saveSodiumLimit(on ? NutritionGoals.suggestedSodiumLimitMg : undefined, today)
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
            kidney
              ? 'With kidney disease, a care team may limit how much you drink. Plain water only.'
              : 'Shown with today’s water. Plain water only.'
          }
          value={water !== undefined}
          onChange={(on) =>
            void services.preferences.saveWaterGoal(on ? NutritionGoals.suggestedWaterGoalMl : undefined)
          }
        />
        {water === undefined ? null : (
          <MmListRow
            title="Amount"
            entry={
              <NumberEntry
                title={`Daily water goal, ${imperial ? 'fluid ounces' : 'litres'}`}
                unit={imperial ? 'fl oz' : 'L'}
                initial={imperial ? String(roundHalfAwayFromZero(WaterUnits.mlToFlOz(water))) : litres(water)}
                hint={high ? `More than most people need; spread it through the day. ${waterRange}` : waterRange}
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
      </MmListGroup>
    </MmSection>
  );
}
