import type { CalendarDate } from '../../../src/domain';
import type { TrendDay } from '../../../src/engine';
import { DartRandom } from '../../support/DartRandom';

/**
 * A stationary simulated logger for the trend engine's null simulation
 * (MM-605): nothing about their eating changes, so every trend the engine
 * announces is false. Daily intake is their own mean, 1,800 to 2,800 kcal,
 * with a day-to-day spread of 12% to 22% and a little carry-over from one
 * day to the next (lag-1 correlation up to 0.2). One day in ten is
 * unlogged and one in twenty-five half logged. Their target is their mean,
 * to the nearest 10. Deterministic for a seed.
 */
export function stationaryTrendUser(seed: number, start: CalendarDate, days: number): TrendDay[] {
  const random = new DartRandom(seed);
  const normal = () => {
    const u1 = 1 - random.nextDouble();
    const u2 = random.nextDouble();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  const mean = 1800 + 1000 * random.nextDouble();
  const spread = 0.12 + 0.1 * random.nextDouble();
  const carry = 0.2 * random.nextDouble();
  const target = Math.round(mean / 10) * 10;
  let z = normal();
  return Array.from({ length: days }, (_, i): TrendDay => {
    if (i > 0) z = carry * z + Math.sqrt(1 - carry * carry) * normal();
    const date = start.addDays(i);
    const kcal = Math.max(0, mean * (1 + spread * z));
    const draw = random.nextDouble();
    if (draw < 0.1) return { date, value: undefined, eligible: false, reason: 'unlogged', target };
    if (draw < 0.14) return { date, value: kcal * 0.5, eligible: false, reason: 'partial', target };
    return { date, value: kcal, eligible: true, reason: undefined, target, relativeSigma: 0.1, estimatedShare: 0.2 * random.nextDouble() };
  });
}
