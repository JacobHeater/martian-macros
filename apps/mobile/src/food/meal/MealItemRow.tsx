import type { MealItemDraft } from '../../domain/food/meal/MealItemDraft';
import { mealItemProblems } from '../../domain/food/meal/mealItemProblems';
import { gradeOfMealItem } from '../../engine/gradeOfMealItem';
import { foodEvidenceLine } from '../../format/foodEvidenceLine';
import { Fmt } from '../../format/Fmt';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { MmListRow } from '../../ui/MmListRow';
import { MmMenuButton } from '../../ui/MmMenuButton';
import { FoodGrade } from '../FoodGrade';
import '../food.css';

interface MealItemRowProps {
  item: MealItemDraft;
  onChange: () => void;
  onRemove: () => void;
  /** Takes a logged meal's food out of the meal, to stand as its own food (MM-641); absent before logging. */
  onTakeOut?: (() => void) | undefined;
}

const whole = (value: number | undefined) => (value === undefined ? '?' : String(roundHalfAwayFromZero(value) + 0));

/**
 * One food of a meal (MM-586, MM-587), as a recipe's ingredient is a row
 * (MM-318): its amount, calories and macros, where its numbers came from,
 * and anything wrong with it, said in words under it. Its grade beside it;
 * changing and removing it in its menu.
 */
export function MealItemRow({ item, onChange, onRemove, onTakeOut }: MealItemRowProps) {
  const problems = mealItemProblems(item);
  const grade = gradeOfMealItem(item);
  const amount = item.grams === undefined ? '' : `${whole(item.grams)} g · `;
  return (
    <MmListRow
      title={item.name}
      detail={
        <span className="food-entry-text">
          <span className="food-entry-line">
            {`${amount}${item.kcal === undefined ? '? kcal' : Fmt.kcal(item.kcal)} · P ${whole(item.proteinG)} · C ${whole(item.carbsG)} · F ${whole(item.fatG)}`}
          </span>
          <span className="food-entry-line food-entry-portion">{foodEvidenceLine(item.evidence)}</span>
          {problems.map((problem) => (
            <span key={problem} className="food-entry-line food-item-problem">
              {problem}
            </span>
          ))}
        </span>
      }
      trailing={grade === undefined ? undefined : <FoodGrade grade={grade} subject={item.name} />}
      trailingAction={
        <MmMenuButton<'change' | 'takeOut' | 'remove'>
          icon="more"
          label={`More actions for ${item.name}`}
          items={[
            { value: 'change', label: 'Change' },
            ...(onTakeOut === undefined ? [] : [{ value: 'takeOut' as const, label: 'Take out of the meal' }]),
            { value: 'remove', label: 'Remove' },
          ]}
          onSelect={(action) => (action === 'change' ? onChange() : action === 'takeOut' ? onTakeOut?.() : onRemove())}
        />
      }
    />
  );
}
