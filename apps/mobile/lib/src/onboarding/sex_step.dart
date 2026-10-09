import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../theme/mm_colors_context.dart';
import '../ui/choice_card.dart';

/// Step 1: biological sex. No default is chosen for the user.
class SexStep extends StatelessWidget {
  const SexStep({required this.sex, required this.onSex, super.key});

  final BiologicalSex? sex;
  final ValueChanged<BiologicalSex> onSex;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Biological sex', style: text.headlineMedium),
        const SizedBox(height: 8),
        Text(
          'Energy needs, safe body-fat ranges, and safety limits differ '
          'between males and females.',
          style: text.bodyMedium?.copyWith(color: context.mm.text2),
        ),
        const SizedBox(height: 24),
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
      ],
    );
  }
}
