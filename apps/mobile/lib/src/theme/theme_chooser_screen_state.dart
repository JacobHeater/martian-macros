import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/theme_preference_label.dart';
import '../repository_role_providers.dart';
import '../ui/choice_card.dart';
import '../ui/macro_kind.dart';
import '../ui/mm_button.dart';
import '../ui/macro_bar.dart';
import '../ui/notice.dart';
import '../ui/notice_kind.dart';
import 'theme_choices.dart';
import 'theme_chooser_screen.dart';
import 'theme_preview_provider.dart';

class ThemeChooserScreenState extends ConsumerState<ThemeChooserScreen> {
  bool _saving = false;
  String? _error;

  Future<void> _confirm(ThemePreference selected) async {
    if (_saving) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(preferencesWriterProvider).saveThemePreference(selected);
    } on Exception catch (error, stack) {
      FlutterError.reportError(
        FlutterErrorDetails(
          exception: error,
          stack: stack,
          library: 'theme selection',
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
    final selected = ref.watch(themePreviewProvider) ?? ThemePreference.martian;
    final text = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 16),
            Text('Make it your planet.', style: text.headlineMedium),
            const SizedBox(height: 8),
            Text('Choose your theme', style: text.titleLarge),
            const SizedBox(height: 8),
            const Text(
              'Martian is our retro original. Try a look below; you can change it anytime in Settings.',
            ),
            const SizedBox(height: 24),
            for (final choice in themeChoices)
              ChoiceCard(
                key: ValueKey('theme-choice-${choice.name}'),
                label: choice.label,
                detail: switch (choice) {
                  ThemePreference.martian =>
                    'Acid lime, cyan and pink on deep grape.',
                  ThemePreference.light => 'Cool gray, white and crisp ink.',
                  ThemePreference.dark =>
                    'Midnight blue with warm orange accents.',
                  _ => 'Follow your phone\'s light or dark appearance.',
                },
                badge: choice == ThemePreference.martian ? 'Default' : null,
                selected: selected == choice,
                onTap: () {
                  if (!_saving) {
                    ref.read(themePreviewProvider.notifier).select(choice);
                  }
                },
              ),
            const SizedBox(height: 16),
            Text('A little color preview', style: text.titleMedium),
            const SizedBox(height: 12),
            for (final macro in MacroKind.values)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: MacroBar(grams: 65, target: 100, macro: macro),
              ),
            if (_error != null) Notice(kind: NoticeKind.caution, text: _error!),
            const SizedBox(height: 16),
            MmButton(
              key: const ValueKey('theme-continue'),
              label: _saving ? 'Saving…' : 'Continue',
              expand: true,
              onPressed: _saving ? null : () => _confirm(selected),
            ),
          ],
        ),
      ),
    );
  }
}
