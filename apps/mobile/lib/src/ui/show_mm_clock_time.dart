import 'package:flutter/material.dart';

import 'mm_clock_time_dialog.dart';

/// Asks for a time of day to the second. Returns it as a [Duration] after
/// midnight, or null if the user backs out.
Future<Duration?> showMmClockTime(
  BuildContext context, {
  required String title,
  required Duration initial,
}) => showDialog<Duration>(
  context: context,
  builder: (_) => MmClockTimeDialog(title: title, initial: initial),
);
