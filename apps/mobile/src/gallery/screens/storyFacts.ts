import type { CalendarDate } from '../../domain/CalendarDate';
import type { InMemoryRepositories } from '../../fixtures/InMemoryRepositories';
import { detailLevelLabel } from '../../format/detailLevelLabel';
import { Fmt } from '../../format/Fmt';
import { goalModeLabel } from '../../format/goalModeLabel';
import { waterAmount } from '../../format/waterAmount';
import { pauseOn } from '../../engine/pauseOn';
import type { StoryFact } from './StoryFact';
import { valueOf } from './valueOf';

const days = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;

/**
 * Who a story's person is, read from what its scenario stored (MM-356): the
 * settings and records that change how a screen is drawn, so a difference
 * between two stories, such as no water goal, is never hidden.
 */
export async function storyFacts(
  repos: InMemoryRepositories,
  today: CalendarDate,
  altered: { stores: boolean; device: boolean },
): Promise<StoryFact[]> {
  const setup = await valueOf(repos.setup.watchSetup());
  const story: StoryFact[] = [
    ['Storage', altered.stores ? 'Altered by this story: a read waits or fails' : 'As stored'],
    ['Device', altered.device ? 'Given by this story' : 'Nothing of a device'],
  ];
  if (setup === undefined) return [['Person', 'A new installation: nothing stored'], ...story];
  const fmt = new Fmt(setup.unitSystem);
  const goals = await valueOf(repos.preferences.watchNutritionGoals());
  const weights = await valueOf(repos.weights.watchWeights());
  const intake = await valueOf(repos.intake.watchIntakeDays({ since: today.addDays(-29) }));
  const water = await valueOf(repos.water.watchWater(today));
  const workouts = await valueOf(repos.workouts.watchWorkouts());
  const pauses = await valueOf(repos.pauses.watchPauses());
  const targets = await valueOf(repos.targets.watchTargetsHistory());
  const detail = await valueOf(repos.preferences.watchDetailLevel());
  const picture = await valueOf(repos.preferences.watchMacroPicture());
  const answered = Object.entries(setup.screening)
    .filter(([, value]) => value === true)
    .map(([name]) => name);
  const last = weights[weights.length - 1];
  const paused = pauseOn(pauses, today);
  return [
    ['Person', `${setup.profile.sex === 'male' ? 'Male' : 'Female'}, ${setup.profile.ageOn(today)}`],
    ['Started', setup.onboardedOn === today ? 'Today' : `${days(setup.onboardedOn.daysUntil(today), 'day')} ago`],
    ['Goal', goalModeLabel(setup.goalMode)],
    ['Units', setup.unitSystem === 'imperial' ? 'Imperial' : 'Metric'],
    ['Detail', detailLevelLabel(detail)],
    ['Macro picture', { bars: 'Grams', donut: 'Split', micros: 'Micros' }[picture]],
    ['Water goal', goals.waterGoalMl === undefined ? 'Off' : waterAmount(goals.waterGoalMl, setup.unitSystem)],
    ['Sodium limit', goals.sodiumLimitMg === undefined ? 'Off' : `${Fmt.whole(goals.sodiumLimitMg)} mg`],
    ['Health check', answered.length === 0 ? 'Nothing answered yes' : answered.join(', ')],
    ['Weigh-ins', last === undefined ? 'None' : `${weights.length}, last ${fmt.weight(last.weightKg)} on ${Fmt.shortDay(last.date)}`],
    ['Food, last 30 days', days(intake.filter((day) => day.kcal > 0).length, 'day')],
    ['Water today', water.length === 0 ? 'None' : waterAmount(water.reduce((sum, e) => sum + e.ml, 0), setup.unitSystem)],
    ['Workouts', String(workouts.filter((w) => !w.inProgress).length)],
    ['Pause', paused === undefined ? 'None today' : `${paused.reason}, until ${Fmt.shortDay(paused.to)}`],
    ['Targets', days(targets.length, 'record')],
    ...story,
  ];
}
