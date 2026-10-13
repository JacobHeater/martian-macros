import type { ReactNode } from 'react';
import './ui.css';

interface MmPressableProps {
  /** What pressing does, said aloud when the content does not say it. */
  label?: string | undefined;
  /** For content that opens and closes something: whether it is open, and the id of what it controls. */
  expanded?: boolean | undefined;
  controls?: string | undefined;
  onPress: () => void;
  children: ReactNode;
}

/**
 * Content that can be pressed as a whole: a hero that opens the day, an
 * entry that opens its editor, a heading that folds its list. It draws
 * nothing of its own, so the content keeps its look, and it is the one way
 * a screen makes a region pressable without a raw button (MM-246).
 */
export function MmPressable({ label, expanded, controls, onPress, children }: MmPressableProps) {
  return (
    <button
      type="button"
      className="mm-pressable"
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onPress}
    >
      {children}
    </button>
  );
}
