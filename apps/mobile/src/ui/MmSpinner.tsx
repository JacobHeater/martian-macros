import './ui.css';

/** A busy indicator; `dense` where it stands in a line of text, beside the words that say what is waited for (MM-673). */
export function MmSpinner({ dense = false }: { dense?: boolean } = {}) {
  return <span className={`mm-spinner${dense ? ' mm-spinner-dense' : ''}`} role="progressbar" aria-label="Loading" />;
}
