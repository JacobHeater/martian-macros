import type { Meta } from '@storybook/react-vite';
import { CarbFatBalance } from '../../domain/CarbFatBalance';
import { TargetShape } from '../../domain/TargetShape';
import { WeekShape } from '../../domain/WeekShape';
import { CarbFatBalanceScreen } from '../../settings/CarbFatBalanceScreen';
import { SettingsScreen } from '../../settings/SettingsScreen';
import { WeekShapeScreen } from '../../settings/WeekShapeScreen';
import { demoWith } from './demoWith';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * How the user shapes their targets (MM-122, MM-124): the balance of carbs
 * and fat after protein, and a week with higher days that keeps the week's
 * total. Both are set in Settings > Coach; the day's targets on Today and
 * Food follow them.
 */
const meta = { title: 'Screens/Target shape', ...screensMeta } satisfies Meta;
export default meta;

/** The demo, with a shape set two weeks ago. */
const shaped = (shape: { balance?: CarbFatBalance; week?: WeekShape }): StoryScenario =>
  demoWith({ then: async (repos, today) => repos.targetShapes.saveTargetShape(new TargetShape({ since: today.addDays(-14), ...shape })) });

/** The demo with today's targets at 1,500 kcal, so More fat meets the carb floor. */
const lowCalories = (balance: CarbFatBalance): StoryScenario =>
  demoWith({
    then: async (repos, today) => {
      await repos.targets.saveTargets(storyTargets(today, { kcal: 1500, proteinG: 160, proteinMinimumG: 140, fatG: 42, carbsG: 145 }));
      await repos.targetShapes.saveTargetShape(new TargetShape({ since: today.addDays(-14), balance }));
    },
  });

const moreFat = new CarbFatBalance({ fatShare: CarbFatBalance.moreFatFatShare });

/** MM-122, MM-124: Settings > Coach with the two rows that open them, both as the app set them. */
export const CoachRows = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Off: every day has the same target.',
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="coach" />),
});

/** MM-122, MM-486: nothing chosen yet: Balanced, fat 30% of calories, no named position chosen. */
export const BalanceUnchosen = screenStory({
  covers: ['CarbFatBalanceScreen'],
  shows: /As the app set it until you choose/,
  open: ({ navigator }) => void navigator.push(() => <CarbFatBalanceScreen />),
});

/** MM-122: More fat chosen: fat 40% of calories, protein and calories as they were. */
export const BalanceMoreFat = screenStory({
  covers: ['CarbFatBalanceScreen'],
  shows: 'Fat: 40% of calories',
  scenario: shaped({ balance: moreFat }),
  open: ({ navigator }) => void navigator.push(() => <CarbFatBalanceScreen />),
});

/** MM-122: on low calories More fat stops where carbs would go under 100 g, and says so. */
export const BalanceHeldByCarbFloor = screenStory({
  covers: ['CarbFatBalanceScreen'],
  shows: /so carbs can stay at 100 g/,
  scenario: lowCalories(moreFat),
  open: ({ navigator }) => void navigator.push(() => <CarbFatBalanceScreen />),
});

/** MM-124: off, as a new user has it: no higher days, every day the same. */
export const WeekFlat = screenStory({
  covers: ['WeekShapeScreen'],
  shows: 'None: every day has the same target.',
  open: ({ navigator }) => void navigator.push(() => <WeekShapeScreen />),
});

/** MM-124: Saturday and Sunday 20% higher, the other five days lowered so the week totals the same. */
export const WeekWeekendHigher = screenStory({
  covers: ['WeekShapeScreen'],
  shows: 'Higher day',
  scenario: shaped({ week: new WeekShape({ higherDays: [6, 0], raise: 0.2 }) }),
  open: ({ navigator }) => void navigator.push(() => <WeekShapeScreen />),
});

/** MM-124: three days 30% higher asks too much of the others, so the higher days come down, and she is told. */
export const WeekShapeReduced = screenStory({
  covers: ['WeekShapeScreen'],
  shows: /so the higher days are smaller/,
  scenario: shaped({ week: new WeekShape({ higherDays: [5, 6, 0], raise: 0.3 }) }),
  open: ({ navigator }) => void navigator.push(() => <WeekShapeScreen />),
});

/** MM-124: Today on a lower day of a weekend-higher week: the hero's target is the day's own. */
export const TodayOnALowerDay = screenStory({
  covers: ['DashboardScreen'],
  shows: 'More about this week',
  scenario: shaped({ week: new WeekShape({ higherDays: [6, 0], raise: 0.2 }) }),
});

/** MM-122: Food with More fat chosen: the day's fat and carb targets follow the balance. */
export const FoodWithMoreFat = screenStory({
  covers: ['FoodScreen'],
  shows: 'Breakfast',
  scenario: shaped({ balance: moreFat }),
  open: ({ state }) => state.homeTab.put('food'),
});
