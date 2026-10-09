import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../ui/choice_card.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/notice.dart';
import '../ui/section_label.dart';

/// Step 1: biological sex and date of birth.
class AboutYouStep extends StatelessWidget {
  const AboutYouStep({
    required this.sex,
    required this.birthDate,
    required this.isMinor,
    required this.onSex,
    required this.onPickBirthDate,
    super.key,
  });

  final BiologicalSex? sex;
  final CalendarDate? birthDate;
  final bool isMinor;
  final ValueChanged<BiologicalSex> onSex;
  final VoidCallback onPickBirthDate;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionLabel('Biological sex'),
        const Text(
          'Energy needs, safe body-fat ranges, and safety limits differ '
          'between males and females.',
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            for (final option in BiologicalSex.values) ...[
              Expanded(
                child: ChoiceCard(
                  label: option == BiologicalSex.male ? 'Male' : 'Female',
                  selected: sex == option,
                  onTap: () => onSex(option),
                ),
              ),
              if (option != BiologicalSex.values.last)
                const SizedBox(width: 12),
            ],
          ],
        ),
        const SizedBox(height: 28),
        const SectionLabel('Date of birth'),
        MmButton(
          label: birthDate == null ? 'Choose date' : Fmt.longDate(birthDate!),
          icon: Icons.cake_outlined,
          kind: MmButtonKind.secondary,
          onPressed: onPickBirthDate,
        ),
        if (isMinor) ...[
          const SizedBox(height: 16),
          const Notice(
            icon: Icons.block,
            text:
                'Martian Macros is for adults 18 and over. Growing bodies '
                'need different guidance than this app provides.',
          ),
        ],
      ],
    );
  }
}
