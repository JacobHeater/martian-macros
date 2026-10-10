import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'theme_settings_state.dart';

class ThemeSettings extends ConsumerStatefulWidget {
  const ThemeSettings({super.key});

  @override
  ConsumerState<ThemeSettings> createState() => ThemeSettingsState();
}
