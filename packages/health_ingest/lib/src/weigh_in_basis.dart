/// Why a day's imported weigh-in is the reading it is (MM-71).
enum WeighInBasis {
  /// The first reading of the morning, between 04:00 and 12:00.
  firstMorning,

  /// No morning reading: the middle value of the day's readings.
  medianOfDay,
}
