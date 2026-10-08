import 'package:flutter/material.dart';

import 'mm_button.dart';
import 'mm_button_kind.dart';
import 'mm_icon_button.dart';

/// Steps between days: previous, the day's name (tap to return to today), next.
class DayStepper extends StatelessWidget {
  const DayStepper({
    required this.label,
    required this.onPrevious,
    required this.onNext,
    required this.onLabelTap,
    super.key,
  });

  final String label;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

  /// Null when already on today.
  final VoidCallback? onLabelTap;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      MmIconButton(
        icon: Icons.chevron_left,
        tooltip: 'Previous day',
        onPressed: onPrevious,
      ),
      if (onLabelTap == null)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(label, style: Theme.of(context).textTheme.titleMedium),
        )
      else
        MmButton(label: label, kind: MmButtonKind.text, onPressed: onLabelTap),
      MmIconButton(
        icon: Icons.chevron_right,
        tooltip: 'Next day',
        onPressed: onNext,
      ),
    ],
  );
}
