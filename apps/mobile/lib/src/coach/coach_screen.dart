import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../format/goal_mode_label.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/choice_card.dart';
import '../ui/info_card.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/notice.dart';
import '../ui/notice_kind.dart';
import '../ui/stat_row.dart';
import 'caution_message.dart';
import 'metabolism_summary.dart';
import 'target_flag_message.dart';

/// What the engine believes, why, and what it will do next.
class CoachScreen extends ConsumerWidget {
  const CoachScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final setup = ref.watch(setupProvider).value;
    final snapshot = ref.watch(coachProvider);
    final current = ref.watch(currentTargetsProvider);
    if (setup == null || snapshot == null) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('Log a weigh-in to get started.'),
        ),
      );
    }
    final today = ref.watch(todayProvider);
    final fmt = Fmt(setup.unitSystem);
    final text = Theme.of(context).textTheme;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        for (final caution in snapshot.policy.cautions)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Notice(
              kind: NoticeKind.caution,
              icon: Icons.medical_information_outlined,
              text: caution.message,
            ),
          ),
        InfoCard(
          title: 'Goal: ${setup.goalMode.label}',
          trailing: MmButton(
            label: 'Change',
            kind: MmButtonKind.text,
            onPressed: () => _changeGoal(context, ref, setup, snapshot),
          ),
          child: Text(setup.goalMode.blurb),
        ),
        if (current != null)
          InfoCard(
            title: 'Daily targets',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(Fmt.kcal(current.targets.kcal), style: text.displaySmall),
                const SizedBox(height: 8),
                StatRow('Protein', Fmt.grams(current.targets.proteinG)),
                StatRow('Carbs', Fmt.grams(current.targets.carbsG)),
                StatRow('Fat', Fmt.grams(current.targets.fatG)),
                StatRow(
                  'Intended pace',
                  current.targets.weeklyRateFraction == 0
                      ? 'Hold weight'
                      : '${Fmt.percentPerWeek(current.targets.weeklyRateFraction)}'
                            ' (${fmt.weightDelta(current.targets.weeklyRateFraction * snapshot.trendWeightKg)})',
                ),
                StatRow(
                  'Next check-in',
                  Fmt.day(nextCheckIn(setup, current), today),
                ),
                for (final flag in current.targets.flags)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Notice(kind: NoticeKind.caution, text: flag.message),
                  ),
              ],
            ),
          ),
        InfoCard(
          title: 'Your metabolism',
          child: MetabolismSummary(
            snapshot: snapshot,
            calibrating: setup.onboardedOn.daysUntil(today) < calibrationDays,
          ),
        ),
        InfoCard(
          title: 'Body',
          child: Column(
            children: [
              StatRow('Trend weight', fmt.weight(snapshot.trendWeightKg)),
              StatRow(
                'Body fat',
                setup.bodyFatPercent != null
                    ? '~${snapshot.bodyFat.percent.round()}% (your estimate)'
                    : '${snapshot.bodyFat.lowerPercent.round()}–'
                          '${snapshot.bodyFat.upperPercent.round()}% '
                          '(rough estimate)',
              ),
              StatRow('Resting energy (BMR)', Fmt.kcal(snapshot.bmrKcal)),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _changeGoal(
    BuildContext context,
    WidgetRef ref,
    UserSetup setup,
    CoachSnapshot snapshot,
  ) async {
    final chosen = await showModalBottomSheet<GoalMode>(
      context: context,
      useSafeArea: true,
      isScrollControlled: true,
      builder: (context) => SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Choose a goal',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            for (final mode in GoalMode.values)
              if (snapshot.policy.allowedModes.contains(mode))
                ChoiceCard(
                  label: mode.label,
                  detail: mode.blurb,
                  selected: mode == setup.goalMode,
                  badge: mode == snapshot.recommendation.mode
                      ? 'Recommended'
                      : null,
                  onTap: () => Navigator.of(context).pop(mode),
                ),
          ],
        ),
      ),
    );
    if (chosen != null && chosen != setup.goalMode) {
      await ref
          .read(setupWriterProvider)
          .saveSetup(setup.copyWith(goalMode: chosen));
    }
  }
}
