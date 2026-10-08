/// Resistance-training background, which drives recomp eligibility and the
/// lean/fat partition of weight change.
enum TrainingStatus {
  /// No structured resistance training.
  untrained,

  /// Under one year of consistent training.
  novice,

  /// Previously trained, back after a layoff of six months or more.
  returning,

  intermediate,
  advanced;

  bool get isResistanceTrained => this != untrained;
}
