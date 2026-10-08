/// Why a target changed, by cause (MM-138). Each line of an explanation has
/// one of these; the app words them.
enum ExplanationReason {
  /// The first targets: nothing to compare with.
  firstTargets,

  /// The measured (or starting) expenditure moved.
  expenditureEstimate,

  /// Everything else in the ordinary calculation: body weight, the pace.
  paceAndWeight,

  /// The user changed their goal.
  goalChange,

  /// The user corrected their sex, date of birth, height or health check.
  profileCorrection,

  /// A health-check answer rules the goal out.
  healthRule,

  /// Body mass index is below 18.5.
  underweightRule,

  /// The body-fat estimate moved far enough to change a safety limit.
  bodyFatEstimate,

  /// A diet break (a long deficit hit its limit).
  dietBreak,

  /// The weekly step limit held part of the change back.
  stepLimit,

  /// The target was held at last week's level after a safety raise.
  holdAfterRaise,

  /// The user was losing faster than the safe pace, so calories went up.
  safetyRaise,

  /// The user kept last week's targets for now.
  userHold,

  /// The calorie floor held the target up.
  calorieFloor,

  /// Targets made before explanations were recorded.
  noExplanationRecorded,
}
