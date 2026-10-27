import { MmIcon } from './MmIcon';
import './ui.css';

interface MmCheckRowProps {
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
  /** Takes focus when it first draws, as `MmListRow`'s does (MM-634). */
  autoFocus?: boolean | undefined;
}

/**
 * A labelled check box, for "tick anything that applies" lists. The box and
 * its check are drawn by the design system (MM-266): the native control
 * underneath is invisible and keeps the keyboard and the screen reader.
 */
export function MmCheckRow({ title, value, onChange, autoFocus = false }: MmCheckRowProps) {
  return (
    <label className="mm-toggle-row mm-toggle-row-flush mm-check-row">
      <span className="mm-check">
        <input
          type="checkbox"
          className="mm-checkbox"
          checked={value}
          autoFocus={autoFocus}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="mm-check-mark" aria-hidden="true">
          <MmIcon name="check" size={16} />
        </span>
      </span>
      <span className="mm-list-row-title">{title}</span>
    </label>
  );
}
