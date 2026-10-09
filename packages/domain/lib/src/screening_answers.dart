/// Answers to the onboarding health screen.
final class ScreeningAnswers {
  const ScreeningAnswers({
    this.pregnant = false,
    this.breastfeeding = false,
    this.eatingDisorderHistory = false,
    this.chronicKidneyDisease = false,
    this.androgenUse = false,
    this.pcos = false,
    this.menopause = false,
    this.thyroidCondition = false,
    this.insulinOrSulfonylurea = false,
    this.insulinCareTeamConfirmed = false,
    this.bariatricSurgery = false,
    this.weightAffectingMedication = false,
  });

  final bool pregnant;
  final bool breastfeeding;
  final bool eatingDisorderHistory;
  final bool chronicKidneyDisease;

  /// TRT or anabolic steroid use. Not blocking; raises the muscle-gain prior.
  final bool androgenUse;

  final bool pcos;
  final bool menopause;
  final bool thyroidCondition;
  final bool insulinOrSulfonylurea;
  final bool insulinCareTeamConfirmed;
  final bool bariatricSurgery;
  final bool weightAffectingMedication;

  @override
  bool operator ==(Object other) =>
      other is ScreeningAnswers &&
      pregnant == other.pregnant &&
      breastfeeding == other.breastfeeding &&
      eatingDisorderHistory == other.eatingDisorderHistory &&
      chronicKidneyDisease == other.chronicKidneyDisease &&
      androgenUse == other.androgenUse &&
      pcos == other.pcos &&
      menopause == other.menopause &&
      thyroidCondition == other.thyroidCondition &&
      insulinOrSulfonylurea == other.insulinOrSulfonylurea &&
      insulinCareTeamConfirmed == other.insulinCareTeamConfirmed &&
      bariatricSurgery == other.bariatricSurgery &&
      weightAffectingMedication == other.weightAffectingMedication;

  @override
  int get hashCode => Object.hash(
    pregnant,
    breastfeeding,
    eatingDisorderHistory,
    chronicKidneyDisease,
    androgenUse,
    pcos,
    menopause,
    thyroidCondition,
    insulinOrSulfonylurea,
    insulinCareTeamConfirmed,
    bariatricSurgery,
    weightAffectingMedication,
  );
}
