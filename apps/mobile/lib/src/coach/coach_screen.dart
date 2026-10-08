import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format.dart';
import '../providers.dart';
import '../widgets.dart';
import '../repository_role_providers.dart';

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
              icon: Icons.medical_information_outlined,
              text: caution.message,
            ),
          ),
        InfoCard(
          title: 'Goal: ${setup.goalMode.label}',
          trailing: TextButton(
            onPressed: () => _changeGoal(context, ref, setup, snapshot),
            child: const Text('Change'),
          ),
          child: Text(setup.goalMode.blurb),
        ),
        if (current != null)
          InfoCard(
            title: 'Daily targets',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  Fmt.kcal(current.targets.kcal),
                  style: text.headlineMedium,
                ),
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
                    child: Notice(icon: Icons.info_outline, text: flag.message),
                  ),
              ],
            ),
          ),
        InfoCard(
          title: 'Your metabolism',
          child: _Metabolism(
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

class _Metabolism extends StatelessWidget {
  const _Metabolism({required this.snapshot, required this.calibrating});

  final CoachSnapshot snapshot;
  final bool calibrating;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final tdee = snapshot.tdee;
    final measured = tdee.status == TdeeStatus.updated;
    const estimator = TdeeEstimator();
    final needDays = estimator.minIntakeDays - tdee.usableIntakeDays;
    final needWeighIns = estimator.minWeighIns - tdee.weighIns;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${Fmt.whole(tdee.kcal)} ± ${Fmt.whole(tdee.sigmaKcal)} kcal / day',
          style: text.headlineSmall,
        ),
        const SizedBox(height: 4),
        Text(
          measured
              ? 'Measured from your logged food and weight trend.'
              : 'Starting estimate from your height, weight, age, and sex. '
                    'It gets replaced by a measurement of your body.',
          style: text.bodyMedium,
        ),
        const SizedBox(height: 12),
        if (measured) ...[
          StatRow('Logged days used', '${tdee.usableIntakeDays}'),
          StatRow('Weigh-ins used', '${tdee.weighIns}'),
          if (tdee.excludedPartialDays > 0)
            StatRow('Partial days left out', '${tdee.excludedPartialDays}'),
          if (tdee.clampedToBounds)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Notice(
                icon: Icons.warning_amber_outlined,
                text:
                    'Your logs and weight trend don’t add up to a plausible '
                    'number, which usually means food is going unlogged. '
                    'The estimate is being held at a safe limit.',
              ),
            ),
        ] else if (tdee.settlingUntil case final settlingUntil?)
          Notice(
            icon: Icons.hourglass_bottom,
            text:
                'Waiting for early water changes to settle. When how much '
                'you eat changes, the scale moves a few pounds that are not '
                'fat. Your measurement will use the days after '
                '${Fmt.longDate(settlingUntil)}, and needs two weeks of them.',
          )
        else
          Notice(
            icon: Icons.hourglass_bottom,
            text:
                'Needs ${[if (needDays > 0) '$needDays more fully logged day${needDays == 1 ? '' : 's'}', if (needWeighIns > 0) '$needWeighIns more weigh-in${needWeighIns == 1 ? '' : 's'}', if (needDays <= 0 && needWeighIns <= 0) calibrating ? 'two full weeks of data' : 'a little more consistent data'].join(' and ')} '
                'before your first measurement.',
          ),
      ],
    );
  }
}

extension on Caution {
  String get message => switch (this) {
    Caution.pregnancy =>
      'Pregnancy: the app holds you at maintenance and will not prescribe '
          'a deficit. Follow your clinician’s guidance on intake.',
    Caution.breastfeeding =>
      'Breastfeeding: targets include extra energy for milk production '
          'and the app will not prescribe a deficit.',
    Caution.eatingDisorderHistory =>
      'Deficit modes are switched off. If food or weight tracking starts '
          'to feel distressing, stop and talk to your care team.',
    Caution.chronicKidneyDisease =>
      'Kidney disease: protein is capped low. Confirm your protein and '
          'energy targets with your nephrologist or dietitian.',
    Caution.pcos =>
      'PCOS can change how your body responds. The app adapts to your '
          'measured results; keep your clinician in the loop.',
    Caution.menopause =>
      'Hormonal changes can shift energy needs and water retention. The '
          'app adapts to your measured results.',
    Caution.thyroidCondition =>
      'Thyroid conditions affect energy needs. The app adapts to your '
          'measured results; keep your treatment stable where you can.',
  };
}

extension on TargetFlag {
  String get message => switch (this) {
    TargetFlag.flooredAtSafetyMinimum =>
      'Your calories are at the lowest level the app will set. Going '
          'lower risks your health and your muscle.',
    TargetFlag.rateLimited =>
      'This week’s change was limited to a small step. Targets move '
          'gradually so one odd week can’t swing them.',
    TargetFlag.dietBreak =>
      'You’ve been in a deficit for 16 weeks. This is a maintenance '
          'break to recover before continuing.',
    TargetFlag.modeNotAllowed =>
      'Your chosen goal isn’t available with your health check, so the '
          'app is holding you at maintenance.',
    TargetFlag.proteinCapped =>
      'Protein is capped because of your health check.',
  };
}
