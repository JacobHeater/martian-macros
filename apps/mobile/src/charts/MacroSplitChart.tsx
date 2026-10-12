import type { IntakeDay } from '../domain/IntakeDay';
import { Fmt } from '../format/Fmt';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { MacroKind } from '../ui/MacroKind';
import './charts.css';

interface MacroSplitChartProps {
  intake: IntakeDay;
  /** For a food that is about to be logged, not what has been. */
  isPreview?: boolean;
}

const size = 112;
const center = size / 2;
const inner = 24;
const outer = inner + 29;
const gap = 3;

/** A ring sector from `from` to `to`, as fractions of a turn starting at twelve o'clock. */
function sector(from: number, to: number): string {
  const point = (turn: number, radius: number) => {
    const angle = turn * 2 * Math.PI - Math.PI / 2;
    return `${(center + Math.cos(angle) * radius).toFixed(2)} ${(center + Math.sin(angle) * radius).toFixed(2)}`;
  };
  const large = to - from > 0.5 ? 1 : 0;
  // A full ring cannot be one arc: it is drawn as nearly all of one.
  const end = Math.min(to, from + 0.9999);
  return (
    `M${point(from, outer)}A${outer} ${outer} 0 ${large} 1 ${point(end, outer)}` +
    `L${point(end, inner)}A${inner} ${inner} 0 ${large} 0 ${point(from, inner)}Z`
  );
}

/** The 4/4/9 energy split of logged macros, not percentages of target grams. */
export function MacroSplitChart({ intake, isPreview = false }: MacroSplitChartProps) {
  const grams: Readonly<Record<MacroKind, number>> = { protein: intake.proteinG, carbs: intake.carbsG, fat: intake.fatG };
  const energy = (macro: MacroKind) => grams[macro] * (macro === 'fat' ? 9 : 4);
  const total = MacroKind.values.reduce((sum, macro) => sum + energy(macro), 0);
  if (total === 0) {
    return (
      <p className="chart-note">
        {isPreview
          ? 'Enter macro amounts to preview the protein, carbs and fat split.'
          : 'Log macro amounts to see your protein, carbs and fat split.'}
      </p>
    );
  }
  const share = (macro: MacroKind) => `${toStringAsFixed((100 * energy(macro)) / total, 1)}%`;
  const figures = (macro: MacroKind) => `${Fmt.grams(grams[macro])} · ${share(macro)}`;
  const label =
    `${isPreview ? 'Food preview' : 'Logged'} macronutrient energy split. ` +
    `${MacroKind.values.map((macro) => `${MacroKind.label(macro)}: ${figures(macro)}`).join('. ')}.`;

  const shown = MacroKind.values.filter((macro) => energy(macro) > 0);
  // The space between sectors, as a fraction of a turn at the middle of the ring.
  const spacing = shown.length > 1 ? gap / (2 * Math.PI * ((inner + outer) / 2)) : 0;
  let turned = 0;
  const sectors = shown.map((macro) => {
    const from = turned;
    turned += energy(macro) / total;
    return { macro, path: sector(from + spacing / 2, turned - spacing / 2) };
  });

  return (
    <div className="chart-split">
      <div className="chart-split-row">
        <svg className="chart-split-ring" viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={label}>
          {sectors.map(({ macro, path }) => (
            <path key={macro} className={`chart-sector chart-sector-${macro}`} data-energy={energy(macro)} d={path} />
          ))}
        </svg>
        <ul className="chart-split-list">
          {MacroKind.values.map((macro) => (
            <li key={macro} className={`chart-split-item chart-text-${macro}`}>
              <span>{MacroKind.label(macro)}</span>
              <span>{figures(macro)}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="chart-caption">
        {Fmt.kcal(total)} from {isPreview ? 'food' : 'recorded'} macros · protein/carbs 4 kcal/g, fat 9 kcal/g. Alcohol
        and other calorie differences are not part of this split.
      </p>
    </div>
  );
}
