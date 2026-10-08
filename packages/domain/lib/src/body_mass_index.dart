/// Body mass index at or below which no calorie deficit is planned (MM-111).
/// The WHO and CDC boundary of underweight; a convention, not a threshold of
/// harm.
const double underweightBmi = 18.5;

/// Body mass index below which deficits are allowed only at the gentlest
/// pace and a caution is shown (MM-111). A margin above [underweightBmi].
const double lowWeightCautionBmi = 20;

/// The gentlest weekly loss, as a fraction of body weight, used in the
/// caution zone.
const double lowWeightMaxLossFraction = 0.005;

/// Body mass index, kg per square metre.
///
/// Poor as a measure of fatness in muscular people, but at the low end it is
/// the right tool: it needs only height and weight, which the app measures
/// well, and nobody is underweight by BMI because of muscle.
double bodyMassIndex({required double weightKg, required double heightCm}) {
  final heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}
