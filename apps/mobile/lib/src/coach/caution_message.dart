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
    Caution.thyroidCondition =>
      'Thyroid conditions affect energy needs. The app adapts to your '
          'measured results; keep your treatment stable where you can.',
  };
}
