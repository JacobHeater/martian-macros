import 'package:flutter/material.dart';

import 'mm_button.dart';
import 'mm_button_kind.dart';

/// Asks the user to confirm a destructive action. Returns true only if they
/// confirm; the safe choice is the quieter-looking cancel on the left.
Future<bool> showMmConfirm(
  BuildContext context, {
  required String title,
  required String message,
  required String confirmLabel,
  String cancelLabel = 'Cancel',
}) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        MmButton(
          label: cancelLabel,
          kind: MmButtonKind.text,
          onPressed: () => Navigator.of(context).pop(false),
        ),
        MmButton(
          label: confirmLabel,
          onPressed: () => Navigator.of(context).pop(true),
        ),
      ],
    ),
  );
  return confirmed == true;
}
