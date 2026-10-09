import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../onboarding/health_step.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import 'health_recheck_dismissal_provider.dart';
import 'health_recheck_screen.dart';

class HealthRecheckScreenState extends ConsumerState<HealthRecheckScreen> {
  ScreeningAnswers? _answers;

  @override
  Widget build(BuildContext context) {
    final setup = ref.watch(setupProvider).value;
    if (setup == null) return const Scaffold();
    final screening = _answers ?? setup.screening;
    final today = ref.watch(todayProvider);
    return Scaffold(
      appBar: const MmAppBar(title: 'Health check'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Has anything changed since your last health check? '
            'Your answers help keep your coaching safe.',
          ),
          const SizedBox(height: 12),
          HealthStep(
            screening: screening,
            female: setup.profile.sex == BiologicalSex.female,
            onChanged: (answers) => setState(() => _answers = answers),
          ),
          const SizedBox(height: 20),
          MmButton(
            label: 'Confirm answers',
            expand: true,
            onPressed: () async {
              final current = ref.read(setupProvider).value;
              if (current == null) return;
              final answers = _answers ?? current.screening;
              final policy = CoachingPolicy.derive(
                profile: current.profile,
                screening: answers,
                today: today,
              );
              final pending = widget.pendingGoal;
              final selectedGoal = pending ?? current.goalMode;
              final goal = policy.allowedModes.contains(selectedGoal)
                  ? selectedGoal
                  : GoalMode.maintenance;
              await ref
                  .read(setupWriterProvider)
                  .saveSetup(
                    current.copyWith(
                      screening: answers,
                      profileRevision:
                          current.profileRevision +
                          (answers == current.screening ? 0 : 1),
                      goalMode: goal,
                      healthCheckConfirmedOn: () => today,
                      healthCheckSkipCount: 0,
                    ),
                  );
              if (context.mounted) Navigator.of(context).maybePop(true);
            },
          ),
          if (widget.allowSkip) ...[
            const SizedBox(height: 8),
            MmButton(
              label: setup.healthCheckSkipCount == 0
                  ? 'Not now'
                  : 'Skip again and pause deficit coaching',
              kind: MmButtonKind.text,
              expand: true,
              onPressed: () async {
                final current = ref.read(setupProvider).value;
                if (current == null) return;
                final answers = _answers ?? current.screening;
                final policy = CoachingPolicy.derive(
                  profile: current.profile,
                  screening: answers,
                  today: today,
                );
                final skips = current.healthCheckSkipCount + 1;
                final pausesDeficit =
                    !policy.allowedModes.contains(current.goalMode) ||
                    (skips >= 2 &&
                        (current.goalMode == GoalMode.fatLoss ||
                            current.goalMode == GoalMode.recomp));
                await ref
                    .read(setupWriterProvider)
                    .saveSetup(
                      current.copyWith(
                        screening: answers,
                        profileRevision:
                            current.profileRevision +
                            (answers == current.screening ? 0 : 1),
                        goalMode: pausesDeficit
                            ? GoalMode.maintenance
                            : current.goalMode,
                        healthCheckSkipCount: skips,
                      ),
                    );
                ref
                    .read(healthRecheckDismissalProvider.notifier)
                    .dismissForThisLaunch();
                if (context.mounted) Navigator.of(context).maybePop(false);
              },
            ),
          ],
        ],
      ),
    );
  }
}
