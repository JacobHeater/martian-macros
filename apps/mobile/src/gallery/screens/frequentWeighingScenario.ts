import { demoWith } from './demoWith';
import type { StoryScenario } from './StoryScenario';

/**
 * The demo with a scale that recorded two weigh-ins a morning on five of
 * the last fourteen days, and no weight display chosen: the one-time offer
 * shows (MM-118).
 */
export const frequentWeighingScenario: StoryScenario = demoWith({
  then: async (repos, today) => {
    const at = (daysAgo: number, hour: number) => {
      const day = today.addDays(-daysAgo);
      return new Date(day.year, day.month - 1, day.day, hour, 0);
    };
    await repos.healthSamples.upsert(
      [1, 3, 5, 7, 9].flatMap((d) =>
        [7, 8].map((hour) => ({
          platformId: `story-w-${d}-${hour}`,
          type: 'weight' as const,
          value: 80 + hour / 10,
          start: at(d, hour),
          sourceId: 'com.example.scale',
          sourceName: 'Scale',
        })),
      ),
    );
  },
});
