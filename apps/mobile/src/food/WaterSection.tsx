import { type ReactNode, useRef } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import { WaterEntry } from '../domain/water/WaterEntry';
import { waterGlasses } from '../domain/water/waterGlasses';
import { Fmt } from '../format/Fmt';
import { glassesLabel } from '../format/glassesLabel';
import { waterAmount } from '../format/waterAmount';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmIcon } from '../ui/MmIcon';
import { MmIconButton } from '../ui/MmIconButton';
import { MmMenuButton } from '../ui/MmMenuButton';
import { MmPressable } from '../ui/MmPressable';
import { MmProgressBar } from '../ui/MmProgressBar';
import { MmSection } from '../ui/MmSection';
import { MmSwipeToRemove } from '../ui/MmSwipeToRemove';
import { useOverlays } from '../ui/useOverlays';
import { logWater } from './logWater';
import { showAddWaterSheet } from './showAddWaterSheet';
import { waterEntryWhen } from './waterEntryWhen';
import { WaterEntryTile } from './WaterEntryTile';
import './food.css';

/**
 * The water of the day shown, as a section like the meals (MM-318, rule 9
 * of the screen direction): its icon, its total in the summary, a "+" in
 * the header that opens the Add water sheet as a meal's opens Add food, and
 * the day's drinks as rows that open "Edit water" as a food opens "Edit
 * food", and swipe away or delete from "More actions", each with Undo. Plain water only: drinks logged as food are not counted.
 * With a goal, the water pours into a bar across the section, folded or
 * not, the summary says it in glasses, and the goal reached carries a
 * meal's quiet check mark (MM-326).
 */
export function WaterSection({ day }: { day: CalendarDate }) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const setup = useLoaded(state.setup);
  const loaded = useLoaded(state.waterForDay(day));
  const entries = loaded ?? [];
  // The goal in force: the person's own, or the one suggested for them (MM-358).
  const goal = useCell(state.waterGoal)?.ml;
  const units = setup?.unitSystem ?? 'metric';
  const total = entries.reduce((sum, e) => sum + e.ml, 0);
  const named = Fmt.day(day, today);
  const on = named === 'Today' || named === 'Yesterday' ? named.toLowerCase() : `on ${named}`;
  /** Water added by adds the list has not caught up with, so a quick second add says the right total. */
  const pending = useRef({ seen: -1, ml: 0 });
  if (pending.current.seen !== total) pending.current = { seen: total, ml: 0 };

  const add = async () => {
    const ml = await showAddWaterSheet(overlays, units, named);
    if (ml === undefined) return;
    pending.current.ml += ml;
    const after = pending.current.seen + pending.current.ml;
    const id = await logWater(services.water, services.clock, day, ml);
    overlays.snack(`Added ${waterAmount(ml, units)}: ${waterAmount(after, units)} ${on}`, {
      label: 'Undo',
      onAction: () => void services.water.removeWater(id),
    });
  };

  /** Changes a drink's amount; its day and time are kept (the panel's PD-1). */
  const edit = async (entry: WaterEntry) => {
    const ml = await showAddWaterSheet(overlays, units, named, entry.ml);
    if (ml === undefined) return;
    await services.water.updateWater(new WaterEntry({ id: entry.id, date: entry.date, ml, at: entry.at }));
    overlays.snack(`Changed to ${waterAmount(ml, units)}`, {
      label: 'Undo',
      onAction: () => void services.water.updateWater(entry),
    });
  };

  /** Told apart when amounts repeat, by when each was had (the panel's UX-2). */
  const which = (entry: WaterEntry) => {
    const when = waterEntryWhen(entry);
    return `${waterAmount(entry.ml, units)} of water${when === 'Added later' ? ', added later' : ` at ${when}`}`;
  };

  const remove = (entry: WaterEntry) => {
    void services.water.removeWater(entry.id);
    overlays.snack(`Removed ${waterAmount(entry.ml, units)} of water ${on}`, {
      label: 'Undo',
      onAction: () => void services.water.addWater(entry),
    });
  };

  // The goal's glasses are said in the summary, above the bar that draws the water (the panel's PD-2).
  const glasses = goal === undefined ? undefined : waterGlasses(total, goal, units);
  let summary: ReactNode;
  if (goal === undefined || glasses === undefined) summary = entries.length === 0 ? undefined : waterAmount(total, units);
  else if (entries.length === 0) summary = `Goal ${waterAmount(goal, units)} · ${glasses.of} glasses`;
  else if (total >= goal)
    summary = (
      <span className="food-meal-total">
        {`${waterAmount(total, units)} · Goal reached`}
        <span className="food-meal-marker" aria-hidden="true">
          <MmIcon name="checkCircle" size={16} />
        </span>
      </span>
    );
  else summary = `${waterAmount(total, units)} of ${waterAmount(goal, units)} · ${glassesLabel(glasses.drunk, glasses.of)}`;

  return (
    <MmSection
      icon="water"
      title="Water"
      summary={summary}
      meter={
        goal === undefined ? undefined : (
          // The bar belongs to its day: a new day's is drawn anew once its drinks are in (MM-328).
          <MmProgressBar key={loaded === undefined ? 'loading' : day.toString()} kind="water" value={loaded === undefined ? 0 : total / goal} />
        )
      }
      collapsible
      maintainState
      trailing={<MmIconButton icon="plus" kind="add" label="Add water" onPress={() => void add()} />}
    >
      {entries.map((entry) => (
        <MmSwipeToRemove key={entry.id} onRemove={() => remove(entry)}>
          <div className="food-meal-entry">
            <div className="food-entry-open">
              <MmPressable label={`Edit ${which(entry)}`} onPress={() => void edit(entry)}>
                <WaterEntryTile entry={entry} units={units} />
              </MmPressable>
            </div>
            <MmMenuButton<string>
              icon="more"
              label={`More actions for ${which(entry)}`}
              items={[{ value: 'delete', label: 'Delete' }]}
              onSelect={(action) => {
                if (action === 'delete') remove(entry);
              }}
            />
          </div>
        </MmSwipeToRemove>
      ))}
    </MmSection>
  );
}
