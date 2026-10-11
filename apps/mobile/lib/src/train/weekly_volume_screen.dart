import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../format/fmt.dart';
import '../providers.dart';
import '../ui/info_card.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_button.dart';
import '../ui/mm_spinner.dart';
import '../ui/muscle_volume_row.dart';
import 'weekly_volume_provider.dart';

class WeeklyVolumeScreen extends ConsumerWidget {
  const WeeklyVolumeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
    appBar: const MmAppBar(title: 'Weekly training volume'),
    body: ref
        .watch(weeklyVolumeProvider)
        .when(
          loading: () => const Center(child: MmSpinner()),
          error: (_, _) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              InfoCard(
                title: 'Volume unavailable',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Could not read training history. Your sets are unchanged.',
                    ),
                    const SizedBox(height: 12),
                    MmButton(
                      label: 'Retry volume',
                      onPressed: () {
                        ref.invalidate(workoutsProvider);
                        ref.invalidate(customExercisesProvider);
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
          data: (volume) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              InfoCard(
                title: 'Last seven days',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${Fmt.longDate(volume.today.addDays(-6))} – '
                      '${Fmt.longDate(volume.today)}',
                    ),
                    Text(
                      'Previous: ${Fmt.longDate(volume.today.addDays(-13))} – '
                      '${Fmt.longDate(volume.today.addDays(-7))}',
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Finished workouts only. Hard sets have RIR 0–4 or '
                      'no RIR recorded. Primary muscles count fully; secondary '
                      'muscles count half.',
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'The shaded 10–20 range is a typical weekly reference, '
                      'not a rule or a target for every muscle. The thin marker '
                      'shows your previous seven days.',
                    ),
                    if (volume.unmappedCurrentSets +
                            volume.unmappedPreviousSets >
                        0) ...[
                      const SizedBox(height: 12),
                      Text(
                        'Missing exercise mappings: ${volume.unmappedCurrentSets} '
                        'current and ${volume.unmappedPreviousSets} previous hard '
                        'sets omitted. Deleted exercise details are not guessed.',
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 12),
              InfoCard(
                title: 'Hard sets by muscle group',
                child: Column(
                  children: [
                    for (final group in volume.groups)
                      MuscleVolumeRow(
                        key: ValueKey('volume-${group.group.name}'),
                        volume: group,
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
  );
}
