import { useState } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import { NutritionGoals } from '../domain/NutritionGoals';
import { WaterServing } from '../domain/water/WaterServing';
import { WaterUnits } from '../domain/water/WaterUnits';
import { FormatError } from '../lang/FormatError';
import { clockTimeText } from '../format/clockTimeText';
import { waterAmount } from '../format/waterAmount';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { NumberEntry } from '../ui/NumberEntry';
import { useOverlays } from '../ui/useOverlays';
import { logWater } from './logWater';
import './food.css';

/**
 * The water of the day shown (MM-313): the total, and the goal when one is
 * set, in the summary; a glass, a bottle or another amount in one tap; the
 * day's drinks as rows, each removable. Plain water only: drinks logged as
 * food are not counted here.
 */
export function WaterSection({ day }: { day: CalendarDate }) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const setup = useLoaded(state.setup);
  const entries = useLoaded(state.waterForDay(day)) ?? [];
  const goal = (useLoaded(state.nutritionGoals) ?? NutritionGoals.none).waterGoalMl;
  const [other, setOther] = useState(false);
  const units = setup?.unitSystem ?? 'metric';
  const total = entries.reduce((sum, e) => sum + e.ml, 0);
  const add = (ml: number) => logWater(services.water, services.clock, day, ml);

  let summary: string;
  if (entries.length === 0) summary = goal === undefined ? 'None yet' : `None yet · goal ${waterAmount(goal, units)}`;
  else if (goal === undefined) summary = waterAmount(total, units);
  else if (total >= goal) summary = `${waterAmount(total, units)} · Goal reached`;
  else summary = `${waterAmount(total, units)} of ${waterAmount(goal, units)}`;

  return (
    <MmSection icon="water" title="Water" summary={summary}>
      <div className="food-water-actions">
        {WaterServing.values.map((serving) => (
          <MmButton
            key={serving}
            label={WaterServing.label(serving)}
            name={`Add a ${serving} of water`}
            kind="secondary"
            onPress={() => void add(WaterServing.ml(serving, units))}
          />
        ))}
        <MmButton label="Other" name="Add another amount of water" kind="secondary" onPress={() => setOther(!other)} />
      </div>
      {other ? (
        <NumberEntry
          title={`Water, ${units === 'imperial' ? 'fluid ounces' : 'millilitres'}`}
          unit={units === 'imperial' ? 'fl oz' : 'ml'}
          initial={undefined}
          hint={units === 'imperial' ? 'Up to 101 fl oz at a time.' : 'Up to 3,000 ml at a time.'}
          saves="water"
          saveKind="secondary"
          onSave={async (value) => {
            const ml = units === 'imperial' ? WaterUnits.flOzToMl(value) : value;
            if (!(ml > 0 && ml <= WaterUnits.maxEntryMl)) throw new FormatError('Out of range');
            await add(ml);
            setOther(false);
          }}
        />
      ) : null}
      {entries.length === 0 ? null : (
        <MmListGroup>
          {entries.map((entry) => (
            <MmListRow
              key={entry.id}
              leadingIcon="water"
              title={waterAmount(entry.ml, units)}
              subtitle={clockTimeText(entry.at)}
              trailingAction={
                <MmIconButton
                  icon="delete"
                  label={`Remove ${waterAmount(entry.ml, units)} of water`}
                  onPress={() => {
                    void services.water.removeWater(entry.id);
                    overlays.snack(`Removed ${waterAmount(entry.ml, units)} of water`, {
                      label: 'Undo',
                      onAction: () => void services.water.addWater(entry),
                    });
                  }}
                />
              }
            />
          ))}
        </MmListGroup>
      )}
    </MmSection>
  );
}
