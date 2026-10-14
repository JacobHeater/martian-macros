import { useRef, useState } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import { NutritionGoals } from '../domain/NutritionGoals';
import { WaterServing } from '../domain/water/WaterServing';
import { WaterUnits } from '../domain/water/WaterUnits';
import { FormatError } from '../lang/FormatError';
import { clockTimeText } from '../format/clockTimeText';
import { Fmt } from '../format/Fmt';
import { waterAmount } from '../format/waterAmount';
import { waterServingLabel } from '../format/waterServingLabel';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
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
 * set, in the summary; a glass, a bottle or another amount, each saying its
 * size, in the first row of the group so no control sits bare on the canvas
 * (MM-291); the day's drinks as rows after it, each removable. Every add and
 * removal is said in a snack naming the day, with Undo. Plain water only:
 * drinks logged as food are not counted here.
 */
export function WaterSection({ day }: { day: CalendarDate }) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const setup = useLoaded(state.setup);
  const entries = useLoaded(state.waterForDay(day)) ?? [];
  const goal = (useLoaded(state.nutritionGoals) ?? NutritionGoals.none).waterGoalMl;
  const [other, setOther] = useState(false);
  const otherHolder = useRef<HTMLDivElement>(null);
  /** Water added by taps the list has not caught up with, so a quick second tap says the right total. */
  const pending = useRef({ seen: -1, ml: 0 });
  const units = setup?.unitSystem ?? 'metric';
  const total = entries.reduce((sum, e) => sum + e.ml, 0);
  const named = Fmt.day(day, today);
  const on = named === 'Today' || named === 'Yesterday' ? named.toLowerCase() : `on ${named}`;

  if (pending.current.seen !== total) pending.current = { seen: total, ml: 0 };

  const add = async (ml: number) => {
    pending.current.ml += ml;
    const after = pending.current.seen + pending.current.ml;
    const id = await logWater(services.water, services.clock, day, ml);
    overlays.snack(`Added ${waterAmount(ml, units)}: ${waterAmount(after, units)} ${on}`, {
      label: 'Undo',
      onAction: () => void services.water.removeWater(id),
    });
  };

  let summary: string;
  if (entries.length === 0) summary = goal === undefined ? 'None yet' : `None yet · goal ${waterAmount(goal, units)}`;
  else if (goal === undefined) summary = waterAmount(total, units);
  else if (total >= goal) summary = `${waterAmount(total, units)} · Goal reached`;
  else summary = `${waterAmount(total, units)} of ${waterAmount(goal, units)}`;

  return (
    <MmSection icon="water" title="Water" summary={summary}>
      <MmListGroup>
        <MmListRow
          title="Add water"
          entry={
            <>
              <div className="food-water-actions">
                {WaterServing.values.map((serving) => (
                  <MmButton
                    key={serving}
                    label={waterServingLabel(serving, units)}
                    name={`${waterServingLabel(serving, units)} of water`}
                    kind="secondary"
                    onPress={() => void add(WaterServing.ml(serving, units))}
                  />
                ))}
              </div>
              <div className="food-water-other" ref={otherHolder}>
                <MmButton
                  label="Other amount"
                  name="Other amount of water"
                  kind="text"
                  icon={other ? 'chevronDown' : 'plus'}
                  expanded={other}
                  onPress={() => setOther(!other)}
                />
              </div>
              {other ? (
                <NumberEntry
                  title={`Water, ${units === 'imperial' ? 'fluid ounces' : 'millilitres'}`}
                  unit={units === 'imperial' ? 'fl oz' : 'ml'}
                  initial={undefined}
                  hint={units === 'imperial' ? 'Up to 101 fl oz at a time.' : 'Up to 3,000 ml at a time.'}
                  refusal="That is more than one drink can be."
                  saves="water"
                  saveKind="secondary"
                  onSave={async (value) => {
                    const ml = units === 'imperial' ? WaterUnits.flOzToMl(value) : value;
                    if (!(ml > 0 && ml <= WaterUnits.maxEntryMl)) throw new FormatError('Out of range');
                    await add(ml);
                    setOther(false);
                    // The field is gone; focus goes back to the button that opened it (the panel's UX-2).
                    requestAnimationFrame(() =>
                      otherHolder.current?.querySelector<HTMLButtonElement>('button')?.focus(),
                    );
                  }}
                />
              ) : null}
            </>
          }
        />
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
                  overlays.snack(`Removed ${waterAmount(entry.ml, units)} of water ${on}`, {
                    label: 'Undo',
                    onAction: () => void services.water.addWater(entry),
                  });
                }}
              />
            }
          />
        ))}
      </MmListGroup>
    </MmSection>
  );
}
