import { MmIcon } from './MmIcon';
import type { MmIconName } from './MmIconName';
import './ui.css';

interface StatusRowProps {
  text: string;
  onPress: () => void;
  icon?: MmIconName;
}

/**
 * A one-line state that qualifies the surface above it (calibration, a
 * recent change), with a way into the detail. Replaces a standalone banner.
 */
export function StatusRow({ text, onPress, icon = 'info' }: StatusRowProps) {
  return (
    <button type="button" className="mm-status-row" onClick={onPress}>
      <span className="mm-status-row-icon">
        <MmIcon name={icon} size={20} />
      </span>
      <span className="mm-status-row-text">{text}</span>
      <span className="mm-status-row-chevron">
        <MmIcon name="chevronRight" size={20} />
      </span>
    </button>
  );
}
