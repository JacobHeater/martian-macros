import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../format/coach_confidence_text.dart';
import '../format/goal_mode_label.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/choice_card.dart';
import '../theme/mm_colors_context.dart';
import '../ui/info_card.dart';
import '../ui/macro_figure.dart';
import '../ui/macro_kind.dart';
import '../ui/mm_disclosure.dart';
import '../ui/mm_hero_surface.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/notice.dart';
import '../ui/notice_kind.dart';
import '../ui/stat_row.dart';
import 'adherence_card.dart';
import 'caution_message.dart';
import '../app/health_recheck_screen.dart';
import 'last_change_card.dart';
import 'metabolism_summary.dart';
import 'stall_card.dart';
import 'target_flag_message.dart';
import '../pause/pause_banner.dart';
import 'under_eating_notice.dart';

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
        const PauseBanner(),
        const UnderEatingNotice(),
        if (current != null)
          MmHeroSurface(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Daily targets',
                  style: text.labelMedium?.copyWith(color: context.mm.text2),
                ),
                const SizedBox(height: 4),
                Text(Fmt.whole(current.targets.kcal), style: text.displayLarge),
                Text(
                  'kcal a day',
                  style: text.bodyMedium?.copyWith(color: context.mm.text2),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: MacroFigure(
                        macro: MacroKind.protein,
                        value: Fmt.grams(current.targets.proteinG),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: MacroFigure(
                        macro: MacroKind.carbs,
                        value: Fmt.grams(current.targets.carbsG),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: MacroFigure(
                        macro: MacroKind.fat,
                        value: Fmt.grams(current.targets.fatG),
                      ),
                    ),
                  ],
                ),
                if (current.targets.proteinMinimumG case final minimum?)
                  StatRow('Protein minimum', Fmt.grams(minimum)),
                const SizedBox(height: 16),
                Divider(color: context.mm.outline),
                StatRow(
                  'Intended pace',
                  current.targets.weeklyRateFraction == 0
                      ? 'Hold weight'
                      : Fmt.percentPerWeek(current.targets.weeklyRateFraction),
                ),
                if (_paceDetail(
                      snapshot,
                      current.targets.weeklyRateFraction,
                      fmt,
                    )
                    case final detail?)
                  Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      detail,
                      style: text.bodySmall?.copyWith(color: context.mm.text2),
                    ),
                  ),
                StatRow(
                  'Next check-in',
                  Fmt.day(nextCheckIn(setup, current), today),
                ),
                StatRow(
                  'Coach confidence',
                  confidenceLabel(snapshot.confidence.level),
                ),
                for (final flag in current.targets.flags)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Notice(kind: NoticeKind.caution, text: flag.message),
                  ),
              ],
            ),
          ),
        LastChangeCard(
          history: ref.watch(targetsHistoryProvider).value ?? const [],
          today: today,
          holdNote: _holdNote(setup, snapshot, today),
        ),
        const StallCard(),
        const AdherenceCard(),
        InfoCard(
          title: 'Your metabolism',
          child: MetabolismSummary(
            snapshot: snapshot,
            calibrating: setup.onboardedOn.daysUntil(today) < calibrationDays,
          ),
        ),
        InfoCard(
          title:
              'Coach confidence · '
              '${confidenceLabel(snapshot.confidence.level)}',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (snapshot.confidence.level == ConfidenceLevel.learning)
                const Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: Text('Targets are held while the coach learns.'),
                ),
              const SizedBox(height: 8),
              Text(
                confidenceNextStepText(snapshot.confidence),
                style: text.bodyMedium,
              ),
              MmDisclosure(
                title: 'What this rests on',
                children: [
                  StatRow(
                    'Estimate',
                    confidenceLabel(snapshot.confidence.estimate),
                  ),
                  StatRow(
                    'Food log',
                    confidenceLabel(snapshot.confidence.foodLog),
                  ),
                  StatRow(
                    'Weigh-ins',
                    confidenceLabel(snapshot.confidence.weighIns),
                  ),
                  StatRow(
                    'Stability',
                    confidenceLabel(snapshot.confidence.stability),
                  ),
                ],
              ),
            ],
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

  /// The pace in weight, worded as approximate until the coach is sure.
  String? _paceDetail(CoachSnapshot snapshot, double rate, Fmt fmt) {
    if (rate == 0) return null;
    final change = '${fmt.weightDelta(rate * snapshot.trendWeightKg)} a week';
    return snapshot.confidence.level == ConfidenceLevel.good
        ? change
        : 'About $change so far';
  }

  /// After calibration, while the estimate is held for lack of data, targets
  /// stay as they are; say so, and what is needed.
  String? _holdNote(
    UserSetup setup,
    CoachSnapshot snapshot,
    CalendarDate today,
  ) {
    if (snapshot.creatineReductionPausedOn(today)) {
      return 'Calorie reductions are paused while your creatine change '
          'settles. Safety corrections still apply.';
    }
    if (setup.onboardedOn.daysUntil(today) < calibrationDays ||
        snapshot.tdee.status != TdeeStatus.held) {
      return null;
    }
    const estimator = TdeeEstimator();
    final days = estimator.minIntakeDays - snapshot.tdee.usableIntakeDays;
    final weighIns = estimator.minWeighIns - snapshot.tdee.weighIns;
    final needs = [
      if (days > 0) '$days more fully logged day${days == 1 ? '' : 's'}',
      if (weighIns > 0) '$weighIns more weigh-in${weighIns == 1 ? '' : 's'}',
    ];
    return 'Targets are unchanged because there is not enough data yet.'
        '${needs.isEmpty ? '' : ' Needs ${needs.join(' and ')}.'}';
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
    if (!context.mounted) return;
    if (chosen != null && chosen != setup.goalMode) {
      if (chosen == GoalMode.fatLoss || chosen == GoalMode.recomp) {
        await Navigator.of(context).push<bool>(
          MaterialPageRoute<bool>(
            builder: (_) => HealthRecheckScreen(
              pendingGoal: chosen,
              allowSkip: setup.healthCheckSkipCount < 2,
            ),
          ),
        );
        return;
      }
      await ref
          .read(setupWriterProvider)
          .saveSetup(setup.copyWith(goalMode: chosen));
    }
  }
}
