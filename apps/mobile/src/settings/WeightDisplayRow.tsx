import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { weightDisplayLabel } from '../format/weightDisplayLabel';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListRow } from '../ui/MmListRow';
import { useWeightDisplaySheet } from './useWeightDisplaySheet';

/**
 * The weight display in Appearance (MM-118), laid out as Units beside it
 * (rule 9): the display in force, and the button that opens the choice.
 */
export function WeightDisplayRow() {
  const { state } = useApp();
  const display = useCell(state.weightDisplay);
  const open = useWeightDisplaySheet();
  return (
    <MmListRow
      leadingIcon="scale"
      title="Weight display"
      subtitle={weightDisplayLabel(display)}
      trailingAction={<MmIconButton icon="edit" label="Change weight display" onPress={() => void open()} />}
    />
  );
}
