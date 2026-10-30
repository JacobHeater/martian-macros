import type { CalendarDate } from '../../domain/CalendarDate';
import type { UnitSystem } from '../../domain/UnitSystem';
import { Fmt } from '../../format/Fmt';
import { waterAmount } from '../../format/waterAmount';
import type { DaySide } from './DaySide';

/** A day as it reads inside a sentence: "today", "yesterday", or its date. */
const dayInSentence = (day: CalendarDate, today: CalendarDate) => {
  const said = Fmt.day(day, today);
  return day.epochDay >= today.epochDay - 1 ? said.toLowerCase() : Fmt.longDate(day);
};

/** "3 foods, 16 fl oz of water, a refeed mark and marked complete"; an empty side is "nothing". */
const counted = (side: DaySide, units: UnitSystem): string => {
  const parts = [
    ...(side.foods === 0 ? [] : [side.foods === 1 ? '1 food' : `${side.foods} foods`]),
    ...(side.waterMl === 0 ? [] : [`${waterAmount(side.waterMl, units)} of water`]),
    ...(side.kind === 'none' ? [] : [side.kind === 'refeed' ? 'a refeed mark' : 'a day off mark']),
    ...(side.completeness === 'unmarked' ? [] : [side.completeness === 'complete' ? 'marked complete' : 'marked partial']),
  ];
  if (parts.length === 0) return 'nothing';
  if (parts.length === 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
};

/**
 * What syncing a day from the other phone does, asked before it happens (MM-719): what the other phone's day holds,
 * then what this phone's day holds now, which the day sent replaces, and that Undo puts it back.
 */
export function daySyncWords(day: CalendarDate, arrived: DaySide, here: DaySide, today: CalendarDate, units: UnitSystem): string {
  const when = dayInSentence(day, today);
  const sent = `Your other phone sent its whole day for ${when}: ${counted(arrived, units)}.`;
  const empty = here.foods === 0 && here.waterMl === 0 && here.kind === 'none' && here.completeness === 'unmarked';
  const replaces = empty
    ? `This phone has nothing for ${when} yet, so nothing is replaced.`
    : `This phone’s ${when} holds ${counted(here, units)} now; the day sent replaces that. Undo puts it back.`;
  return `${sent}\n\n${replaces}`;
}
