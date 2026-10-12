const twelveHoursMs = 12 * 60 * 60 * 1000;

/**
 * The moment a typed time of day means for something that began at
 * `notBefore` (MM-191). `timeOfDayMs` is the time as milliseconds after
 * midnight. It is on the day of `notBefore`, unless that would be before it
 * began and the same time a day later is not after `notAfter` and is within
 * twelve hours of the beginning: a workout that runs past midnight ends on
 * the next day, but a slip of the finger does not make one that lasts most
 * of a day. A time that fits neither is left on the first day for the
 * caller to refuse; it is never moved to fit.
 */
export function placeTimeOfDay({
  notBefore,
  notAfter,
  timeOfDayMs,
}: {
  notBefore: Date;
  notAfter: Date;
  timeOfDayMs: number;
}): Date {
  const on = (addDays: number) =>
    new Date(
      notBefore.getFullYear(),
      notBefore.getMonth(),
      notBefore.getDate() + addDays,
      0,
      0,
      Math.trunc(timeOfDayMs / 1000),
    );
  const sameDay = on(0);
  if (!(sameDay.getTime() < notBefore.getTime())) return sameDay;
  const nextDay = on(1);
  const fits =
    !(nextDay.getTime() > notAfter.getTime()) && nextDay.getTime() - notBefore.getTime() < twelveHoursMs;
  return fits ? nextDay : sameDay;
}
