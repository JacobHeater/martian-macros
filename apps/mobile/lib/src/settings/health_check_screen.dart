import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../onboarding/health_step.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/mm_app_bar.dart';

/// The health check, revisited. Every change saves at once and issues new
/// targets, because a health change can rule a goal out (MM-83).
class HealthCheckScreen extends ConsumerWidget {
  const HealthCheckScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final setup = ref.watch(setupProvider).value;
    if (setup == null) return const Scaffold();
    return Scaffold(
      appBar: const MmAppBar(title: 'Health check'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: HealthStep(
          screening: setup.screening,
          female: setup.profile.sex == BiologicalSex.female,
          onChanged: (answers) => ref
              .read(setupWriterProvider)
              .saveSetup(
                setup.copyWith(
                  screening: answers,
                  profileRevision: setup.profileRevision + 1,
                ),
              ),
        ),
      ),
    );
  }
}
