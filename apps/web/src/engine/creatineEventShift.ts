import type { CalendarDate } from '../domain/CalendarDate';
import type { WeightEvent } from '../domain/WeightEvent';
import { TrendShift } from './TrendShift';
import { weightEventStepDays, weightEventStepPriorKg } from './weightEventConstants';

/**
 * Adds a directional prior for a creatine shift but lets observed weights
 * determine its size. Its signed mean is 1.5 kg and its standard deviation
 * is 1.5 kg, each spread over 21 daily updates; it is not a fixed jump.
 */
export function creatineEventShift(
  creatineEvents: Iterable<WeightEvent>,
): (date: CalendarDate) => TrendShift | undefined {
  const byDay = new Map<number, number>();
  const dailySigma = weightEventStepPriorKg / Math.sqrt(weightEventStepDays);
  for (const event of creatineEvents) {
    const direction = event.type === 'startedCreatine' ? 1 : -1;
    for (let day = 0; day < weightEventStepDays; day++) {
      const epochDay = event.date.epochDay + day;
      const step = (direction * weightEventStepPriorKg) / weightEventStepDays;
      const amount = byDay.get(epochDay);
      byDay.set(epochDay, amount === undefined ? step : amount + step);
    }
  }
  const shifts = new Map<number, TrendShift>();
  for (const [day, levelMeanKg] of byDay) {
    shifts.set(day, new TrendShift({ levelMeanKg, levelSigmaKg: dailySigma, slopeSigmaKgPerDay: 0 }));
  }
  return (date) => shifts.get(date.epochDay);
}
