import 'package:flutter/material.dart';

import 'mm_button.dart';
import 'mm_button_kind.dart';

/// Asks a question with two real answers, neither of them destructive.
/// Returns the chosen value, or null if the question was closed unanswered.
Future<T?> showMmChoice<T>(
  BuildContext context, {
  required String title,
  required String message,
  required String primaryLabel,
  required T primary,
  required String secondaryLabel,
  required T secondary,
}) => showDialog<T>(
  context: context,
  builder: (context) => AlertDialog(
    title: Text(title),
    content: Text(message),
    actions: [
      MmButton(
        key: const ValueKey('choice-secondary'),
        label: secondaryLabel,
        kind: MmButtonKind.text,
        onPressed: () => Navigator.of(context).pop(secondary),
      ),
      MmButton(
        key: const ValueKey('choice-primary'),
        label: primaryLabel,
        onPressed: () => Navigator.of(context).pop(primary),
      ),
    ],
  ),
);
