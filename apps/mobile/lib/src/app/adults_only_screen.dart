import 'package:flutter/material.dart';

import '../settings/settings_screen.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/notice.dart';
import '../ui/notice_kind.dart';

/// Shown when the stored date of birth makes the user under 18. Coaching
/// stops; the date can be corrected in Settings (MM-83, MM-13).
class AdultsOnlyScreen extends StatelessWidget {
  const AdultsOnlyScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Martian Macros is for adults',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            const Notice(
              kind: NoticeKind.caution,
              icon: Icons.block,
              text:
                  'Martian Macros is for adults 18 and over. Growing bodies '
                  'need different guidance than this app provides. Coaching '
                  'is switched off.',
            ),
            const SizedBox(height: 24),
            MmButton(
              label: 'Correct date of birth',
              kind: MmButtonKind.secondary,
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const SettingsScreen()),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
