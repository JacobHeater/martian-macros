import type { Logs } from './Logs';
import type { SyntheticUser } from './SyntheticUser';

/** Runs `user` at a fixed logged intake for `days`. */
export function simulate(
  user: SyntheticUser,
  {
    days,
    loggedKcal,
    beforeDay,
  }: { days: number; loggedKcal: number; beforeDay?: (day: number, user: SyntheticUser) => void },
): Logs {
  const logs: Logs = { intake: [], weights: [], trueTdee: [] };
  for (let d = 0; d < days; d++) {
    beforeDay?.(d, user);
    logs.trueTdee.push(user.trueTdeeKcal);
    const day = user.liveDay(loggedKcal);
    if (day.intake !== undefined) logs.intake.push(day.intake);
    if (day.weight !== undefined) logs.weights.push(day.weight);
  }
  return logs;
}
