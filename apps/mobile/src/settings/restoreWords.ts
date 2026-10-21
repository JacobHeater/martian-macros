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
 * What a restore replaces, said before it happens (MM-63): the loss first,
 * then what the backup holds with its span of days, as two paragraphs so
 * the loss is found at a glance (the panel's F7, PD-8). A backup that
 * carries progress photos says, in a third, that they replace this phone's
 * (MM-157); one without says nothing of them, since it leaves them be.
 */
export function restoreWords(backup: BackupContents, here: BackupContents, madeOn: string, withPhotos = false): string {
  const replaces =
    here.hasSetup || here.weighIns > 0 || here.foodDays > 0
      ? `Restoring replaces everything on this phone: ${items(here)}, your profile and your settings. It cannot be undone.`
      : 'This phone holds nothing yet, so nothing is lost.';
  const span =
    backup.from === undefined || backup.to === undefined ? '' : `, ${Fmt.longDate(backup.from)} to ${Fmt.longDate(backup.to)}`;
  const holds = `The backup, made on ${madeOn}, holds ${items(backup)}${span}.`;
  const photos = withPhotos ? '\n\nIt holds progress photos too: they replace every progress photo on this phone.' : '';
  return `${replaces}\n\n${holds}${photos}`;
}
