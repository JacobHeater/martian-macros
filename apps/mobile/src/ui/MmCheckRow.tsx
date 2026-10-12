import './ui.css';

interface MmCheckRowProps {
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/** A labelled checkbox, for "tick anything that applies" lists. */
export function MmCheckRow({ title, value, onChange }: MmCheckRowProps) {
  return (
    <label className="mm-toggle-row mm-toggle-row-flush mm-check-row">
      <input type="checkbox" className="mm-checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
      <span className="mm-list-row-title">{title}</span>
    </label>
  );
}
