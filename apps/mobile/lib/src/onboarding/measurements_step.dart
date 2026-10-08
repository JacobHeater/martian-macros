import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/mm_text_field.dart';
import '../ui/mm_text_field_kind.dart';
import '../ui/section_label.dart';

/// Step 2: units, height and current weight.
class MeasurementsStep extends StatelessWidget {
  const MeasurementsStep({
    required this.units,
    required this.feet,
    required this.inches,
    required this.cm,
    required this.weight,
    required this.onUnits,
    required this.onChanged,
    super.key,
  });

  final UnitSystem units;
  final TextEditingController feet;
  final TextEditingController inches;
  final TextEditingController cm;
  final TextEditingController weight;
  final ValueChanged<UnitSystem> onUnits;

  /// Called when any field changes, so the parent re-reads the numbers.
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final fmt = Fmt(units);

    Widget field(TextEditingController c, String label, String key) =>
        MmTextField(
          key: ValueKey('onboarding-$key'),
          controller: c,
          label: label,
          kind: MmTextFieldKind.number,
          onChanged: (_) => onChanged(),
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Your measurements', style: theme.textTheme.headlineSmall),
        const SizedBox(height: 16),
        MmSegmented<UnitSystem>(
          segments: const [
            MmSegment(UnitSystem.imperial, 'lb / ft'),
            MmSegment(UnitSystem.metric, 'kg / cm'),
          ],
          selected: {units},
          onChanged: (s) => onUnits(s.first),
        ),
        const SizedBox(height: 24),
        const SectionLabel('Height'),
        if (fmt.imperial)
          Row(
            children: [
              Expanded(child: field(feet, 'Feet', 'feet')),
              const SizedBox(width: 12),
              Expanded(child: field(inches, 'Inches', 'inches')),
            ],
          )
        else
          field(cm, 'Centimeters', 'cm'),
        const SizedBox(height: 24),
        const SectionLabel('Current weight'),
        field(weight, fmt.weightUnit, 'weight'),
        const SizedBox(height: 8),
        Text(
          'This becomes your first weigh-in.',
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
  }
}
