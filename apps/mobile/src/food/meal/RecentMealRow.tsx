import type { ReactNode } from 'react';
import type { LoggedMeal } from '../../domain/food/meal/LoggedMeal';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { MmListRow } from '../../ui/MmListRow';

interface RecentMealRowProps {
  meal: LoggedMeal;
  onPress: () => void;
  trailingAction?: ReactNode;
  autoFocus?: boolean;
}

/**
 * A meal logged recently, among the recent foods (MM-587), as a recent food
 * is a row (MM-439): pressing it logs the same foods again.
 */
export function RecentMealRow({ meal, onPress, trailingAction, autoFocus = false }: RecentMealRowProps) {
  const foods = meal.items.length === 1 ? '1 food' : `${meal.items.length} foods`;
  return (
    <MmListRow
      title={meal.name}
      subtitle={`Your recent meal · ${foods} · ${roundHalfAwayFromZero(meal.kcal) + 0} kcal`}
      onPress={onPress}
      trailingAction={trailingAction}
      autoFocus={autoFocus}
    />
  );
}
