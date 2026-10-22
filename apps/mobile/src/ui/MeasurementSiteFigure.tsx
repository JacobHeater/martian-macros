import type { MeasurementSite } from '../domain/measurements/MeasurementSite';
import './ui.css';

/** Where the tape sits for each site on the figure, and its one-line alternative. */
const tapes: Readonly<Record<MeasurementSite, { path: string; label: string }>> = {
  waist: { path: 'M30 74q18 6 36 0', label: 'level around the waist at the navel' },
  neck: { path: 'M43 27q5 3 10 0', label: 'around the neck, just below the Adam’s apple' },
  chest: { path: 'M27 48q21 6 42 0', label: 'level around the chest, across the nipples' },
  hips: { path: 'M31 94q17 6 34 0', label: 'level around the hips, at the widest point of the buttocks' },
  upperArm: { path: 'M15 58q5 3 10 0', label: 'around the upper arm, midway between shoulder and elbow' },
  thigh: { path: 'M31 104q8 4 16 0', label: 'around the thigh, midway between hip crease and knee' },
  calf: { path: 'M33 116q6 3 12 0', label: 'around the widest part of the calf' },
};

/**
 * How to measure a site, drawn (MM-156), in the waist figure's language
 * (MM-155): the same standing figure in the text colours, and the tape, the
 * heaviest line, where it sits for `site`. No bitmap, no colour of meaning.
 */
export function MeasurementSiteFigure({ site }: { site: MeasurementSite }) {
  const tape = tapes[site];
  return (
    <svg className="mm-waist-figure" viewBox="0 0 96 128" role="img" aria-label={`Drawing: where the tape sits, ${tape.label}.`}>
      <g className="mm-waist-figure-body" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={48} cy={14} r={9} />
        <path d="M44 23v6M52 23v6" />
        <path d="M22 36q26-10 52 0" />
        <path d="M22 36 16 84M74 36l6 48" />
        <path d="M28 38q-2 24 4 44 4 14 2 40M68 38q2 24-4 44-4 14-2 40" />
        <path d="M34 122h10M52 122h10" />
      </g>
      <g className="mm-waist-figure-tape" fill="none" strokeWidth={4} strokeLinecap="round">
        <path d={tape.path} />
      </g>
    </svg>
  );
}
