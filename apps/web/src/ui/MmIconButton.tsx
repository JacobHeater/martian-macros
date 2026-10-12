import { MmIcon } from './MmIcon';
import type { MmIconName } from './MmIconName';
import './ui.css';

interface MmIconButtonProps {
  icon: MmIconName;
  /** What a person hears; an icon alone says nothing. */
  label: string;
  onPress: () => void;
}

/** An action shown as an icon, in a 48 by 48 target. */
export function MmIconButton({ icon, label, onPress }: MmIconButtonProps) {
  return (
    <button type="button" className="mm-icon-button" aria-label={label} title={label} onClick={onPress}>
      <MmIcon name={icon} />
    </button>
  );
}
