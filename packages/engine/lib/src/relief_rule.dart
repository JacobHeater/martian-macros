/// The thresholds of the offer to ease a deficit (MM-117). Judgement: none
/// has a trial behind it. Tune them here.
abstract final class ReliefRule {
  /// An answer at or below this is at the hard end.
  static const hardAnswer = 2;

  /// A check-in counts as hard when at least this many of its five answers
  /// are at the hard end.
  static const hardAnswersPerCheckIn = 3;

  /// How many check-ins running must be hard.
  static const hardCheckInsRunning = 2;

  /// The latest check-in must be this recent, and the one before it no more
  /// than this many days earlier than twice that.
  static const freshDays = 7;
  static const consecutiveWithinDays = 14;

  /// Two check-ins closer together than this are the same week answered
  /// twice, not two weeks.
  static const apartDays = 5;

  /// After the offer is answered it is not made again for this long.
  static const quietDays = 21;

  /// From this many weeks of unbroken deficit the coach would take the
  /// maintenance week; before it, the slower pace.
  static const breakFromDeficitWeeks = 8;

  /// Reported sleep below this adds a line to the offer.
  static const shortSleepHours = 6.0;

  /// The paces a fat-loss goal can run at, fastest first, as a fraction of
  /// body weight a week (MM-128).
  static const paces = [0.01, 0.0075, 0.005];

  /// The pace used when none was chosen.
  static const defaultPace = 0.0075;
}
