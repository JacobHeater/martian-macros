import 'package:mm_domain/mm_domain.dart';

extension CautionMessage on Caution {
  String get message => switch (this) {
    Caution.pregnancy =>
      'Pregnancy: the app holds you at maintenance and will not prescribe '
          'a deficit. Follow your clinician’s guidance on intake.',
    Caution.breastfeeding =>
      'Breastfeeding: targets include extra energy for milk production '
          'and the app will not prescribe a deficit.',
    Caution.eatingDisorderHistory =>
      'Deficit modes are switched off. If food or weight tracking starts '
          'to feel distressing, stop and talk to your care team.',
    Caution.chronicKidneyDisease =>
      'Kidney disease: protein is capped low. Confirm your protein and '
          'energy targets with your nephrologist or dietitian.',
    Caution.pcos =>
      'PCOS can change how your body responds. The app adapts to your '
          'measured results; keep your clinician in the loop.',
    Caution.menopause =>
      'Hormonal changes can shift energy needs and water retention. The '
          'app adapts to your measured results.',
    Caution.underweight =>
      'Your weight is below the range where the app will plan a calorie '
          'deficit, so it holds you at maintenance. If you are not eating '
          'enough, or you are losing weight without trying, talk to a clinician.',
    Caution.lowBodyWeight =>
      'Your weight is close to the low end of the healthy range, so the app '
          'only plans the gentlest pace of loss.',
    Caution.thyroidCondition =>
      'Thyroid conditions affect energy needs. The app adapts to your '
          'measured results; keep your treatment stable where you can.',
    Caution.insulinOrSulfonylurea =>
      'Insulin or sulfonylurea treatment can cause low blood sugar when you '
          'eat less. Talk to your care team before a deficit; until then, '
          'the app limits loss to the gentlest pace.',
    Caution.bariatricSurgery =>
      'After bariatric surgery, your surgical team should set your nutrition '
          'targets. The app will not issue coaching targets.',
    Caution.weightAffectingMedication =>
      'Some medications can change weight or water retention. Your trend may '
          'move for reasons other than food; keep your clinician informed.',
  };
}
