import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/notice.dart';

/// Step 2: date of birth. Under 18 stops here.
class BirthDateStep extends StatelessWidget {
  const BirthDateStep({
    required this.birthDate,
    required this.isMinor,
    required this.onPickBirthDate,
    super.key,
  });

  final CalendarDate? birthDate;
  final bool isMinor;
  final VoidCallback onPickBirthDate;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Date of birth', style: text.headlineMedium),
        const SizedBox(height: 8),
        Text(
          'Age changes energy needs and some safety limits.',
          style: text.bodyMedium?.copyWith(color: context.mm.text2),
        ),
        const SizedBox(height: 24),
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
