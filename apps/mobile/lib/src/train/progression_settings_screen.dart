import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'progression_settings_screen_state.dart';

/// Setting the rep range and the load step suggestions are made with for
/// one exercise (MM-79), or going back to the defaults.
///
/// Its controls are keyed `progression-low`, `progression-high`,
/// `progression-step`, `progression-save` and `progression-defaults`.
class ProgressionSettingsScreen extends ConsumerStatefulWidget {
  const ProgressionSettingsScreen({required this.exerciseId, super.key});

  final String exerciseId;

  @override
  ConsumerState<ProgressionSettingsScreen> createState() =>
      ProgressionSettingsScreenState();
}
