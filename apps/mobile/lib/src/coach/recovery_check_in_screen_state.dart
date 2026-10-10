import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/parse_number.dart';
import '../format/recovery_question_text.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_button.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/mm_text_field.dart';
import '../ui/mm_text_field_kind.dart';
import '../ui/section_label.dart';
import 'recovery_check_in_screen.dart';

class RecoveryCheckInScreenState extends ConsumerState<RecoveryCheckInScreen> {
  final _answers = <RecoveryQuestion, int>{};
  final _sleepHours = TextEditingController();

  @override
  void dispose() {
    _sleepHours.dispose();
    super.dispose();
  }

  /// Hours of sleep, when something sensible was typed.
  double? get _hours {
    final hours = parseNumber(_sleepHours.text);
    return hours == null || hours <= 0 || hours > 24 ? null : hours;
  }

  Future<void> _save() async {
    await ref
        .read(recoveryCheckInWriterProvider)
        .saveRecoveryCheckIn(
          RecoveryCheckIn(
            date: ref.read(todayProvider),
            hunger: _answers[RecoveryQuestion.hunger]!,
            energy: _answers[RecoveryQuestion.energy]!,
            sleep: _answers[RecoveryQuestion.sleep]!,
            training: _answers[RecoveryQuestion.training]!,
            mood: _answers[RecoveryQuestion.mood]!,
            sleepHours: _hours,
          ),
        );
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final complete = _answers.length == RecoveryQuestion.values.length;
    return Scaffold(
      appBar: const MmAppBar(title: 'This week'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          Text(
            'Five quick ones on how you are holding up. There are no right '
            'answers, and they never lower a target.',
            style: text.bodyLarge,
          ),
          for (final question in RecoveryQuestion.values) ...[
            const SizedBox(height: 24),
            SectionLabel(question.question),
            MmSegmented<int>(
              key: ValueKey('recovery-${question.name}'),
              compact: true,
              allowEmpty: true,
              segments: [
                for (
                  var value = RecoveryRule.lowest;
                  value <= RecoveryRule.highest;
                  value++
                )
                  MmSegment(value, '$value'),
              ],
              selected: {?_answers[question]},
              onChanged: (selection) => setState(() {
                if (selection.isEmpty) {
                  _answers.remove(question);
                } else {
                  _answers[question] = selection.first;
                }
              }),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  question.lowWord,
                  style: text.bodySmall?.copyWith(color: context.mm.text2),
                ),
                Text(
                  question.highWord,
                  style: text.bodySmall?.copyWith(color: context.mm.text2),
                ),
              ],
            ),
          ],
          const SizedBox(height: 24),
          const SectionLabel('Typical hours of sleep (optional)'),
          MmTextField(
            key: const ValueKey('recovery-sleep-hours'),
            controller: _sleepHours,
            kind: MmTextFieldKind.number,
            suffix: 'hours',
          ),
          const SizedBox(height: 24),
          MmButton(
            key: const ValueKey('recovery-save'),
            label: 'Save',
            expand: true,
            onPressed: complete ? _save : null,
          ),
        ],
      ),
    );
  }
}
