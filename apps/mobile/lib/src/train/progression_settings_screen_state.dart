import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../format/load_number.dart';
import '../format/parse_number.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_text_field.dart';
import '../ui/mm_text_field_kind.dart';
import 'progression_settings_screen.dart';

class ProgressionSettingsScreenState
    extends ConsumerState<ProgressionSettingsScreen> {
  final _low = TextEditingController();
  final _high = TextEditingController();
  final _step = TextEditingController();
  var _filled = false;

  @override
  void dispose() {
    _low.dispose();
    _high.dispose();
    _step.dispose();
    super.dispose();
  }

  /// What is wrong with what is typed, or null when it can be saved.
  String? _problem(int? low, int? high, double? step) {
    if (low == null || high == null) return 'Enter both ends of the range.';
    if (low < 1) return 'The fewest reps is at least 1.';
    if (high > ExerciseProgression.maxReps) {
      return 'The most reps is at most ${ExerciseProgression.maxReps}.';
    }
    if (low >= high) return 'The most reps has to be more than the fewest.';
    if (_step.text.trim().isNotEmpty && (step == null || step <= 0)) {
      return 'The load step is a number above zero, or left empty.';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final exercise = ref.watch(exercisesByIdProvider)[widget.exerciseId];
    final units =
        ref.watch(setupProvider).value?.unitSystem ?? UnitSystem.imperial;
    final fmt = Fmt(units);
    final saved = ref.watch(exerciseProgressionsProvider).value;
    final current = saved?[widget.exerciseId];
    final (defaultLow, defaultHigh) = defaultRepRange(exercise);
    final usualStep = defaultLoadStepKg(exercise: exercise, units: units);
    // Filled once what is saved has loaded, then left to the user.
    if (!_filled && saved != null) {
      _filled = true;
      _low.text = '${current?.repsLow ?? defaultLow}';
      _high.text = '${current?.repsHigh ?? defaultHigh}';
      final step = current?.loadStepKg;
      _step.text = step == null ? '' : loadNumber(fmt.weightFromKg(step));
    }
    final low = int.tryParse(_low.text.trim());
    final high = int.tryParse(_high.text.trim());
    final step = parseNumber(_step.text);
    final problem = _problem(low, high, step);
    final writer = ref.read(exerciseProgressionWriterProvider);
    final text = Theme.of(context).textTheme;

    return Scaffold(
      appBar: MmAppBar(title: exercise?.name ?? 'Suggestions'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          Text(
            'A suggestion adds reps within this range until every set '
            'reaches the top, then adds one load step and goes back to the '
            'bottom. These are yours to set; no range is the right one.',
            style: text.bodyMedium,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: MmTextField(
                  key: const ValueKey('progression-low'),
                  controller: _low,
                  label: 'Fewest reps',
                  kind: MmTextFieldKind.number,
                  onChanged: (_) => setState(() {}),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: MmTextField(
                  key: const ValueKey('progression-high'),
                  controller: _high,
                  label: 'Most reps',
                  kind: MmTextFieldKind.number,
                  onChanged: (_) => setState(() {}),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          MmTextField(
            key: const ValueKey('progression-step'),
            controller: _step,
            label: 'Load step',
            suffix: fmt.weightUnit,
            helper:
                'Leave empty for the usual step: '
                '${loadNumber(fmt.weightFromKg(usualStep))} ${fmt.weightUnit}.',
            kind: MmTextFieldKind.number,
            onChanged: (_) => setState(() {}),
          ),
          if (problem != null) ...[
            const SizedBox(height: 12),
            Text(
              problem,
              key: const ValueKey('progression-problem'),
              style: text.bodySmall?.copyWith(color: context.mm.danger),
            ),
          ],
          const SizedBox(height: 24),
          MmButton(
            key: const ValueKey('progression-save'),
            label: 'Save',
            expand: true,
            onPressed: problem != null
                ? null
                : () async {
                    await writer.saveExerciseProgression(
                      ExerciseProgression(
                        exerciseId: widget.exerciseId,
                        repsLow: low!,
                        repsHigh: high!,
                        loadStepKg: _step.text.trim().isEmpty
                            ? null
                            : fmt.weightToKg(step!),
                      ),
                    );
                    if (context.mounted) Navigator.of(context).pop();
                  },
          ),
          const SizedBox(height: 8),
          MmButton(
            key: const ValueKey('progression-defaults'),
            label: 'Use the defaults',
            kind: MmButtonKind.text,
            expand: true,
            onPressed: current == null
                ? null
                : () async {
                    await writer.clearExerciseProgression(widget.exerciseId);
                    if (context.mounted) Navigator.of(context).pop();
                  },
          ),
        ],
      ),
    );
  }
}
