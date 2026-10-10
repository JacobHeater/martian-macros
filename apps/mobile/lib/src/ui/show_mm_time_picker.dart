import 'package:flutter/material.dart';

/// Asks for a time of day. Returns minutes after midnight, or null if the
/// user backs out.
Future<int?> showMmTimePicker(
  BuildContext context, {
  required int initialMinuteOfDay,
  String? helpText,
}) async {
  final picked = await showTimePicker(
    context: context,
    helpText: helpText,
    initialTime: TimeOfDay(
      hour: initialMinuteOfDay ~/ 60,
      minute: initialMinuteOfDay % 60,
    ),
  );
  return picked == null ? null : picked.hour * 60 + picked.minute;
}
