import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../ui/mm_check_row.dart';

/// Step 4: the health check. Female-only questions appear only for females.
class HealthStep extends StatelessWidget {
  const HealthStep({
    required this.screening,
    required this.female,
    required this.onChanged,
    super.key,
  });

  final ScreeningAnswers screening;
  final bool female;
  final ValueChanged<ScreeningAnswers> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = screening;
    ScreeningAnswers copy({
      bool? pregnant,
      bool? breastfeeding,
      bool? eatingDisorderHistory,
      bool? chronicKidneyDisease,
      bool? androgenUse,
      bool? pcos,
      bool? menopause,
      bool? thyroidCondition,
    }) => ScreeningAnswers(
      pregnant: pregnant ?? s.pregnant,
      breastfeeding: breastfeeding ?? s.breastfeeding,
      eatingDisorderHistory: eatingDisorderHistory ?? s.eatingDisorderHistory,
      chronicKidneyDisease: chronicKidneyDisease ?? s.chronicKidneyDisease,
      androgenUse: androgenUse ?? s.androgenUse,
      pcos: pcos ?? s.pcos,
      menopause: menopause ?? s.menopause,
      thyroidCondition: thyroidCondition ?? s.thyroidCondition,
    );
    Widget item(
      String title,
      bool value,
      ScreeningAnswers Function(bool) set,
    ) => MmCheckRow(
      title: title,
      value: value,
      onChanged: (v) => onChanged(set(v)),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Health check', style: theme.textTheme.headlineSmall),
        const SizedBox(height: 8),
        const Text(
          'Tick anything that applies. These change what the app will '
          'recommend, and some switch off calorie deficits entirely.',
        ),
        const SizedBox(height: 8),
        if (female) ...[
          item('Pregnant', s.pregnant, (v) => copy(pregnant: v)),
          item('Breastfeeding', s.breastfeeding, (v) => copy(breastfeeding: v)),
          item('PCOS', s.pcos, (v) => copy(pcos: v)),
          item(
            'Perimenopause or menopause',
            s.menopause,
            (v) => copy(menopause: v),
          ),
        ],
        item(
          'History of an eating disorder',
          s.eatingDisorderHistory,
          (v) => copy(eatingDisorderHistory: v),
        ),
        item(
          'Chronic kidney disease',
          s.chronicKidneyDisease,
          (v) => copy(chronicKidneyDisease: v),
        ),
        item(
          'Thyroid condition',
          s.thyroidCondition,
          (v) => copy(thyroidCondition: v),
        ),
        item(
          'Testosterone therapy or anabolic steroids',
          s.androgenUse,
          (v) => copy(androgenUse: v),
        ),
        const SizedBox(height: 8),
        Text(
          'This app is not medical advice. Talk to your clinician before '
          'changing your diet if you have a medical condition.',
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
  }
}
