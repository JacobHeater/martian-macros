import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../about/how_this_works_screen.dart';
import '../food_packs/food_database_screen.dart';
import '../format/daily_activity_label.dart';
import '../format/detail_level_label.dart';
import '../format/theme_preference_label.dart';
import '../format/training_status_label.dart';
import '../gallery/gallery_screen.dart';
import '../pause/pause_screen.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/group_header.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_list_group.dart';
import '../ui/mm_list_row.dart';
import '../ui/mm_menu_button.dart';
import '../ui/mm_menu_item.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/mm_slider.dart';
import '../ui/mm_switch_row.dart';
import '../ui/show_mm_confirm.dart';
import 'profile_section.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final setup = ref.watch(setupProvider).value;
    if (setup == null) return const Scaffold();
    final setupWriter = ref.read(setupWriterProvider);
    final env = ref.watch(appEnvProvider);
    return Scaffold(
      appBar: const MmAppBar(title: 'Settings'),
      body: ListView(
        children: [
          const GroupHeader('Appearance'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: MmSegmented<ThemePreference>(
              segments: [
                for (final p in ThemePreference.values) MmSegment(p, p.label),
              ],
              selected: {
                ref.watch(themePreferenceProvider).value ??
                    ThemePreference.system,
              },
              onChanged: (s) => ref
                  .read(preferencesWriterProvider)
                  .saveThemePreference(s.first),
            ),
          ),
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
          const GroupHeader('Activity and training'),
          MmListGroup(
            children: [
              MmListRow(
                title: 'Daily activity',
                subtitle: setup.dailyActivity.label,
                trailing: MmMenuButton<DailyActivity>(
                  icon: Icons.edit_outlined,
                  onSelected: (a) =>
                      setupWriter.saveSetup(setup.copyWith(dailyActivity: a)),
                  items: [
                    for (final a in DailyActivity.values)
                      MmMenuItem(a, a.label),
                  ],
                ),
              ),
              MmListRow(
                title: 'Experience',
                subtitle: setup.trainingStatus.label,
                trailing: MmMenuButton<TrainingStatus>(
                  icon: Icons.edit_outlined,
                  onSelected: (s) =>
                      setupWriter.saveSetup(setup.copyWith(trainingStatus: s)),
                  items: [
                    for (final s in TrainingStatus.values)
                      MmMenuItem(s, s.label),
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
            ],
          ),
          const GroupHeader('Body fat estimate'),
          MmListGroup(
            children: [
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
            ],
          ),
          const ProfileSection(),
          const GroupHeader('Nutrition detail'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MmSegmented<DetailLevel>(
                  segments: [
                    for (final l in DetailLevel.values) MmSegment(l, l.label),
                  ],
                  selected: {
                    ref.watch(detailLevelProvider).value ??
                        DetailLevel.standard,
                  },
                  onChanged: (s) => ref
                      .read(detailLevelWriterProvider)
                      .saveDetailLevel(s.first),
                ),
                const SizedBox(height: 8),
                Text(
                  '${(ref.watch(detailLevelProvider).value ?? DetailLevel.standard).description} '
                  'Changes what is shown, never what is stored.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const GroupHeader('Food logging'),
          MmListGroup(
            children: [
              MmSwitchRow(
                title: 'Easy-to-miss reminder',
                subtitle:
                    'A line under a completed day that names things people '
                    'often forget to log.',
                value: ref.watch(easyToMissProvider).value?.enabled ?? true,
                onChanged: (on) => ref
                    .read(easyToMissWriterProvider)
                    .saveEasyToMissEnabled(on),
              ),
            ],
          ),
          const GroupHeader('Coaching'),
          MmListGroup(
            children: [
              MmListRow(
                key: const ValueKey('settings-pause'),
                leadingIcon: Icons.pause_circle_outline,
                title: 'Pause',
                subtitle: 'For a holiday, an illness or an injury.',
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => const PauseScreen()),
                ),
              ),
            ],
          ),
          const GroupHeader('About'),
          MmListGroup(
            children: [
              MmListRow(
                leadingIcon: Icons.menu_book_outlined,
                title: 'How this works',
                subtitle: 'Where each number comes from, and how sure we are.',
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const HowThisWorksScreen(),
                  ),
                ),
              ),
            ],
          ),
          const GroupHeader('Data'),
          MmListGroup(
            children: [
              MmListRow(
                leadingIcon: Icons.download_outlined,
                title: 'Food database',
                subtitle:
                    'Optional download for barcode scanning. The only thing '
                    'this app ever fetches.',
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const FoodDatabaseScreen(),
                  ),
                ),
              ),
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
            ],
          ),
          if (env == 'dev') ...[
            const GroupHeader('Development'),
            MmListGroup(
              children: [
                MmListRow(
                  leadingIcon: Icons.palette_outlined,
                  title: 'Component gallery',
                  subtitle: 'Every color and component, light and dark.',
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const GalleryScreen(),
                    ),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 24),
          Center(
            child: Text(
              'Martian Macros · $env',
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
