import type { CustomFood } from '../../domain/food/custom/CustomFood';
import { customFoodOfDraft } from '../../domain/food/custom/customFoodOfDraft';
import type { FoodDraft } from '../../domain/food/custom/FoodDraft';
import { foodDraftProblems } from '../../domain/food/custom/foodDraftProblems';
import { FoodGroup } from '../../domain/food/FoodGroup';
import { gradeOfCustomFood } from '../../engine/gradeOfCustomFood';
import { foodEvidenceLine } from '../../format/foodEvidenceLine';
import { foodGroupLabel } from '../../format/foodGroupLabel';
import { Fmt } from '../../format/Fmt';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { MmCheckRow } from '../../ui/MmCheckRow';
import { MmChoiceChip } from '../../ui/MmChoiceChip';
import { MmListRow } from '../../ui/MmListRow';
import { MmMenuButton } from '../../ui/MmMenuButton';
import { FoodGrade } from '../FoodGrade';
import '../food.css';

interface FoodDraftRowProps {
  food: FoodDraft;
  /** The saved food of the same name, when there is one (MM-708): the row offers to update it or keep both. */
  existing: CustomFood | undefined;
  onChange: (food: FoodDraft) => void;
  onEdit: () => void;
  onRemove: () => void;
}

const whole = (value: number) => String(roundHalfAwayFromZero(value) + 0);

/**
 * One food of an assistant's answer (MM-708), as a meal's food is a row
 * (MM-586): its brand, group and serving, the serving's calories and
 * macros, where its numbers came from, and anything wrong with it, said
 * in words under it. Its grade beside it; changing and removing it in its
 * menu. A food of a name already saved asks whether to update that food
 * or keep both; and each row is ticked to be saved, or not.
 */
export function FoodDraftRow({ food, existing, onChange, onEdit, onRemove }: FoodDraftRowProps) {
  const problems = foodDraftProblems(food);
  const made = problems.length === 0 ? customFoodOfDraft(food) : undefined;
  const grade = made === undefined ? undefined : gradeOfCustomFood(made);
  const group = FoodGroup.fromName(food.group);
  const serving = food.servingDescription === undefined ? 'no serving' : `${food.servingDescription}${food.servingGrams === undefined ? '' : ` (${whole(food.servingGrams)} g)`}`;
  const what = [food.brand, group === undefined ? undefined : foodGroupLabel(group), serving].filter((part) => part !== undefined).join(' · ');
  const numbers =
    made === undefined
      ? undefined
      : `${Fmt.kcal(made.perServing.kcal)} · P ${whole(made.perServing.proteinG)} · C ${whole(made.perServing.carbsG)} · F ${whole(made.perServing.fatG)}`;
  return (
    <>
      <MmListRow
        title={food.name}
        detail={
          <span className="food-entry-text">
            <span className="food-entry-line">{what}</span>
            {numbers === undefined ? null : <span className="food-entry-line">{numbers}</span>}
            <span className="food-entry-line food-entry-portion">{foodEvidenceLine(food.evidence)}</span>
            {food.ingredients.length === 0 ? null : (
              <span className="food-entry-line food-entry-portion">{`Made of ${food.ingredients.map((line) => line.name).join(', ')}`}</span>
            )}
            {problems.map((problem) => (
              <span key={problem} className="food-entry-line food-item-problem">
                {problem}
              </span>
            ))}
          </span>
        }
        trailing={grade === undefined ? undefined : <FoodGrade grade={grade} subject={food.name} />}
        trailingAction={
          <MmMenuButton<'change' | 'remove'>
            icon="more"
            label={`More actions for ${food.name}`}
            items={[
              { value: 'change', label: 'Change' },
              { value: 'remove', label: 'Remove' },
            ]}
            onSelect={(action) => (action === 'change' ? onEdit() : onRemove())}
          />
        }
      />
      {existing === undefined ? null : (
        <>
          <p className="food-label">{`You have ${existing.name} already`}</p>
          <div className="app-row food-chips" role="group" aria-label={`You have ${existing.name} already`}>
            <MmChoiceChip label="Update it" selected={food.replaces === existing.id} onSelect={() => onChange({ ...food, replaces: existing.id })} />
            <MmChoiceChip label="Keep both" selected={food.replaces === undefined} onSelect={() => onChange({ ...food, replaces: undefined })} />
          </div>
        </>
      )}
      <MmCheckRow title={`Save ${food.name}`} value={food.keep} onChange={(keep) => onChange({ ...food, keep })} />
    </>
  );
}
