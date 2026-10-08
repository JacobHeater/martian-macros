import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mm_domain/mm_domain.dart';

import '../onboarding/onboarding_screen.dart';
import '../providers.dart';
import '../ui/mm_spinner.dart';
import 'adults_only_screen.dart';
import 'home_shell.dart';

/// Routes to onboarding until setup exists, then to the main shell.
class AppRoot extends ConsumerWidget {
  const AppRoot({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final setup = ref.watch(setupProvider);
    return setup.when(
      loading: () => const Scaffold(body: Center(child: MmSpinner())),
      error: (error, _) => Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('Could not open your data.\n\n$error'),
          ),
        ),
      ),
      data: (value) {
        if (value == null) return const OnboardingScreen();
        final blocked = CoachingPolicy.derive(
          profile: value.profile,
          screening: value.screening,
          today: ref.watch(todayProvider),
        ).blocked;
        return blocked ? const AdultsOnlyScreen() : const HomeShell();
      },
    );
  }
}
