import { MmIcon } from './MmIcon';
import type { MmIconName } from './MmIconName';
import { MmPressable } from './MmPressable';
import './ui.css';

interface MmDrawerRowProps {
  icon: MmIconName;
  label: string;
  /** Whether it is the place the person is at now: marked as the bar marks its current destination. */
  current?: boolean | undefined;
  onPress: () => void;
}

/** A row of the drawer (MM-704): an icon on its plate and a label, pressed as a whole, as the bar's destinations are. */
export function MmDrawerRow({ icon, label, current = false, onPress }: MmDrawerRowProps) {
  return (
    <MmPressable current={current} onPress={() => onPress()}>
      <span className={`mm-drawer-row${current ? ' mm-drawer-row-current' : ''}`}>
        <span className="mm-drawer-indicator">
          <MmIcon name={icon} />
        </span>
        <span className="mm-drawer-label">{label}</span>
      </span>
    </MmPressable>
  );
}
