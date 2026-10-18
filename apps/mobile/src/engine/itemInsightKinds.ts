import type { ItemInsightKind } from './ItemInsightKind';

/**
 * The kinds of inline insight the app has, in priority order within each
 * area (MM-362). Each joins once the panel's domain roles have checked it
 * (MM-361), with its row in the evidence register (MM-143): the other
 * drafts of MM-365 to MM-368 are not here until then.
 */
export const itemInsightKinds: readonly ItemInsightKind[] = [
  // MM-366, checked by the training, coaching and safety roles (docs/agent-runs/mm366-workout-rules/).
  {
    id: 'volumeJump',
    area: 'training',
    title: 'Volume jump',
    example:
      '14 sets for chest in the 7 days to this workout. Your usual is about 9 a week. A jump this big can bring ' +
      'more soreness; adding sets more slowly is easier to recover from.',
    priority: 'coaching',
  },
];
