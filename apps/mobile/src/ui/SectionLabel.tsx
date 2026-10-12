import './ui.css';

/** A small heading above a field or a group of fields. */
export function SectionLabel({ text }: { text: string }) {
  return <h3 className="mm-section-label">{text}</h3>;
}
