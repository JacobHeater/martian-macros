import type { IntakeDay } from '../domain/IntakeDay';
import { Fmt } from '../format/Fmt';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { MacroKind } from '../ui/MacroKind';
import type { MmAnchor } from '../ui/MmAnchor';
import { MmPressable } from '../ui/MmPressable';
import './charts.css';

interface MacroSplitChartProps {
  intake: IntakeDay;
  /** For a food that is about to be logged, not what has been. */
  isPreview?: boolean;
  /** Inside the hero: the ring and its figures, without how the split is counted. */
  compact?: boolean;
  /** Carbs counted net of fiber and sugar alcohols, and named so (MM-396). */
  netCarbs?: boolean;
  /** With it, each macro's line is pressed to ask about it, at the line's edges (MM-562). */
  onPick?: ((macro: MacroKind, anchor: MmAnchor) => void) | undefined;
  /** The macro whose question is open, said as expanded. */
  picked?: MacroKind | undefined;
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
export function MacroSplitChart({
  intake,
  isPreview = false,
  compact = false,
  netCarbs = false,
  onPick,
  picked,
}: MacroSplitChartProps) {
  const grams: Readonly<Record<MacroKind, number>> = {
    protein: intake.proteinG,
    carbs: netCarbs ? intake.netCarbsG : intake.carbsG,
    fat: intake.fatG,
  };
  const energy = (macro: MacroKind) => grams[macro] * (macro === 'fat' ? 9 : 4);
  const total = MacroKind.values.reduce((sum, macro) => sum + energy(macro), 0);
  // Less than half a calorie rounds to none: no split to show, never "0 g · 100%" (MM-331). The ring is
  // still drawn, whole and grey, where the split will be, with what it needs beneath it (MM-354).
  if (total < 0.5) {
    const needs = isPreview
      ? 'Enter macro amounts to preview the split.'
      : 'Log food with protein, carbs or fat to see the split.';
    return (
      <div className="chart-split">
        <svg className="chart-split-ring" viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
          <circle className="chart-split-empty" cx={center} cy={center} r={(inner + outer) / 2} strokeWidth={outer - inner} />
        </svg>
        <p className="chart-split-needs">{needs}</p>
      </div>
    );
  }
  const share = (macro: MacroKind) => `${toStringAsFixed((100 * energy(macro)) / total, 1)}%`;
  const figures = (macro: MacroKind) => `${Fmt.grams(grams[macro])} · ${share(macro)}`;
  const label =
    `${isPreview ? 'Food preview' : 'Logged'} macronutrient energy split. ` +
    `${MacroKind.values.map((macro) => `${MacroKind.label(macro, { netCarbs })}: ${figures(macro)}`).join('. ')}.`;

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
          {MacroKind.values.map((macro) => {
            // MM-554: the name and figure in text; the colour is carried by the key, not by the words.
            const item = (
              <span className="chart-split-item">
                <span>
                  <span className={`chart-key chart-key-${macro}`} aria-hidden="true" />
                  {MacroKind.label(macro, { netCarbs })}
                </span>
                <span>{figures(macro)}</span>
              </span>
            );
            return (
              <li key={macro}>
                {onPick === undefined ? (
                  item
                ) : (
                  <MmPressable expanded={picked === macro} onPress={(anchor) => onPick(macro, anchor)}>
                    {item}
                  </MmPressable>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {/* Inside the hero the ring stands alone; elsewhere one line says how the split is counted (MM-562). */}
      {compact ? null : (
        <p className="chart-caption">
          {Fmt.kcal(total)} from {isPreview ? 'food' : 'recorded'} macros · protein/{netCarbs ? 'net carbs' : 'carbs'} 4 kcal/g,
          fat 9 kcal/g. Alcohol{netCarbs ? ', fiber, sugar alcohols' : ''} and other calorie differences are not part of this split.
        </p>
      )}
    </div>
  );
}
