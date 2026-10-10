/// Which kind of stall it is (MM-140). The first that applies, in this order.
enum StallDiagnosis {
  /// The log is too thin to tell.
  data,

  /// Fat is probably being lost and water is hiding it.
  masked,

  /// Average intake is off the target in the direction that explains it.
  intake,

  /// Intake is on target and the data is good: expenditure was misjudged.
  estimate,
}
