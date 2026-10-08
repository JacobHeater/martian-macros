import 'package:flutter/material.dart';
import 'package:mm_engine/mm_engine.dart';

import 'target_change_sheet.dart';

/// Opens the account of the last record in [history]. If it is the user's
/// current targets and an ordinary reduction that may be held once, the sheet
/// offers to keep last week's targets, and doing so replaces the record
/// (MM-138). Pass [isCurrent] false for an older record from the history.
Future<void> showTargetChangeSheet(
  BuildContext context,
  TargetsHistoryWriter writer,
  List<TargetsRecord> history, {
  bool isCurrent = true,
}) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  builder: (_) => TargetChangeSheet(
    current: history.last,
    previous: history.length > 1 ? history[history.length - 2] : null,
    onHold: isCurrent && canHoldReduction(history)
        ? () => writer.saveTargets(holdReduction(history))
        : null,
  ),
);
