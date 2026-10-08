import 'coach_constants.dart';
import 'settling_window.dart';
import 'targets_record.dart';

/// The settling window after each change of intake level in [history].
///
/// The first targets are compared with expenditure, on the assumption that
/// the user was eating at maintenance before they started.
List<SettlingWindow> settlingWindows(List<TargetsRecord> history) {
  final windows = <SettlingWindow>[];
  TargetsRecord? previous;
  for (final record in history) {
    final change = previous == null
        ? record.targets.kcal - record.tdeeKcal
        : record.targets.kcal - previous.targets.kcal;
    if (change.abs() > phaseChangeFraction * record.tdeeKcal) {
      windows.add(
        SettlingWindow(
          record.effectiveFrom,
          record.effectiveFrom.addDays(settlingDays - 1),
        ),
      );
    }
    previous = record;
  }
  return windows;
}
