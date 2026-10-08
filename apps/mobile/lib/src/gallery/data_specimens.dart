import 'package:flutter/material.dart';

import '../ui/day_stepper.dart';
import '../ui/macro_bar.dart';
import '../ui/macro_kind.dart';
import '../ui/mm_progress_bar.dart';
import '../ui/mm_spinner.dart';
import '../ui/number_entry_card.dart';

/// Progress, macro bars, the day stepper and the number-entry card.
class DataSpecimens extends StatelessWidget {
  const DataSpecimens({super.key});

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const MmProgressBar(value: 0.57),
      const SizedBox(height: 16),
      const Row(
        children: [
          Expanded(
            child: MacroBar(macro: MacroKind.protein, grams: 96, target: 180),
          ),
          SizedBox(width: 12),
          Expanded(
            child: MacroBar(macro: MacroKind.carbs, grams: 160, target: 260),
          ),
          SizedBox(width: 12),
          Expanded(
            child: MacroBar(macro: MacroKind.fat, grams: 38, target: 78),
          ),
        ],
      ),
      const SizedBox(height: 16),
      DayStepper(
        label: 'Yesterday',
        onPrevious: () {},
        onNext: () {},
        onLabelTap: () {},
      ),
      DayStepper(
        label: 'Today',
        onPrevious: () {},
        onNext: null,
        onLabelTap: null,
      ),
      NumberEntryCard(
        title: 'Today’s weigh-in',
        unit: 'lb',
        fieldKey: 'gallery',
        initial: '172.4',
        hint: 'First thing in the morning, after the bathroom.',
        onSave: (_) async {},
      ),
      const Center(child: MmSpinner()),
    ],
  );
}
