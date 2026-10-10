import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../providers.dart';
import '../repository_providers.dart';
import '../reminders/reminder_host.dart';
import '../theme/mm_theme.dart';
import '../ui/demo_notice.dart';
import 'app_root.dart';
import 'check_in_host.dart';
import 'download_status_host.dart';

class MartianMacrosApp extends ConsumerWidget {
  const MartianMacrosApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => MaterialApp(
    title: demoConfiguration.isDemo ? 'Martian Macros DEMO' : 'Martian Macros',
    debugShowCheckedModeBanner: false,
    theme: mmTheme(Brightness.light),
    darkTheme: mmTheme(Brightness.dark),
    themeMode: switch (ref.watch(themePreferenceProvider).value) {
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
