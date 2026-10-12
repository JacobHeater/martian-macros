import { clamp } from '../lang/clamp';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { MacroKind } from './MacroKind';
import { MmProgressBar } from './MmProgressBar';
import './ui.css';

interface MacroBarProps {
  macro: MacroKind;
  grams: number;
  /** Absent before targets exist; the bar is then empty. */
  target?: number | undefined;
  minimum?: number | undefined;
  emphasized?: boolean;
}

/**
 * One macro's progress: its name, grams against the target, and a bar in
 * the macro's color. The label is always shown, so color is never the only
 * cue. An emphasized macro (protein) gets a thicker bar and a stronger
 * value.
 */
export function MacroBar({ macro, grams, target, minimum, emphasized = false }: MacroBarProps) {
  const whole = (value: number) => roundHalfAwayFromZero(value) + 0;
  const value = target === undefined || target <= 0 ? 0 : clamp(grams / target, 0, 1);
  let figures: string;
  if (target === undefined) figures = `${whole(grams)} g`;
  else if (minimum !== undefined) figures = `${whole(grams)} g · min ${whole(minimum)} · target ${whole(target)}`;
  else figures = `${whole(grams)} / ${whole(target)} g`;
  let markers: readonly number[] = [];
  if (minimum !== undefined && target !== undefined && target > 0) {
    markers = minimum === target ? [1] : [clamp(minimum / target, 0, 1), 1];
  }
  return (
    <div className="mm-macro-bar">
      <div className="mm-macro-bar-head">
        <span className="mm-macro-bar-name">{MacroKind.label(macro)}</span>
        <span className={`mm-macro-bar-figures${emphasized ? ' mm-macro-bar-emphasized' : ''}`}>{figures}</span>
      </div>
      <MmProgressBar value={value} markers={markers} color={`var(--${macro})`} height={emphasized ? 8 : 6} />
    </div>
  );
}
