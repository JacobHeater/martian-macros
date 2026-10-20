import { MmIcon } from './MmIcon';
import type { MmIconName } from './MmIconName';
import type { MmButtonKind } from './MmButtonKind';
import './ui.css';

interface MmButtonProps {
  label: string;
  /**
   * What the button is heard as when its label alone is not enough to tell
   * it from another ("Save waist" for "Save", MM-301). It starts with the
   * label, so a spoken command naming what is seen still finds it.
   */
  name?: string | undefined;
  kind?: MmButtonKind;
  icon?: MmIconName | undefined;
  /** Fills the width it is given. */
  expand?: boolean;
  /** With no action the button is shown as off. */
  onPress?: (() => void) | undefined;
  /** The id of text that describes the action: what it will record, or what keeps it off (MM-218, MM-220). */
  describedBy?: string | undefined;
  /** For a button that shows or hides something below it: whether that is showing. */
  expanded?: boolean | undefined;
}

/**
 * The app's button. Every button in the app is this component, so two
 * screens cannot differ in size, shape or press behavior. The primary kind
 * is flat, with no glow (MM-181).
 */
export function MmButton({ label, name, kind = 'primary', icon, expand = false, onPress, expanded, describedBy }: MmButtonProps) {
  return (
    <button
      type="button"
      className={`mm-button mm-button-${kind}${expand ? ' mm-button-expand' : ''}`}
      aria-label={name}
      aria-expanded={expanded}
      aria-describedby={describedBy}
      disabled={onPress === undefined}
      onClick={onPress}
    >
      {icon === undefined ? null : <MmIcon name={icon} size={20} />}
      {label}
    </button>
  );
}
