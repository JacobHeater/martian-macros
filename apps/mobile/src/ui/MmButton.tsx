import { MmIcon } from './MmIcon';
import type { MmIconName } from './MmIconName';
import type { MmButtonKind } from './MmButtonKind';
import './ui.css';

interface MmButtonProps {
  label: string;
  kind?: MmButtonKind;
  icon?: MmIconName | undefined;
  /** Fills the width it is given. */
  expand?: boolean;
  /** With no action the button is shown as off. */
  onPress?: (() => void) | undefined;
}

/**
 * The app's button. Every button in the app is this component, so two
 * screens cannot differ in size, shape or press behavior. The primary kind
 * is flat, with no glow (MM-181).
 */
export function MmButton({ label, kind = 'primary', icon, expand = false, onPress }: MmButtonProps) {
  return (
    <button
      type="button"
      className={`mm-button mm-button-${kind}${expand ? ' mm-button-expand' : ''}`}
      disabled={onPress === undefined}
      onClick={onPress}
    >
      {icon === undefined ? null : <MmIcon name={icon} size={20} />}
      {label}
    </button>
  );
}
