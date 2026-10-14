import { MmIcon } from './MmIcon';
import type { MmIconButtonKind } from './MmIconButtonKind';
import type { MmIconName } from './MmIconName';
import './ui.css';

interface MmIconButtonProps {
  icon: MmIconName;
  /** What a person hears; an icon alone says nothing. */
  label: string;
  /** With no action the button is shown as off. */
  onPress: (() => void) | undefined;
  kind?: MmIconButtonKind;
  /** What pressing opens, when it opens something, and whether that is showing. */
  opens?: 'menu' | 'listbox' | 'dialog' | undefined;
  expanded?: boolean | undefined;
}

/** An action shown as an icon, in a 48 by 48 target. The add kind is a plus on a quiet plate. */
export function MmIconButton({ icon, label, onPress, kind = 'standard', opens, expanded }: MmIconButtonProps) {
  return (
    <button
      type="button"
      className={`mm-icon-button mm-icon-button-${kind}`}
      aria-label={label}
      title={label}
      aria-haspopup={opens}
      aria-expanded={expanded}
      disabled={onPress === undefined}
      onClick={onPress}
    >
      {kind === 'add' ? (
        <span className="mm-icon-button-plate">
          <MmIcon name="plus" size={16} />
        </span>
      ) : (
        <MmIcon name={icon} />
      )}
    </button>
  );
}
