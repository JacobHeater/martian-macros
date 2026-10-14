import { MmIcon } from './MmIcon';
import './ui.css';

interface MmCheckRowProps {
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/**
 * A labelled check box, for "tick anything that applies" lists. The box and
 * its check are drawn by the design system (MM-266): the native control
 * underneath is invisible and keeps the keyboard and the screen reader.
 */
export function MmCheckRow({ title, value, onChange }: MmCheckRowProps) {
  return (
    <label className="mm-toggle-row mm-toggle-row-flush mm-check-row">
      <span className="mm-check">
        <input type="checkbox" className="mm-checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
        <span className="mm-check-mark" aria-hidden="true">
          <MmIcon name="check" size={16} />
        </span>
      </span>
      <span className="mm-list-row-title">{title}</span>
    </label>
  );
}
