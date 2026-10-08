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
}
