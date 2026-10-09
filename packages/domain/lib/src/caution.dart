/// Conditions that warrant a "talk to your clinician" note.
enum Caution {
  pregnancy,
  breastfeeding,
  eatingDisorderHistory,
  chronicKidneyDisease,
  pcos,
  menopause,
  thyroidCondition,
  insulinOrSulfonylurea,
  bariatricSurgery,
  weightAffectingMedication,

  /// Body mass index below 18.5: no deficit is planned (MM-111).
  underweight,

  /// Body mass index from 18.5 to 20: deficits only at the gentlest pace.
  lowBodyWeight,
}
