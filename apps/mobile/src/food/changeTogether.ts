import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import { Meal } from '../domain/Meal';
import { mealUsualMinute } from '../domain/mealUsualMinute';
import type { FoodEntryBatchWriter } from '../domain/repositories/FoodEntryBatchWriter';
import { Fmt } from '../format/Fmt';
import { mealLabel } from '../format/mealLabel';
import { minuteOfDayText } from '../format/minuteOfDayText';
import type { Overlays } from '../ui/Overlays';
import { entriesCopiedTo } from './entriesCopiedTo';
import type { TogetherAction } from './TogetherAction';

/**
 * Asks what `action` needs and does it to every one of `entries` at once,
 * in one step (MM-625), with Undo (MM-630, MM-633, MM-634, MM-714): one time eaten,
 * another meal or day, copies at another meal or on another day, a copy to the other phone (MM-715,
 * through `toPhone`, which carries no Undo here: the other phone asks), or removal. Only the field
 * chosen changes; amounts, numbers and where they came from never do. A
 * food moved to another day keeps its time eaten (the owner, 2026-10-26).
 * `subject` names them in what is said: "dinner" with "all 3 foods", or
 * "2 foods". Resolves once done, refused or said to have failed.
 */
export async function changeTogether(
  writer: FoodEntryBatchWriter,
  overlays: Overlays,
  {
    action,
    entries,
    subject,
    count,
    slot,
    day,
    today,
    toPhone,
  }: {
    action: TogetherAction;
    entries: readonly FoodEntry[];
    subject: string;
    /** Said after a time is set, for a meal: "all 3 foods". */
    count?: string | undefined;
    /** The one meal they are all in, when they are. */
    slot?: Meal | undefined;
    day: CalendarDate;
    today: CalendarDate;
    /** Sends `entries` to the person's other phone (MM-715); without it, that action does nothing. */
    toPhone?: ((entries: readonly FoodEntry[]) => Promise<void>) | undefined;
  },
): Promise<void> {
  const Subject = subject.charAt(0).toUpperCase() + subject.slice(1);
  const dayInSentence = (to: CalendarDate) => {
    const said = Fmt.day(to, today);
    return to.epochDay >= today.epochDay - 1 ? said.toLowerCase() : said;
  };
  const changeAll = async (change: (entry: FoodEntry) => FoodEntry, said: string) => {
    try {
      await writer.applyFoodChanges({ update: entries.map(change) });
    } catch {
      overlays.snack(`${Subject} could not be changed, so nothing was.`);
      return;
    }
    overlays.snack(said, { label: 'Undo', onAction: () => void writer.applyFoodChanges({ update: entries }) });
  };

  /** Fresh copies on the day picked, at their own meals (MM-633); none when the asking is dismissed. */
  const copiesOnAnotherDay = async () => {
    const picked = await overlays.date({ helpText: `Copy ${subject} to`, initial: today, first: today.addDays(-365), last: today, today });
    return picked === undefined ? undefined : { entries: entriesCopiedTo(picked, entries), where: dayInSentence(picked) };
  };
  /** Fresh copies at the meal picked, on this day (MM-714); the one meal they are all in is not offered. */
  const copiesAtAnotherMeal = async () => {
    const picked = await overlays.options({
      title: `Copy ${subject} to`,
      options: Meal.values.filter((m) => m !== slot).map((m) => ({ value: m, label: mealLabel(m) })),
    });
    return picked === undefined ? undefined : { entries: entriesCopiedTo(day, entries, { meal: picked.value }), where: picked.label.toLowerCase() };
  };

  if (action === 'phone') {
    await toPhone?.(entries);
    return;
  }
  if (action === 'time') {
    const times = new Set(entries.map((entry) => entry.eatenAt));
    const usual = mealUsualMinute(slot ?? entries[0]?.meal ?? 'snack');
    const picked = await overlays.timeOfDay({
      // One time among them opens the clock on it; mixed or none, on the meal's usual time (MM-570).
      initialMinuteOfDay: times.size === 1 ? (entries[0]?.eatenAt ?? usual) : usual,
      helpText: times.size > 1 ? `Time eaten for ${subject} (now mixed)` : `Time eaten for ${subject}`,
      everyMinute: true,
    });
    if (picked === undefined) return;
    const said = `${Subject} at ${minuteOfDayText(picked)}${count === undefined ? '' : `, ${count}`}`;
    await changeAll((entry) => entry.copyWith({ eatenAt: picked }), said);
  } else if (action === 'meal') {
    const picked = await overlays.options({
      title: `Move ${subject} to`,
      options: Meal.values.filter((m) => m !== slot).map((m) => ({ value: m, label: mealLabel(m) })),
    });
    if (picked === undefined) return;
    await changeAll((entry) => entry.copyWith({ meal: picked.value }), `Moved ${subject} to ${picked.label.toLowerCase()}`);
  } else if (action === 'day') {
    const picked = await overlays.date({ helpText: `Move ${subject} to`, initial: day, first: day.addDays(-365), last: today, today });
    if (picked === undefined || picked.epochDay === day.epochDay) return;
    await changeAll((entry) => entry.copyWith({ date: picked }), `Moved ${subject} to ${dayInSentence(picked)}`);
  } else if (action === 'copy' || action === 'copyMeal') {
    const copies = action === 'copy' ? await copiesOnAnotherDay() : await copiesAtAnotherMeal();
    if (copies === undefined) return;
    try {
      const ids = await writer.applyFoodChanges({ add: copies.entries });
      overlays.snack(`Copied ${subject} to ${copies.where}`, {
        label: 'Undo',
        onAction: () => void writer.applyFoodChanges({ delete: ids }),
      });
    } catch {
      overlays.snack(`${Subject} could not be copied, so nothing was.`);
    }
  } else {
    try {
      await writer.applyFoodChanges({ delete: entries.map((entry) => entry.id) });
    } catch {
      overlays.snack(`${Subject} could not be removed, so nothing was.`);
      return;
    }
    // Put back as they were, meals as the same meals (MM-587).
    overlays.snack(`Removed ${subject}`, { label: 'Undo', onAction: () => void writer.applyFoodChanges({ add: entries }) });
  }
}
