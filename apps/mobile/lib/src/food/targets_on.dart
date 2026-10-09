import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

/// The targets that were in force on [day].
TargetsRecord? targetsOn(
  List<TargetsRecord> history,
  CalendarDate day, {
  bool targetsAllowed = true,
}) {
  if (!targetsAllowed) return null;
  TargetsRecord? found;
  for (final record in history) {
    if (record.effectiveFrom.isAfter(day)) break;
    found = record;
  }
  return found ?? (history.isEmpty ? null : history.first);
}
