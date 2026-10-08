import 'package:flutter/material.dart';

import 'mm_button_kind.dart';

/// The app's button. Every button in the app is this component, so two
/// screens cannot differ in size, shape or press behavior.
class MmButton extends StatelessWidget {
  const MmButton({
    required this.label,
    required this.onPressed,
    this.kind = MmButtonKind.primary,
    this.icon,
    this.expand = false,
    super.key,
  });

  final String label;

  /// Null disables the button.
  final VoidCallback? onPressed;
  final MmButtonKind kind;
  final IconData? icon;

  /// Fill the available width.
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final text = Text(label);
    final glyph = icon == null ? null : Icon(icon);
    final button = switch (kind) {
      MmButtonKind.primary =>
        glyph == null
            ? FilledButton(onPressed: onPressed, child: text)
            : FilledButton.icon(onPressed: onPressed, icon: glyph, label: text),
      MmButtonKind.secondary =>
        glyph == null
            ? OutlinedButton(onPressed: onPressed, child: text)
            : OutlinedButton.icon(
                onPressed: onPressed,
                icon: glyph,
                label: text,
              ),
      MmButtonKind.text =>
        glyph == null
            ? TextButton(onPressed: onPressed, child: text)
            : TextButton.icon(onPressed: onPressed, icon: glyph, label: text),
    };
    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }
}
