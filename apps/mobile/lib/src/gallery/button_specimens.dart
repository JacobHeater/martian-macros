import 'package:flutter/material.dart';

import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_fab.dart';
import '../ui/mm_icon_button.dart';

/// Buttons in every kind and state.
class ButtonSpecimens extends StatelessWidget {
  const ButtonSpecimens({super.key});

  @override
  Widget build(BuildContext context) => Wrap(
    spacing: 12,
    runSpacing: 12,
    crossAxisAlignment: WrapCrossAlignment.center,
    children: [
      MmButton(label: 'Primary', onPressed: () {}),
      MmButton(label: 'Primary off', onPressed: null),
      MmButton(
        label: 'Secondary',
        kind: MmButtonKind.secondary,
        onPressed: () {},
      ),
      MmButton(
        label: 'With icon',
        icon: Icons.cake_outlined,
        kind: MmButtonKind.secondary,
        onPressed: () {},
      ),
      MmButton(label: 'Text', kind: MmButtonKind.text, onPressed: () {}),
      MmIconButton(
        icon: Icons.settings_outlined,
        tooltip: 'Settings',
        onPressed: () {},
      ),
      MmFab(label: 'Add food', icon: Icons.add, onPressed: () {}),
    ],
  );
}
