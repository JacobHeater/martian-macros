import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../format/training_status_label.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/group_header.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_list_row.dart';
import '../ui/mm_menu_button.dart';
import '../ui/mm_menu_item.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/mm_slider.dart';
import '../ui/mm_switch_row.dart';
import '../ui/show_mm_confirm.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final setup = ref.watch(setupProvider).value;
    if (setup == null) return const Scaffold();
    final setupWriter = ref.read(setupWriterProvider);
    final today = ref.watch(todayProvider);
    final profile = setup.profile;
    final fmt = Fmt(setup.unitSystem);
    final height = fmt.imperial
        ? '${Units.cmToInches(profile.heightCm) ~/ 12}′ '
              '${(Units.cmToInches(profile.heightCm) % 12).round()}″'
        : '${profile.heightCm.round()} cm';

    return Scaffold(
      appBar: const MmAppBar(title: 'Settings'),
      body: ListView(
        children: [
          const GroupHeader('Units'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: MmSegmented<UnitSystem>(
              segments: const [
                MmSegment(UnitSystem.imperial, 'lb / in'),
                MmSegment(UnitSystem.metric, 'kg / cm'),
              ],
              selected: {setup.unitSystem},
              onChanged: (s) =>
                  setupWriter.saveSetup(setup.copyWith(unitSystem: s.first)),
            ),
          ),
          const GroupHeader('Training'),
          MmListRow(
            title: 'Experience',
            subtitle: setup.trainingStatus.label,
            trailing: MmMenuButton<TrainingStatus>(
              icon: Icons.edit_outlined,
              onSelected: (s) =>
                  setupWriter.saveSetup(setup.copyWith(trainingStatus: s)),
              items: [
                for (final s in TrainingStatus.values) MmMenuItem(s, s.label),
              ],
            ),
          ),
          MmListRow(
            title: 'Training days per week: ${setup.trainingDaysPerWeek}',
            detail: MmSlider(
              value: setup.trainingDaysPerWeek.toDouble(),
              max: 7,
              divisions: 7,
              onChanged: (v) => setupWriter.saveSetup(
                setup.copyWith(trainingDaysPerWeek: v.round()),
              ),
            ),
          ),
          const GroupHeader('Body fat estimate'),
          MmSwitchRow(
            title: setup.bodyFatPercent == null
                ? 'Let the app estimate'
                : 'About ${setup.bodyFatPercent!.round()}%',
            subtitle: 'Enter one only if you have a recent measurement.',
            value: setup.bodyFatPercent != null,
            onChanged: (on) => setupWriter.saveSetup(
              setup.copyWith(bodyFatPercent: () => on ? 25 : null),
            ),
          ),
          if (setup.bodyFatPercent != null)
            MmSlider(
              value: setup.bodyFatPercent!.clamp(5, 55),
              min: 5,
              max: 55,
              divisions: 50,
              label: '${setup.bodyFatPercent!.round()}%',
              onChanged: (v) => setupWriter.saveSetup(
                setup.copyWith(bodyFatPercent: () => v.roundToDouble()),
              ),
            ),
          const GroupHeader('Profile'),
          MmListRow(
            title: 'Biological sex',
            trailing: Text(
              profile.sex == BiologicalSex.male ? 'Male' : 'Female',
            ),
          ),
          MmListRow(title: 'Age', trailing: Text('${profile.ageOn(today)}')),
          MmListRow(title: 'Height', trailing: Text(height)),
          const GroupHeader('Data'),
          const MmListRow(
            leadingIcon: Icons.lock_outline,
            title: 'Stored only on this device',
            subtitle: 'Nothing is uploaded. Encrypted backup is coming.',
          ),
          MmListRow(
            leadingIcon: Icons.delete_forever_outlined,
            danger: true,
            title: 'Erase all data and start over',
            onTap: () => _confirmErase(context, ref),
          ),
          const SizedBox(height: 24),
          Center(
            child: Text(
              'Martian Macros · $appEnv',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Future<void> _confirmErase(BuildContext context, WidgetRef ref) async {
    final confirmed = await showMmConfirm(
      context,
      title: 'Erase everything?',
      message:
          'This permanently deletes your profile, food log, weigh-ins, and '
          'targets from this device. It cannot be undone.',
      confirmLabel: 'Erase',
    );
    if (!confirmed || !context.mounted) return;
    Navigator.of(context).pop();
    await ref.read(dataEraserProvider).eraseAll();
  }
}
