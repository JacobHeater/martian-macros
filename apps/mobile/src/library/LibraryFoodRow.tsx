import type { CalendarDate } from '../domain/CalendarDate';
import type { CustomFood } from '../domain/food/custom/CustomFood';
import type { SavedFoodUsage } from '../domain/food/custom/SavedFoodUsage';
import { gradeOfCustomFood } from '../engine/gradeOfCustomFood';
import { Fmt } from '../format/Fmt';
import { lastLoggedText } from '../format/lastLoggedText';
import { quantityText } from '../format/quantityText';
import { SavedFoodTrustMark } from '../food/custom/SavedFoodTrustMark';
import { FoodGrade } from '../food/FoodGrade';
import { MmListRow } from '../ui/MmListRow';
import { MmMenuButton } from '../ui/MmMenuButton';
import { LibraryRowLines } from './LibraryRowLines';

interface LibraryFoodRowProps {
  food: CustomFood;
  usage: SavedFoodUsage | undefined;
  today: CalendarDate;
  /** Takes focus when it first draws: the food just saved (MM-706). */
  autoFocus?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * A saved food or recipe in the Library (MM-706): its name; what one serving
 * is, its calories and macros as a logged food's row says them (MM-564);
 * how often it is logged; where its numbers came from (MM-710); its grade
 * when its numbers allow one (MM-382).
 * Pressed, it opens to be changed; its menu edits or deletes it, as the
 * Saved step's did (MM-635).
 */
export function LibraryFoodRow({ food, usage, today, autoFocus = false, onEdit, onDelete }: LibraryFoodRowProps) {
  const serving =
    food.kind === 'recipe'
      ? `${food.servingDescription} · Makes ${quantityText(food.servings ?? 1)} servings`
      : `${food.servingDescription}${food.servingGrams === undefined ? '' : ` (${quantityText(food.servingGrams)} g)`}`;
  const numbers = `${Fmt.kcal(food.perServing.kcal)} · P ${Fmt.whole(food.perServing.proteinG)} · C ${Fmt.whole(food.perServing.carbsG)} · F ${Fmt.whole(food.perServing.fatG)}`;
  const grade = gradeOfCustomFood(food);
  return (
    <MmListRow
      title={food.name}
      detail={
        <>
          <LibraryRowLines lines={[`${serving} · ${numbers}`, lastLoggedText(usage, today)]} />
          <SavedFoodTrustMark food={food} />
        </>
      }
      opens
      onPress={onEdit}
      autoFocus={autoFocus}
      trailingAction={
        <>
          {grade.kind === 'graded' ? <FoodGrade grade={grade} subject={food.name} /> : null}
          <MmMenuButton<'edit' | 'delete'>
            icon="more"
            label={`More actions for ${food.name}`}
            items={[
              { value: 'edit', label: 'Edit' },
              { value: 'delete', label: 'Delete' },
            ]}
            onSelect={(action) => (action === 'edit' ? onEdit() : onDelete())}
          />
        </>
      }
    />
  );
}
