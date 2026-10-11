/// The moment a typed [timeOfDay] means for something that began at
/// [notBefore] (MM-191). It is on the day of [notBefore], unless that would
/// be before it began and the same time a day later is not after
/// [notAfter] and is within twelve hours of the beginning: a workout that
/// runs past midnight ends on the next day, but a slip of the finger does
/// not make one that lasts most of a day. A time that fits neither is left
/// on the first day for the caller to refuse; it is never moved to fit.
DateTime placeTimeOfDay({
  required DateTime notBefore,
  required DateTime notAfter,
  required Duration timeOfDay,
}) {
  DateTime on(int addDays) => DateTime(
    notBefore.year,
    notBefore.month,
    notBefore.day + addDays,
    0,
    0,
    timeOfDay.inSeconds,
  );
  final sameDay = on(0);
  if (!sameDay.isBefore(notBefore)) return sameDay;
  final nextDay = on(1);
  final fits =
      !nextDay.isAfter(notAfter) &&
      nextDay.difference(notBefore) < const Duration(hours: 12);
  return fits ? nextDay : sameDay;
}
