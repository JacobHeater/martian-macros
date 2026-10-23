import { useEffect, useState } from 'react';
import './ui.css';

/** How long the alien is gone after a tap (MM-577). */
const awayMs = 5000;

/**
 * The ground a Martian page ends on (MM-558): a faint violet ridge with a
 * little green alien peeking over its tallest peak. Tap the alien and a UFO
 * takes it up and off the page; five seconds later it is back (MM-577).
 * Decoration: drawn only in Martian and never spoken.
 */
export function MartianRidge() {
  const [away, setAway] = useState(false);
  useEffect(() => {
    if (!away) return undefined;
    const timer = setTimeout(() => setAway(false), awayMs);
    return () => clearTimeout(timer);
  }, [away]);
  return (
    <div className="mm-ridge" aria-hidden="true" data-away={away}>
      <span className="mm-ridge-pit">
        <span className="mm-ridge-alien" onClick={() => setAway(true)} />
      </span>
      <span className="mm-ridge-ufo" />
    </div>
  );
}
