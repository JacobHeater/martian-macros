import type { BackupContents } from '../domain/backup/BackupContents';
import { Fmt } from '../format/Fmt';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** The records as a list; a zero is left out while anything else is counted. */
const items = (c: BackupContents): string => {
  const parts: string[] = [];
  if (c.weighIns > 0) parts.push(plural(c.weighIns, 'weigh-in', 'weigh-ins'));
  if (c.foodDays > 0) parts.push(`${plural(c.foodDays, 'day', 'days')} of food`);
  if (c.workouts > 0) parts.push(plural(c.workouts, 'workout', 'workouts'));
  if (c.customFoods > 0) parts.push(`${c.customFoods} saved ${c.customFoods === 1 ? 'food' : 'foods'}`);
  return parts.length === 0 ? 'no weigh-ins and no food' : parts.join(', ');
};

/**
 * What a move replaces, said before it happens (MM-698), as the restore says it (MM-63): the loss first, then what
 * arrived with its span of days, then the photos. A move always carries the photos, so the third paragraph always
 * says what becomes of this phone's: replaced by those that came, or removed when none came and this phone has some.
 */
export function moveWords(arrived: BackupContents, here: BackupContents, photosArrived: number, photosHere: boolean): string {
  const replaces =
    here.hasSetup || here.weighIns > 0 || here.foodDays > 0 || here.workouts > 0 || here.customFoods > 0
      ? `Moving replaces everything on this phone: ${items(here)}, your profile and your settings. It cannot be undone.`
      : 'This phone holds nothing yet, so nothing is lost.';
  const span =
    arrived.from === undefined || arrived.to === undefined ? '' : `, ${Fmt.longDate(arrived.from)} to ${Fmt.longDate(arrived.to)}`;
  const holds = `Your other phone sent ${items(arrived)}${span}.`;
  const photos =
    photosArrived > 0
      ? `\n\nIt sent ${plural(photosArrived, 'progress photo', 'progress photos')} too: they replace every progress photo on this phone.`
      : photosHere
        ? '\n\nIt sent no progress photos, so the progress photos on this phone are removed.'
        : '';
  return `${replaces}\n\n${holds}${photos}`;
}
