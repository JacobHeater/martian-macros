import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format.dart';
import '../providers.dart';
import '../repository_role_providers.dart';

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
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          const _Header('Units'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SegmentedButton<UnitSystem>(
              segments: const [
                ButtonSegment(
                  value: UnitSystem.imperial,
                  label: Text('lb / in'),
                ),
                ButtonSegment(value: UnitSystem.metric, label: Text('kg / cm')),
              ],
              selected: {setup.unitSystem},
              onSelectionChanged: (s) =>
                  setupWriter.saveSetup(setup.copyWith(unitSystem: s.first)),
            ),
          ),
          const _Header('Training'),
          ListTile(
            title: const Text('Experience'),
            subtitle: Text(setup.trainingStatus.label),
            trailing: PopupMenuButton<TrainingStatus>(
              icon: const Icon(Icons.edit_outlined),
              onSelected: (s) =>
                  setupWriter.saveSetup(setup.copyWith(trainingStatus: s)),
              itemBuilder: (_) => [
                for (final s in TrainingStatus.values)
                  PopupMenuItem(value: s, child: Text(s.label)),
              ],
            ),
          ),
          ListTile(
            title: Text('Training days per week: ${setup.trainingDaysPerWeek}'),
            subtitle: Slider(
              value: setup.trainingDaysPerWeek.toDouble(),
              max: 7,
              divisions: 7,
              onChanged: (v) => setupWriter.saveSetup(
                setup.copyWith(trainingDaysPerWeek: v.round()),
              ),
            ),
          ),
          const _Header('Body fat estimate'),
          SwitchListTile(
            title: Text(
              setup.bodyFatPercent == null
                  ? 'Let the app estimate'
                  : 'About ${setup.bodyFatPercent!.round()}%',
            ),
            subtitle: const Text(
              'Enter one only if you have a recent measurement.',
            ),
            value: setup.bodyFatPercent != null,
            onChanged: (on) => setupWriter.saveSetup(
              setup.copyWith(bodyFatPercent: () => on ? 25 : null),
            ),
          ),
          if (setup.bodyFatPercent != null)
            Slider(
              value: setup.bodyFatPercent!.clamp(5, 55),
              min: 5,
              max: 55,
              divisions: 50,
              label: '${setup.bodyFatPercent!.round()}%',
              onChanged: (v) => setupWriter.saveSetup(
                setup.copyWith(bodyFatPercent: () => v.roundToDouble()),
              ),
            ),
          const _Header('Profile'),
          ListTile(
            title: const Text('Biological sex'),
            trailing: Text(
              profile.sex == BiologicalSex.male ? 'Male' : 'Female',
            ),
          ),
          ListTile(
            title: const Text('Age'),
            trailing: Text('${profile.ageOn(today)}'),
          ),
          ListTile(title: const Text('Height'), trailing: Text(height)),
          const _Header('Data'),
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: const Text('Stored only on this device'),
            subtitle: const Text(
              'Nothing is uploaded. Encrypted backup is coming.',
            ),
          ),
          ListTile(
            leading: Icon(
              Icons.delete_forever_outlined,
              color: Theme.of(context).colorScheme.error,
            ),
            title: const Text('Erase all data and start over'),
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
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Erase everything?'),
        content: const Text(
          'This permanently deletes your profile, food log, weigh-ins, and '
          'targets from this device. It cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Erase'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    Navigator.of(context).pop();
    await ref.read(dataEraserProvider).eraseAll();
  }
}

class _Header extends StatelessWidget {
  const _Header(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
    child: Text(
      text,
      style: Theme.of(context).textTheme.titleSmall
          ?.copyWith(color: Theme.of(context).colorScheme.primary),
    ),
  );
}
