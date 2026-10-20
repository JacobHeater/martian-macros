import './ui.css';

/**
 * How to measure the waist, drawn (MM-155): a standing torso, relaxed, with
 * the tape level around it at the navel, snug and not pressing in. Simple
 * strokes in the text colours, the tape the heaviest line, so it reads in
 * every palette and takes no colour of meaning (the panel's PD-6); no
 * bitmap. The words beside it are the full protocol; this is
 * said as a picture, with its one-line alternative, for the first three
 * measurements and from "How to measure" after.
 */
export function WaistProtocolFigure() {
  return (
    <svg
      className="mm-waist-figure"
      viewBox="0 0 96 128"
      role="img"
      aria-label="Drawing: where the tape sits, level around the waist at the navel."
    >
      <g className="mm-waist-figure-body" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {/* Head and neck */}
        <circle cx={48} cy={14} r={9} />
        <path d="M44 23v6M52 23v6" />
        {/* Shoulders, arms hanging loose, and the torso narrowing to the hips */}
        <path d="M22 36q26-10 52 0" />
        <path d="M22 36 16 84M74 36l6 48" />
        <path d="M28 38q-2 24 4 44 4 14 2 40M68 38q2 24-4 44-4 14-2 40" />
        {/* Legs */}
        <path d="M34 122h10M52 122h10" />
      </g>
      {/* The navel, where the tape sits */}
      <circle className="mm-waist-figure-navel" cx={48} cy={74} r={2.6} />
      {/* The tape: level, around the waist, its ends meeting at the front */}
      <g className="mm-waist-figure-tape" fill="none" strokeWidth={4} strokeLinecap="round">
        <path d="M30 74q10 5 15 4.5M66 74q-10 5-15 4.5" />
        <path d="M30 74q18-6 36 0" strokeDasharray="2 3" strokeWidth={1.5} />
      </g>
      <g className="mm-waist-figure-level" strokeWidth={1} strokeDasharray="2 2">
        <path d="M8 74h18M70 74h18" />
      </g>
    </svg>
  );
}
