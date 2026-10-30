import type { CalendarDate } from '../domain/CalendarDate';
import type { SavedFoodUsage } from '../domain/food/custom/SavedFoodUsage';
import type { Exercise } from '../domain/training/Exercise';
import { equipmentLabel } from '../format/equipmentLabel';
import { lastLoggedText } from '../format/lastLoggedText';
import { muscleGroupLabel } from '../format/muscleGroupLabel';
import { MmListRow } from '../ui/MmListRow';
import { MmMenuButton } from '../ui/MmMenuButton';
import { LibraryRowLines } from './LibraryRowLines';

interface LibraryExerciseRowProps {
  exercise: Exercise;
  /** The workouts it was trained in: how many, and the last (MM-706). */
  usage: SavedFoodUsage | undefined;
  today: CalendarDate;
  autoFocus?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/** An exercise of the person's own in the Library (MM-706, MM-76): as the exercise picker's row says it, and how often it is trained. */
export function LibraryExerciseRow({ exercise, usage, today, autoFocus = false, onEdit, onDelete }: LibraryExerciseRowProps) {
  const muscles = [exercise.primary, ...exercise.secondary].map(muscleGroupLabel).join(', ');
  return (
    <MmListRow
      title={exercise.name}
      detail={<LibraryRowLines lines={[`${equipmentLabel(exercise.equipment)} · ${muscles}`, lastLoggedText(usage, today, { did: 'trained', each: 'workout' })]} />}
      opens
      onPress={onEdit}
      autoFocus={autoFocus}
      trailingAction={
        <MmMenuButton<'edit' | 'delete'>
          icon="more"
          label={`More actions for ${exercise.name}`}
          items={[
            { value: 'edit', label: 'Edit' },
            { value: 'delete', label: 'Delete' },
          ]}
          onSelect={(action) => (action === 'edit' ? onEdit() : onDelete())}
        />
      }
    />
  );
}
