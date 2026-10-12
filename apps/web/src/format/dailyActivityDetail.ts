import type { DailyActivity } from '../domain';

const details: Readonly<Record<DailyActivity, string>> = {
  seated: 'Desk work, driving. About 3,000 steps a day.',
  light: 'Some walking and errands. About 6,000 steps a day.',
  onFeet: 'Retail, teaching, care work. About 10,000 steps a day.',
  physicalJob: 'Trades, farming, delivery on foot. 12,000 steps or more.',
};

/** Examples and a typical step count, so a user can place themselves. */
export const dailyActivityDetail = (activity: DailyActivity): string => details[activity];
