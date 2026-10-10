import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mm_domain/mm_domain.dart';

import '../onboarding/onboarding_screen.dart';
import '../providers.dart';
import '../ui/mm_spinner.dart';
import '../ui/mm_button.dart';
import '../ui/notice.dart';
import '../ui/notice_kind.dart';
import '../theme/theme_chooser_screen.dart';
import 'adults_only_screen.dart';
import 'health_recheck_dismissal_provider.dart';
import 'health_recheck_screen.dart';
import 'home_shell.dart';
import 'welcome_back_screen.dart';

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
        final theme = ref.watch(themePreferenceProvider);
        if (theme.hasError) {
          return Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Notice(
                      kind: NoticeKind.caution,
                      text: 'Could not load your theme preference.',
                    ),
                    const SizedBox(height: 16),
                    MmButton(
                      label: 'Try again',
                      onPressed: () => ref.invalidate(themePreferenceProvider),
                    ),
                  ],
                ),
              ),
            ),
          );
        }
        if (theme.isLoading) {
          return const Scaffold(body: Center(child: MmSpinner()));
        }
        if (value == null && theme.value == ThemePreference.unselected) {
          return const ThemeChooserScreen();
        }
        if (value == null) return const OnboardingScreen();
        final today = ref.watch(todayProvider);
        final blocked = CoachingPolicy.derive(
          profile: value.profile,
          screening: value.screening,
          today: today,
        ).blocked;
        if (blocked) return const AdultsOnlyScreen();
        if (ref.watch(resumeDueProvider)) {
          return const WelcomeBackScreen(resuming: true);
        }
        if (ref.watch(welcomeBackDueProvider)) return const WelcomeBackScreen();
        if (value.healthCheckDueOn(today) &&
            !ref.watch(healthRecheckDismissalProvider)) {
          return HealthRecheckScreen(allowSkip: value.healthCheckSkipCount < 2);
        }
        return const HomeShell();
      },
    );
  }
}
