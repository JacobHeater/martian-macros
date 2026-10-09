import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/training_status_label.dart';
import '../ui/choice_card.dart';
import '../ui/mm_slider.dart';
import '../ui/mm_list_row.dart';
import '../ui/mm_switch_row.dart';
import '../ui/section_label.dart';

/// Step 3: training experience, days per week and optional body fat.
class TrainingStep extends StatelessWidget {
  const TrainingStep({
    required this.status,
    required this.trainingDays,
    required this.bodyFat,
    required this.creatineStartedOn,
    required this.onCreatine,
    required this.onPickCreatineStartDate,
    required this.onStatus,
    required this.onTrainingDays,
    required this.onBodyFatKnown,
    required this.onBodyFat,
    super.key,
  });

  final TrainingStatus status;
  final int trainingDays;

  /// The user's own estimate, or null if they do not know it.
  final double? bodyFat;
  final CalendarDate? creatineStartedOn;
  final ValueChanged<bool> onCreatine;
  final VoidCallback onPickCreatineStartDate;
  final ValueChanged<TrainingStatus> onStatus;
  final ValueChanged<int> onTrainingDays;
  final ValueChanged<bool> onBodyFatKnown;
  final ValueChanged<double> onBodyFat;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Training', style: theme.textTheme.headlineSmall),
        const SizedBox(height: 16),
        const SectionLabel('Resistance training experience'),
        for (final option in TrainingStatus.values)
          ChoiceCard(
            label: option.label,
            selected: status == option,
            dense: true,
            onTap: () => onStatus(option),
          ),
        const SizedBox(height: 20),
        SectionLabel('Training days per week: $trainingDays'),
        MmSlider(
          value: trainingDays.toDouble(),
          max: 7,
          divisions: 7,
          label: '$trainingDays',
          onChanged: (v) => onTrainingDays(v.round()),
        ),
        const SizedBox(height: 12),
        const SectionLabel('Body fat (optional)'),
        const Text(
          'If you have a recent estimate (DEXA, calipers, or a consistent '
          'scale), enter it. Otherwise leave it off and the app estimates.',
        ),
        MmSwitchRow(
          flush: true,
          title: bodyFat == null
              ? 'I don’t know'
              : 'About ${bodyFat!.round()}% body fat',
          value: bodyFat != null,
          onChanged: onBodyFatKnown,
        ),
        if (bodyFat != null)
          MmSlider(
            value: bodyFat!.clamp(5, 55),
            min: 5,
            max: 55,
            divisions: 50,
            label: '${bodyFat!.round()}%',
            onChanged: (v) => onBodyFat(v.roundToDouble()),
          ),
        const SizedBox(height: 12),
        const SectionLabel('Creatine'),
        MmSwitchRow(
          flush: true,
          title: 'I currently take creatine',
          value: creatineStartedOn != null,
          onChanged: onCreatine,
        ),
        if (creatineStartedOn != null)
          MmListRow(
            title: 'When did you start?',
            subtitle: creatineStartedOn.toString(),
            trailing: const Icon(Icons.calendar_today_outlined),
            onTap: onPickCreatineStartDate,
          ),
      ],
    );
  }
}
