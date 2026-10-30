import type { UsualFood } from '../domain/food/custom/UsualFood';
import { Fmt } from '../format/Fmt';
import { portionAmount } from '../format/portionAmount';
import { MmButton } from '../ui/MmButton';
import { MmListRow } from '../ui/MmListRow';
import { LibraryRowLines } from './LibraryRowLines';

/**
 * A food the person logs often, from the log (MM-706, by MM-639's rule): as
 * it was last logged, with how often, and "Save as a food" so it becomes
 * theirs to edit.
 */
export function LibraryUsualRow({ usual, onSave }: { usual: UsualFood; onSave: () => void }) {
  const entry = usual.latest;
  const amount = portionAmount(entry);
  const numbers = `${Fmt.kcal(entry.kcal)} · P ${Fmt.whole(entry.proteinG)} · C ${Fmt.whole(entry.carbsG)} · F ${Fmt.whole(entry.fatG)}`;
  return (
    <MmListRow
      title={usual.name}
      detail={<LibraryRowLines lines={[amount === undefined ? numbers : `${amount} · ${numbers}`, `Logged ${usual.times} times in the last 4 weeks`]} />}
      trailingAction={<MmButton label="Save as a food" kind="text" onPress={onSave} />}
    />
  );
}
