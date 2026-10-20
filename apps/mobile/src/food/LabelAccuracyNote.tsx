import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { Loadable } from '../state/Loadable';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';

/**
 * Said once, under the day's figures, until dismissed (MM-123): food
 * cannot be measured to the calorie, so chasing zero is not the point.
 * Nothing until the preference has been read, so it never flashes.
 */
export function LabelAccuracyNote() {
  const { services, state } = useApp();
  const dismissed = useCell(state.labelNoteDismissedOn);
  const today = useCell(state.today);
  if (!dismissed.ready || Loadable.valueOf(dismissed) !== undefined) return null;
  return (
    <div className="app-stack-item">
      <Notice
        text="Food labels and portions are only accurate to within about 10 to 20%. Close counts as exact."
        action={<MmButton label="Got it" kind="text" onPress={() => void services.preferences.saveLabelNoteDismissedOn(today)} />}
      />
    </div>
  );
}
