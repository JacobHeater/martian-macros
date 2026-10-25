import { MuscleGroup } from '../../domain/training/MuscleGroup';
import { buildWeeklyVolume } from '../buildWeeklyVolume';
import type { CoachFinding } from './CoachFinding';
import { coachFindingOf } from './coachFindingOf';
import { daysTrainedBetween } from './daysTrainedBetween';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

/**
 * T3, sets per muscle (MM-609), on MM-78's weekly hard sets
 * (`buildWeeklyVolume`) over the last 4 weeks, for someone training 2 or
 * more days a week: a major group (chest, back, shoulders, quads,
 * hamstrings, glutes) averaging under 4 hard sets a week while another
 * averages 10 or more. On fat loss only a group at 0 sets is named. Holding
 * up: the groups at 10 to 20 sets in 3 of the 4 weeks. Silent with an
 * eating-disorder history or under-eating (no "train more").
 */
export function setsPerMuscleFindings(context: TrainingAnalysisContext): CoachFinding[] {
  const { input, span, asOf, restricted } = context;
  const rule = TrainingAnalysisRule.sets;
  if (restricted || span < TrainingAnalysisRule.needsDays.setsPerMuscle) return [];
  const from = asOf.addDays(1 - 7 * rule.weeks);
  const sessions = daysTrainedBetween(context, from, asOf);
  if (sessions < rule.sessionsPerWeek * rule.weeks) return [];

  // Two fortnights of weekly volume, each its current and previous week: the last 4 weeks, newest first.
  const weekly = new Map<MuscleGroup, number[]>(MuscleGroup.values.map((group) => [group, []]));
  for (let fortnight = 0; fortnight < rule.weeks / 2; fortnight++) {
    const volume = buildWeeklyVolume({ workouts: context.sessions, exercises: input.exercises, today: asOf.addDays(-14 * fortnight) });
    for (const v of volume.groups) weekly.get(v.group)?.push(v.currentSets, v.previousSets);
  }
  const average = (group: MuscleGroup) => (weekly.get(group) ?? []).reduce((a, b) => a + b, 0) / rule.weeks;
  const top = [...MuscleGroup.values].sort((a, b) => average(b) - average(a))[0] as MuscleGroup;
  const topSets = average(top);
  const findings: CoachFinding[] = [];
  const base = { signal: 'setsPerMuscle', span, from, to: asOf, priority: 'pattern' } as const;
  if (topSets >= rule.highSets) {
    const fatLoss = input.setup.goalMode === 'fatLoss';
    for (const group of rule.majorGroups) {
      const sets = average(group);
      if (group === top || sets >= rule.lowSets || (fatLoss && sets > 0)) continue;
      findings.push(
        coachFindingOf({
          ...base,
          kind: 'fix',
          key: group,
          subjects: [group, top],
          figures: { groupSets: sets, topSets, weeks: rule.weeks, sessions },
        }),
      );
    }
  }
  const inRange = MuscleGroup.values.filter(
    (group) => (weekly.get(group) ?? []).filter((sets) => sets >= rule.rangeLow && sets <= rule.rangeHigh).length >= rule.rangeWeeks,
  );
  if (inRange.length > 0) {
    findings.push(
      coachFindingOf({
        ...base,
        kind: 'holdingUp',
        subjects: inRange,
        figures: { groups: inRange.length, weeks: rule.weeks, rangeLow: rule.rangeLow, rangeHigh: rule.rangeHigh },
      }),
    );
  }
  return findings;
}
