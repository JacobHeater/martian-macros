/// Whether the checks GitHub requires for the branch could be established.
enum RequiredDiscovery {
  /// GitHub listed the required checks.
  discovered,

  /// GitHub reported no required checks for the branch. That is what it
  /// says when none are configured, and also before any has registered, so
  /// it is not proof that nothing is required.
  noneReported,

  /// It could not be established (an error, or an answer not understood).
  unknown,
}
