import type { CalendarDate } from '../../domain/CalendarDate';
import { DetailLevel } from '../../domain/food/detail/DetailLevel';
import type { FoodGradeValue } from '../../domain/food/grade/FoodGradeValue';
import type { LoggedMeal } from '../../domain/food/meal/LoggedMeal';
import { Fmt } from '../../format/Fmt';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { useApp } from '../../app/useApp';
import { useLoaded } from '../../app/useLoaded';
import { MmIcon } from '../../ui/MmIcon';
import { MmMenuButton } from '../../ui/MmMenuButton';
import type { MmAnchor } from '../../ui/MmAnchor';
import { MmPressable } from '../../ui/MmPressable';
import { MmSwipeToRemove } from '../../ui/MmSwipeToRemove';
import { useOverlays } from '../../ui/useOverlays';
import { FoodGrade } from '../FoodGrade';
import { useNetCarbs } from '../useNetCarbs';
import { removeMeal } from './removeMeal';
import { showViewMealSheet } from './showViewMealSheet';
import '../food.css';

interface LoggedMealRowProps {
  loggedMeal: LoggedMeal;
  day: CalendarDate;
  grade: FoodGradeValue | undefined;
  /** Starts choosing foods to change together, with this meal chosen (MM-634). */
  onSelect?: (() => void) | undefined;
  /** A long press on the row (MM-661): choosing with this meal ticked, given the row's edges (MM-662). */
  onLongPress?: ((anchor: MmAnchor) => void) | undefined;
  /** Takes focus when drawn: choosing has just ended on this meal (MM-634). */
  autoFocus?: boolean | undefined;
}

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/**
 * A meal in its slot, as one row (MM-587): drawn as a food's row is
 * (MM-564), its name over "Meal · N foods" and its macros, its calories on
 * the right, its grade beside it. Pressed, or "View meal" in its menu, it
 * opens to its foods; swiped away or deleted, the whole meal goes, with
 * Undo.
 */
export function LoggedMealRow({ loggedMeal, day, grade, onSelect, onLongPress, autoFocus }: LoggedMealRowProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const level = useLoaded(state.detailLevel) ?? 'standard';
  const netCarbs = useNetCarbs();
  const linesId = `food-meal-${loggedMeal.key}-lines`;
  const foods = loggedMeal.items.length === 1 ? '1 food' : `${loggedMeal.items.length} foods`;
  const macros = DetailLevel.showsCarbsAndFat(level)
    ? `P ${whole(loggedMeal.proteinG)} · C ${whole(netCarbs ? loggedMeal.netCarbsG : loggedMeal.carbsG)} · F ${whole(loggedMeal.fatG)}`
    : `P ${whole(loggedMeal.proteinG)}`;
  const view = () => void showViewMealSheet(overlays, day, loggedMeal.key);
  const remove = () => void removeMeal(services.food, overlays, loggedMeal);
  return (
    <MmSwipeToRemove onRemove={remove}>
      <div className="food-meal-entry">
        <div className="food-entry-open">
          <MmPressable label={`View ${loggedMeal.name}`} describedBy={linesId} onPress={view} autoFocus={autoFocus} onLongPress={onLongPress}>
            <span className="food-entry">
              <span className="food-entry-method" role="img" aria-label="Meal">
                <MmIcon name="food" size={20} />
              </span>
              <span className="food-entry-text" id={linesId}>
                <span className="food-entry-name">{loggedMeal.name}</span>
                <span className="food-entry-line">{`Meal · ${foods} · ${macros}`}</span>
              </span>
              <span className="food-entry-kcal">{Fmt.whole(loggedMeal.kcal)}</span>
            </span>
          </MmPressable>
        </div>
        {grade === undefined ? null : <FoodGrade grade={grade} subject={loggedMeal.name} scope="meal" />}
        <MmMenuButton<'view' | 'select' | 'delete'>
          icon="more"
          label={`More actions for ${loggedMeal.name}`}
          items={[
            { value: 'view', label: 'View meal' },
            ...(onSelect === undefined ? [] : [{ value: 'select' as const, label: 'Select' }]),
            { value: 'delete', label: 'Delete' },
          ]}
          onSelect={(action) => (action === 'view' ? view() : action === 'select' ? onSelect?.() : remove())}
        />
      </div>
    </MmSwipeToRemove>
  );
}
