import type { CalendarDate } from '../../domain/CalendarDate';
import type { Insight } from '../Insight';
import type { InsightLogEntry } from '../InsightLogEntry';
import { InsightPriority } from '../InsightPriority';
import { InsightRationing } from '../InsightRationing';
import { InsightRule } from '../InsightRule';
import { selectInsight } from '../selectInsight';
import type { FindingDismissal } from '../trends/FindingDismissal';
import type { TrendAnnouncement } from '../trends/TrendAnnouncement';
import type { CoachFinding } from './CoachFinding';
import type { DashboardInsight } from './DashboardInsight';

/**
 * Keys the card leaves to the catalog's rules (MM-141): partial days and
 * estimates rising read every logged day of the fortnight, where the
 * analysis's span needs 60% of its days fully logged before it reads at all.
 */
const leftToRules: readonly string[] = ['partialDays:dataQuality', 'estimatesRising:dataQuality'];

/** The transitions the card may show: what was said, not what was silently updated or held. */
const said = (entry: TrendAnnouncement) => entry.transition !== 'continuing' && entry.transition !== 'held';

const signalOf = (key: string) => {
  const colon = key.indexOf(':');
  return colon < 0 ? key : key.slice(0, colon);
};

/**
 * The one thing the Dashboard's card shows on `today` (MM-610's "Dashboard
 * and Coach agree", under MM-141's ration), or undefined.
 *
 * - **From the analysis:** the announcement log's said entries, made in the
 *   order the analysis ranks them, so a day's first is its top. An entry
 *   made for E is shown from the day after, as the finding of the same id
 *   (a resolved one as its signal's holding-up line), while that finding is
 *   still in the canonical span's analysis and not dismissed.
 * - **The ration** is counted from the announcement log and the insight
 *   log together: a day's top said entry starts on the card only when no
 *   other start fell that day and fewer than three in the 7 days to it. The
 *   rest of that day's entries wait on the Coach tab, never on the card.
 * - **Rules** the analysis has no equivalent of (`InsightRule.analysisSignal`
 *   undefined) compete as before (`selectInsight`): one already showing
 *   keeps showing while its rule holds.
 * - What is showing keeps showing; between two, the higher priority, then
 *   the later start. A new start goes to the higher `InsightPriority` of
 *   the analysis's top entry and the rules' candidate, the analysis on a tie.
 *
 * Pure: the logs are read, never written.
 */
export function selectDashboardInsight({
  today,
  findings,
  announcements,
  rules,
  insightLog,
  dismissals = [],
}: {
  today: CalendarDate;
  /** The canonical span's findings as of yesterday, as the Coach tab arranges them (folded, the dismissed left out). */
  findings: readonly CoachFinding[];
  /** The announcement log, oldest first. */
  announcements: readonly TrendAnnouncement[];
  /** The catalog's candidates without an analysis equivalent, highest priority first (`findInsights`). */
  rules: readonly Insight[];
  insightLog: readonly InsightLogEntry[];
  /** Every dismissal of a finding (`TrendLogReader.watchFindingDismissals`): one dismissed today had today's start. */
  dismissals?: readonly FindingDismissal[];
}): DashboardInsight | undefined {
  const present = new Map(findings.map((f) => [f.id, f] as const));
  const shownFor = (entry: TrendAnnouncement): CoachFinding | undefined =>
    entry.transition === 'resolved' ? present.get(`${signalOf(entry.key)}:holdingUp`) : present.get(entry.key);

  // Each day's top said entry, and each key's latest.
  const topOfDay = new Map<number, TrendAnnouncement>();
  const latestSaid = new Map<string, TrendAnnouncement>();
  for (const entry of announcements) {
    if (!said(entry) || leftToRules.includes(entry.key)) continue;
    latestSaid.set(entry.key, entry);
    if (!topOfDay.has(entry.on.epochDay)) topOfDay.set(entry.on.epochDay, entry);
  }

  // The card's starts before today: the insight log's, and the entries admitted under the ration, day by day.
  const ruleStarts = insightLog.map((e) => e.shownOn.epochDay);
  const admitted: { readonly entry: TrendAnnouncement; readonly cardDay: number }[] = [];
  const startsIn = (from: number, to: number) =>
    ruleStarts.filter((d) => d >= from && d <= to).length + admitted.filter((a) => a.cardDay >= from && a.cardDay <= to).length;
  for (const day of [...topOfDay.keys()].sort((a, b) => a - b)) {
    const cardDay = day + 1;
    const entry = topOfDay.get(day);
    if (entry === undefined || cardDay >= today.epochDay) continue;
    if (startsIn(cardDay, cardDay) >= InsightRationing.newPerDay) continue;
    if (startsIn(cardDay - 6, cardDay) >= InsightRationing.newPerWeek) continue;
    admitted.push({ entry, cardDay });
  }

  const rule = selectInsight({ candidates: rules, log: insightLog, today });
  const rulePriority = (insight: Insight) => InsightPriority.index(InsightRule.priority(insight.rule));

  // What is showing keeps showing.
  let showing: { readonly finding: CoachFinding; readonly entry: TrendAnnouncement; readonly cardDay: number } | undefined;
  for (const a of admitted) {
    const finding = latestSaid.get(a.entry.key) === a.entry ? shownFor(a.entry) : undefined;
    if (finding === undefined) continue;
    const better =
      showing === undefined ||
      InsightPriority.index(finding.priority) < InsightPriority.index(showing.finding.priority) ||
      (InsightPriority.index(finding.priority) === InsightPriority.index(showing.finding.priority) && a.cardDay >= showing.cardDay);
    if (better) showing = { finding, entry: a.entry, cardDay: a.cardDay };
  }
  const ruleShowing = rule !== undefined && !rule.isNew ? rule.insight : undefined;
  if (showing !== undefined && ruleShowing !== undefined) {
    const ruleStart = Math.max(...insightLog.filter((e) => e.rule === ruleShowing.rule).map((e) => e.shownOn.epochDay));
    const findingPriority = InsightPriority.index(showing.finding.priority);
    const findingFirst =
      findingPriority < rulePriority(ruleShowing) || (findingPriority === rulePriority(ruleShowing) && showing.cardDay >= ruleStart);
    return findingFirst
      ? { kind: 'finding', finding: showing.finding, transition: showing.entry.transition }
      : { kind: 'rule', insight: ruleShowing, isNew: false };
  }
  if (showing !== undefined) return { kind: 'finding', finding: showing.finding, transition: showing.entry.transition };
  if (ruleShowing !== undefined) return { kind: 'rule', insight: ruleShowing, isNew: false };

  // A new start today, if the ration allows one.
  const t = today.epochDay;
  if (startsIn(t, t) >= InsightRationing.newPerDay || startsIn(t - 6, t) >= InsightRationing.newPerWeek) return undefined;
  const top = topOfDay.get(t - 1);
  const latest = top !== undefined && latestSaid.get(top.key) === top ? top : undefined;
  const finding = latest === undefined ? undefined : shownFor(latest);
  // Dismissed today, it had today's start: nothing else starts until tomorrow.
  const shownId = latest === undefined ? undefined : latest.transition === 'resolved' ? `${signalOf(latest.key)}:holdingUp` : latest.key;
  if (finding === undefined && shownId !== undefined && dismissals.some((d) => d.findingId === shownId && d.dismissedOn === today)) {
    return undefined;
  }
  const ruleNew = rule?.isNew === true ? rule.insight : undefined;
  if (latest !== undefined && finding !== undefined && (ruleNew === undefined || InsightPriority.index(finding.priority) <= rulePriority(ruleNew))) {
    return { kind: 'finding', finding, transition: latest.transition };
  }
  return ruleNew === undefined ? undefined : { kind: 'rule', insight: ruleNew, isNew: true };
}
