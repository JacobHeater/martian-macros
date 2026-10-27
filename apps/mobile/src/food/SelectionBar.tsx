import type { FoodEntry } from '../domain/FoodEntry';
import { MmButton } from '../ui/MmButton';
import { MmSection } from '../ui/MmSection';
import { useOverlays } from '../ui/useOverlays';
import type { TogetherAction } from './TogetherAction';

interface SelectionBarProps {
  /** The foods chosen, a meal counting as all its foods. */
  entries: readonly FoodEntry[];
  onAction: (action: TogetherAction) => void | Promise<void>;
  onDone: () => void;
}

const actions: readonly { value: TogetherAction; label: string }[] = [
  { value: 'time', label: 'Change time' },
  { value: 'meal', label: 'Move to another meal' },
  { value: 'day', label: 'Move to another day' },
  { value: 'copy', label: 'Copy to another day' },
  { value: 'delete', label: 'Delete' },
];

/**
 * While foods are being chosen to change together (MM-634): how many are
 * chosen, the one action that asks what to do to them, and Done. A meal's
 * card, as the meals around it are, held at the foot of the list in view
 * while the list scrolls above it.
 */
export function SelectionBar({ entries, onAction, onDone }: SelectionBarProps) {
  const overlays = useOverlays();
  const count = entries.length === 1 ? '1 food' : `${entries.length} foods`;
  const choose = async () => {
    const picked = await overlays.options({ title: `Change ${count}`, options: actions });
    if (picked !== undefined) await onAction(picked.value);
  };
  return (
    <div className="food-selection-bar">
      <MmSection framed icon="check" title={entries.length === 0 ? 'Choose foods to change together' : `${count} chosen`}>
        {/* The count is said as boxes are ticked, not only shown (the UX guard's follow-up, MM-640). */}
        <span className="mm-visually-hidden" role="status">
          {entries.length === 0 ? 'No foods chosen' : `${count} chosen`}
        </span>
        <MmButton label={`Change ${count}`} expand onPress={entries.length === 0 ? undefined : () => choose()} />
        <MmButton label="Done" kind="text" expand onPress={onDone} />
      </MmSection>
    </div>
  );
}
