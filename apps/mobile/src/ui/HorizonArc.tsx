import { useId } from 'react';
import { clamp } from '../lang/clamp';
import './ui.css';

const width = 320;
const stroke = 8;
const dotRadius = 6;
const inset = dotRadius + 2;
const height = width * 0.18 + inset * 2;

interface HorizonArcProps {
  /** Eaten over target; past 1 the dot hollows. */
  progress: number;
  /** What the arc says, for a screen reader; without one the arc is decoration and not spoken (MM-389). */
  label?: string | undefined;
  /** The zone that counts as on target, as shares of the whole arc (MM-123); drawn as a wider, quiet band under the track. */
  band?: readonly [from: number, to: number] | undefined;
}

/**
 * The app's signature graphic: calories eaten as a body travelling along a
 * shallow arc. A shallow orbital curve, a filled part, and a body dot at
 * the progress point. Past the end the dot hollows and the arc stays full.
 */
export function HorizonArc({ progress, label, band }: HorizonArcProps) {
  const chord = width - inset * 2;
  const sagitta = height - inset * 2;
  const radius = (chord * chord) / 4 / (2 * sagitta) + sagitta / 2;
  const centerX = width / 2;
  const centerY = inset + radius;
  const half = Math.asin(chord / 2 / radius);
  const start = -Math.PI / 2 - half;
  const sweep = 2 * half;
  const at = (fraction: number) => {
    const angle = start + sweep * fraction;
    return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius] as const;
  };
  const arcBetween = (from: number, to: number) => {
    const [fromX, fromY] = at(from);
    const [toX, toY] = at(to);
    return `M${fromX} ${fromY}A${radius} ${radius} 0 0 1 ${toX} ${toY}`;
  };
  const arcTo = (fraction: number) => arcBetween(0, fraction);
  const zone = band === undefined ? undefined : ([clamp(band[0], 0, 1), clamp(band[1], 0, 1)] as const);
  const shown = clamp(progress, 0, 1);
  const [dotX, dotY] = at(shown);
  // The body's glow is an SVG blur: WebKit draws a CSS blur on an SVG shape as a hard ring (found on the iPhone).
  const glow = `mm-horizon-glow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg className="mm-horizon" viewBox={`0 0 ${width} ${height}`} {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}>
      {zone === undefined || zone[1] <= zone[0] ? null : (
        <path className="mm-horizon-band" d={arcBetween(zone[0], zone[1])} strokeWidth={stroke * 2} />
      )}
      <path className="mm-horizon-track" d={arcTo(1)} strokeWidth={stroke} />
      {shown > 0 ? <path className="mm-horizon-fill" d={arcTo(shown)} strokeWidth={stroke} /> : null}
      <defs>
        <filter id={glow} x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation={5} />
        </filter>
      </defs>
      <circle className="mm-horizon-glow" cx={dotX} cy={dotY} r={dotRadius + 5} filter={`url(#${glow})`} />
      {progress > 1 ? (
        <>
          <circle className="mm-horizon-hollow" cx={dotX} cy={dotY} r={dotRadius} />
          <circle className="mm-horizon-ring" cx={dotX} cy={dotY} r={dotRadius - 1} strokeWidth={2} />
        </>
      ) : (
        <circle className="mm-horizon-dot" cx={dotX} cy={dotY} r={dotRadius} />
      )}
    </svg>
  );
}
