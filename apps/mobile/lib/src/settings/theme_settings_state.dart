import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/theme_preference_label.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../theme/theme_choices.dart';
import '../ui/mm_choice_chip.dart';
import '../ui/mm_spinner.dart';
import '../ui/notice.dart';
import '../ui/notice_kind.dart';
import 'theme_settings.dart';

class ThemeSettingsState extends ConsumerState<ThemeSettings> {
  bool _saving = false;
  String? _error;

  Future<void> _save(ThemePreference choice) async {
    if (_saving) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(preferencesWriterProvider).saveThemePreference(choice);
    } on Exception catch (error, stack) {
      FlutterError.reportError(
        FlutterErrorDetails(
          exception: error,
          stack: stack,
          library: 'theme settings',
        ),
      );
      if (mounted) {
        setState(() => _error = 'Could not save your theme. Please try again.');
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final preference = ref.watch(themePreferenceProvider).value;
    final selected = preference == ThemePreference.unselected
        ? ThemePreference.martian
        : preference;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final choice in themeChoices)
                MmChoiceChip(
                  label: choice.label,
                  selected: selected == choice,
                  onSelected: () => _save(choice),
                ),
            ],
          ),
          if (_saving) const MmSpinner(),
          if (_error != null) Notice(kind: NoticeKind.caution, text: _error!),
        ],
      ),
    );
  }
}
