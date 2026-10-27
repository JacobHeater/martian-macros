import type { ReactNode } from 'react';
import type { FoodEntry } from '../domain/FoodEntry';
import { portionAmount } from '../format/portionAmount';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { MmListRow } from '../ui/MmListRow';

interface RecentFoodRowProps {
  entry: FoodEntry;
  onPress: () => void;
  trailingAction?: ReactNode;
  /** Takes focus when it first draws: the first row "More recent foods" added (MM-410's way). */
  autoFocus?: boolean;
  /** What it is, first in its line: "Your recent food" unless found in the whole log, "From your log" (MM-596). */
  lead?: string;
}

/**
 * A recent food as a row, the same in search results and in the list the
 * sheet opens with (MM-439): a long name wraps inside it, and it says the
 * amount it repeats (MM-629).
 */
export function RecentFoodRow({ entry, onPress, trailingAction, autoFocus = false, lead = 'Your recent food' }: RecentFoodRowProps) {
  // The amount it repeats, as its meal's row says it (MM-629); an estimate says so in its own words.
  const amount = portionAmount(entry);
  const said = amount === undefined || entry.portion?.quantity === undefined ? undefined : amount;
  return (
    <MmListRow
      title={entry.name}
      // An estimated meal keeps its mark when it comes back from recents (MM-150).
      subtitle={`${lead} · ${said === undefined ? '' : `${said} · `}${entry.source === 'quickAdd' ? 'estimated · ' : ''}${roundHalfAwayFromZero(entry.kcal) + 0} kcal`}
      onPress={onPress}
      trailingAction={trailingAction}
      autoFocus={autoFocus}
    />
  );
}
