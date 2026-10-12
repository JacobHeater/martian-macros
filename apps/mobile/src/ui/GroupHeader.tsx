import './ui.css';

/** The heading of a group of rows in a list (settings). */
export function GroupHeader({ text }: { text: string }) {
  return <h2 className="mm-group-header">{text}</h2>;
}
