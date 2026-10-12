import type { MmButtonKind } from './MmButtonKind';
import './ui.css';

interface MmButtonProps {
  label: string;
  kind?: MmButtonKind;
  /** Fills the width it is given. */
  expand?: boolean;
  /** With no action the button is shown as off. */
  onPress?: (() => void) | undefined;
}

/** The one button (MM-104, MM-163). The primary kind is flat, with no glow (MM-181). */
export function MmButton({ label, kind = 'primary', expand = false, onPress }: MmButtonProps) {
  return (
    <button
      type="button"
      className={`mm-button mm-button-${kind}${expand ? ' mm-button-expand' : ''}`}
      disabled={onPress === undefined}
      onClick={onPress}
    >
      {label}
    </button>
  );
}
