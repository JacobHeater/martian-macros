import type { CalendarDate } from '../../domain/CalendarDate';
import { InsightPriority } from '../InsightPriority';
import type { FindingDismissal } from '../trends/FindingDismissal';
import { rankTrendFindings } from '../trends/rankTrendFindings';
import type { TrendFinding } from '../trends/TrendFinding';
import { TrendTransition } from '../trends/TrendTransition';
import type { CoachFinding } from './CoachFinding';
import type { CoachFindingSections } from './CoachFindingSections';
import { findingQuietDays } from './findingQuietDays';
import { foldTrainingProtein } from './foldTrainingProtein';
import type { HiddenFinding } from './HiddenFinding';

/** How many a list holds before the rest go under "N more from your data". */
const listed = 3;

/**
 * Places one span's findings in "What your data says" (MM-610).
 *
 * - X1 is folded into N1 when both are in change (`foldTrainingProtein`).
 * - A finding dismissed less than 28 days ago is hidden, with the day it
 *   shows again; 1d's "what is left" is never hidden.
 * - **Worth changing:** data quality first (it limits the rest), then the
 *   fixes by priority class (MM-141), then the key's transition (MM-605),
 *   then the trend engine's own ranking (`rankTrendFindings`) for those with
 *   a trend, and the rest in the order the analysis gave them. A fat line
 *   that states the protein it displaced is said just before the protein
 *   minimum's own line, as the one that names the foods and the trade.
 * - **Stable:** within one priority class and transition, a finding that
 *   was ranked before keeps its place (`previousOrder`, the ids in the
 *   order last shown); one new to the list comes after them. So the list
 *   moves only when a finding changes class or transition, and its figures
 *   update in place.
 * - **Holding up** in the order given; never padded.
 * - **More:** the fixes past three, then the strengths past three; the
 *   section shows them as two groups under the same labels (MM-610's PD-2).
 * - The headline is the top holding-up finding and the top fix, only when
 *   both exist.
 */
export function arrangeCoachFindings(
  findings: readonly CoachFinding[],
  {
    today,
    dismissals = [],
    transitions = new Map(),
    previousOrder = [],
  }: {
    today: CalendarDate;
    /** Every dismissal, oldest first (`TrendLogReader.watchFindingDismissals`). */
    dismissals?: readonly FindingDismissal[];
    /**
     * Each key's transition as of the span's last day: a finding's id (the announcement log's key, MM-605), or else
     * its trend's key. A key not here is continuing.
     */
    transitions?: ReadonlyMap<string, TrendTransition>;
    previousOrder?: readonly string[];
  },
): CoachFindingSections {
  const all = foldTrainingProtein(findings);
  const dismissedOn = new Map<string, CalendarDate>();
  for (const d of dismissals) {
    const before = dismissedOn.get(d.findingId);
    if (before === undefined || !d.dismissedOn.isBefore(before)) dismissedOn.set(d.findingId, d.dismissedOn);
  }
  const hidden: HiddenFinding[] = [];
  const shown: CoachFinding[] = [];
  for (const finding of all) {
    const on = finding.kind === 'left' ? undefined : dismissedOn.get(finding.id);
    const showsAgainOn = on?.addDays(findingQuietDays);
    if (on !== undefined && showsAgainOn !== undefined && today.isBefore(showsAgainOn)) {
      hidden.push({ finding, dismissedOn: on, showsAgainOn });
    } else {
      shown.push(finding);
    }
  }
  hidden.sort((a, b) => a.showsAgainOn.epochDay - b.showsAgainOn.epochDay);

  const quality = shown.filter((f) => f.kind === 'dataQuality');
  const holding = shown.filter((f) => f.kind === 'holdingUp');
  const fixes = rankFixes(
    shown.filter((f) => f.kind === 'fix'),
    transitions,
    previousOrder,
  );
  const worth = [...quality, ...fixes];
  const topHolding = holding[0];
  const topFix = fixes[0];
  return {
    left: shown.find((f) => f.kind === 'left'),
    headline: topHolding === undefined || topFix === undefined ? undefined : { holdingUp: topHolding, fix: topFix },
    worthChanging: worth.slice(0, listed),
    holdingUp: holding.slice(0, listed),
    more: [...worth.slice(listed), ...holding.slice(listed)],
    hidden,
  };
}

/** The fixes in the order they are shown. */
function rankFixes(
  fixes: readonly CoachFinding[],
  transitions: ReadonlyMap<string, TrendTransition>,
  previousOrder: readonly string[],
): CoachFinding[] {
  const trends = fixes.flatMap((f) => (f.trend === undefined ? [] : [f.trend]));
  const trendPlace = new Map<TrendFinding, number>(rankTrendFindings(trends, transitions).map((t, i) => [t, i] as const));
  const before = new Map(previousOrder.map((id, i) => [id, i] as const));
  const unseen = Number.MAX_SAFE_INTEGER;
  const placed = fixes.map((f, i) => ({
    f,
    priority: InsightPriority.index(f.priority),
    transition: TrendTransition.rank(transitionOf(f, transitions)),
    before: before.get(f.id) ?? unseen,
    // With a trend by the engine's ranking, then the rest as given.
    rank: f.trend === undefined ? trends.length + i : (trendPlace.get(f.trend) ?? i),
  }));
  placed.sort((a, b) => a.priority - b.priority || a.transition - b.transition || a.before - b.before || a.rank - b.rank);
  // The fat line that states the protein it displaced leads the protein minimum, when both are in one class and transition.
  const fatAt = placed.findIndex((p) => p.f.signal === 'fatAgainstTarget' && p.f.figures['proteinShortG'] !== undefined);
  const proteinAt = placed.findIndex((p) => p.f.signal === 'proteinMinimum');
  const fat = placed[fatAt];
  const protein = placed[proteinAt];
  if (
    fat !== undefined &&
    protein !== undefined &&
    fatAt > proteinAt &&
    fat.priority === protein.priority &&
    fat.transition === protein.transition
  ) {
    placed.splice(fatAt, 1);
    placed.splice(proteinAt, 0, fat);
  }
  return placed.map((p) => p.f);
}

/** A finding's transition: by its id, as the announcement log keys it, else by its trend's key; continuing when neither is known. */
function transitionOf(f: CoachFinding, transitions: ReadonlyMap<string, TrendTransition>): TrendTransition {
  return transitions.get(f.id) ?? (f.trend === undefined ? undefined : transitions.get(f.trend.key)) ?? 'continuing';
}
