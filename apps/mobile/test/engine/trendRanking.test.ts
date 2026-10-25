import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain';
import { dedupeTrendFindings, rankTrendFindings, type TrendTransition } from '../../src/engine';
import { trendFinding } from './support/trendFinding';

/** MM-605: de-duplication across signals, then the lexicographic ranking. */
const keys = (findings: readonly { key: string }[]) => findings.map((f) => f.key);

describe('de-duplication', () => {
  it('a shift beats a drift on the same signal, and carries it', () => {
    const shift = trendFinding({ signal: 'kcal', aspect: 'level', detector: 'shift' });
    const drift = trendFinding({ signal: 'kcal', aspect: 'drift', detector: 'drift' });
    const other = trendFinding({ signal: 'protein', aspect: 'drift', detector: 'drift' });
    const kept = dedupeTrendFindings([shift, drift, other]);
    expect(keys(kept)).toEqual(['kcal:level', 'protein:drift']);
    expect(keys(kept[0]!.supporting)).toEqual(['kcal:drift']);
  });

  it('a settled shift, read as a level, does not', () => {
    const shift = trendFinding({ signal: 'kcal', aspect: 'level', detector: 'shift', settled: true });
    const drift = trendFinding({ signal: 'kcal', aspect: 'drift', detector: 'drift' });
    expect(dedupeTrendFindings([shift, drift])).toHaveLength(2);
  });

  it('a family keeps its top finding per direction, with the others as supporting figures', () => {
    const kcal = trendFinding({ signal: 'kcal', family: 'intake', tier: 'strong' });
    const carbs = trendFinding({ signal: 'carbs', family: 'intake', tier: 'clear' });
    const fat = trendFinding({ signal: 'fat', family: 'intake', direction: 'down', effect: -200 });
    const kept = dedupeTrendFindings([carbs, kcal, fat]);
    expect(keys(kept)).toEqual(['kcal:level', 'fat:level']);
    expect(keys(kept[0]!.supporting)).toEqual(['carbs:level']);
  });

  it('data quality withholds the sizes of its signal and family over the same span', () => {
    const quality = trendFinding({ signal: 'kcal', aspect: 'loggingStyle', priority: 'dataQuality', family: 'intake' });
    const kcal = trendFinding({ signal: 'kcal', aspect: 'weekday', detector: 'weekend' });
    const protein = trendFinding({ signal: 'protein', family: 'intake' });
    const steps = trendFinding({ signal: 'steps', family: 'activity' });
    const longer = trendFinding({ signal: 'fiber', family: 'intake', span: 90 });
    const kept = dedupeTrendFindings([quality, kcal, protein, steps, longer]);
    expect(kept.map((f) => [f.key, f.sizeWithheld])).toEqual([
      ['kcal:loggingStyle', false],
      ['kcal:weekday', true],
      ['protein:level', true],
      ['steps:level', false],
      ['fiber:level', false],
    ]);
  });
});

describe('ranking', () => {
  it('priority class comes first', () => {
    const pattern = trendFinding({ signal: 'a', priority: 'pattern', tier: 'strong' });
    const safety = trendFinding({ signal: 'b', priority: 'safety', tier: 'clear' });
    const quality = trendFinding({ signal: 'c', priority: 'dataQuality' });
    expect(keys(rankTrendFindings([pattern, quality, safety]))).toEqual(['b:level', 'c:level', 'a:level']);
  });

  it('then the transition: reversed, new, resolved, continuing', () => {
    const findings = ['a', 'b', 'c', 'd'].map((signal) => trendFinding({ signal }));
    const transitions = new Map<string, TrendTransition>([
      ['a:level', 'continuing'],
      ['b:level', 'resolved'],
      ['c:level', 'new'],
      ['d:level', 'reversed'],
    ]);
    expect(keys(rankTrendFindings(findings, transitions))).toEqual(['d:level', 'c:level', 'b:level', 'a:level']);
  });

  it('then actionable, then tier', () => {
    const idle = trendFinding({ signal: 'a', actionable: false, tier: 'strong' });
    const clear = trendFinding({ signal: 'b', tier: 'clear' });
    const strong = trendFinding({ signal: 'c', tier: 'strong' });
    expect(keys(rankTrendFindings([idle, clear, strong]))).toEqual(['c:level', 'b:level', 'a:level']);
  });

  it('then the effect against δ, capped at 3, then the most recent onset, then catalog order', () => {
    const big = trendFinding({ signal: 'a', effect: 500, onsetDate: CalendarDate.of(2026, 10, 1) });
    const capped = trendFinding({ signal: 'b', effect: 300, onsetDate: CalendarDate.of(2026, 10, 12) });
    const small = trendFinding({ signal: 'c', effect: 150, onsetDate: CalendarDate.of(2026, 10, 15) });
    expect(keys(rankTrendFindings([big, small, capped]))).toEqual(['b:level', 'a:level', 'c:level']);

    const later = trendFinding({ signal: 'd', order: 2 });
    const earlier = trendFinding({ signal: 'e', order: 1 });
    expect(keys(rankTrendFindings([later, earlier]))).toEqual(['e:level', 'd:level']);
  });
});
