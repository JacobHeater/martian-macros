import { MacroKind } from './MacroKind';
import './ui.css';

interface MacroFigureProps {
  macro: MacroKind;
  /** The amount, already formatted ("177 g"). */
  value: string;
}

/**
 * A macro's name and amount, with a short bar in the macro's color above
 * it. The name is always shown, so color is never the only cue.
 */
export function MacroFigure({ macro, value }: MacroFigureProps) {
  return (
    <div className="mm-macro-figure">
      <span className={`mm-macro-rule mm-macro-${macro}`} aria-hidden="true" />
      <span className="mm-metric-label">{MacroKind.label(macro)}</span>
      <span className="mm-macro-figure-value">{value}</span>
    </div>
  );
}
