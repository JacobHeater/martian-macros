import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../providers.dart';
import '../reminders/reminder_host.dart';
import '../theme/mm_theme.dart';
import 'app_root.dart';
import 'check_in_host.dart';
import 'download_status_host.dart';

class MartianMacrosApp extends ConsumerWidget {
  const MartianMacrosApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => MaterialApp(
    title: 'Martian Macros',
    debugShowCheckedModeBanner: false,
    theme: mmTheme(Brightness.light),
    darkTheme: mmTheme(Brightness.dark),
    themeMode: switch (ref.watch(themePreferenceProvider).value) {
      ThemePreference.light => ThemeMode.light,
      ThemePreference.dark => ThemeMode.dark,
      _ => ThemeMode.system,
    },
    builder: (context, child) => CheckInHost(
      child: ReminderHost(child: DownloadStatusHost(child: child!)),
    ),
    home: const AppRoot(),
  );
}
