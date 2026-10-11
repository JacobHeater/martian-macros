import 'package:flutter/material.dart';

import 'mm_clock_time_dialog_state.dart';

/// Asks for a time of day to the second: hour, minute and second, each a
/// number, and AM or PM. Pops with the time as a [Duration] after midnight.
///
/// Its controls are keyed `clock-hour`, `clock-minute`, `clock-second`,
/// `clock-period`, `clock-cancel` and `clock-ok`.
class MmClockTimeDialog extends StatefulWidget {
  const MmClockTimeDialog({
    required this.title,
    required this.initial,
    super.key,
  });

  final String title;

  /// The time it opens on, after midnight.
  final Duration initial;

  @override
  State<MmClockTimeDialog> createState() => MmClockTimeDialogState();
}
