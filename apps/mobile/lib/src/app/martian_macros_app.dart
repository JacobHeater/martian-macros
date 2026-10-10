import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../providers.dart';
import '../repository_providers.dart';
import '../reminders/reminder_host.dart';
import '../theme/mm_theme.dart';
import '../theme/theme_preview_provider.dart';
import '../ui/demo_notice.dart';
import 'app_root.dart';
import 'check_in_host.dart';
import 'download_status_host.dart';

class MartianMacrosApp extends ConsumerWidget {
  const MartianMacrosApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(themePreferenceProvider, (_, next) {
      if (next.hasValue && next.value != ThemePreference.unselected) {
        ref.read(themePreviewProvider.notifier).select(null);
      }
    });
    final preference =
        ref.watch(themePreviewProvider) ??
        ref.watch(themePreferenceProvider).value ??
        ThemePreference.system;
    final martian =
        preference == ThemePreference.martian ||
        preference == ThemePreference.unselected;
    return MaterialApp(
      title: demoConfiguration.isDemo
          ? 'Martian Macros DEMO'
          : 'Martian Macros',
      debugShowCheckedModeBanner: false,
      theme: martian
          ? mmTheme(Brightness.dark, martian: true)
          : mmTheme(Brightness.light),
      darkTheme: mmTheme(Brightness.dark),
      themeMode: switch (preference) {
        ThemePreference.martian ||
        ThemePreference.unselected => ThemeMode.light,
        ThemePreference.light => ThemeMode.light,
        ThemePreference.dark => ThemeMode.dark,
        _ => ThemeMode.system,
      },
      builder: (context, child) {
        final content = CheckInHost(
          child: ReminderHost(child: DownloadStatusHost(child: child!)),
        );
        return demoConfiguration.isDemo ? DemoNotice(child: content) : content;
      },
      home: const AppRoot(),
    );
  }
}
