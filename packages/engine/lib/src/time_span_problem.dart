/// Why a typed start and end cannot be right (MM-191).
enum TimeSpanProblem {
  /// The end is not after the start.
  endNotAfterStart,

  /// A time is before the earliest allowed (the workout's start).
  tooEarly,

  /// A time is after the latest allowed (the workout's end, or now).
  tooLate,
}
