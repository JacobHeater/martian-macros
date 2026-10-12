import { MmIcon } from './MmIcon';
import type { MmIconName } from './MmIconName';
import './ui.css';

interface MmFabProps {
  label: string;
  icon: MmIconName;
  onPress: () => void;
}

/**
 * The screen's primary action, floating above the content. The only Ember
 * fill on a screen.
 */
export function MmFab({ label, icon, onPress }: MmFabProps) {
  return (
    <button type="button" className="mm-fab" onClick={onPress}>
      <MmIcon name={icon} />
      {label}
    </button>
  );
}
