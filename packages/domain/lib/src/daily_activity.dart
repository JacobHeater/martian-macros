/// How active the user is across an ordinary day, outside planned workouts.
/// Training is recorded separately (days per week); the two together set the
/// starting energy-expenditure estimate (MM-164).
enum DailyActivity {
  /// Desk work, driving: about 3,000 steps a day.
  seated,

  /// Some walking and errands: about 6,000 steps.
  light,

  /// On their feet most of the day: about 10,000 steps.
  onFeet,

  /// A physical job: 12,000 steps or more.
  physicalJob,
}
