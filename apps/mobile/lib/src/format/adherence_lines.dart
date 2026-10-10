import 'package:mm_engine/mm_engine.dart';

import 'fmt.dart';

/// The week's adherence as label and value pairs (MM-149): facts, with no
/// score, percentage or grade. Over and under are worded the same way; below
/// the app's minimum is its own wording and is never "under target".
List<(String, String)> adherenceLines(
  AdherenceSummary s, {
  required double floorKcal,
}) {
  final days = s.daysLogged == 0
      ? 'None'
      : s.completeDays == s.daysLogged
      ? '${s.daysLogged}, all complete'
      : '${s.daysLogged}, ${s.completeDays} complete';
  final protein = s.proteinDays;
  return [
    ('Days logged', days),
    ('Weigh-ins', '${s.weighIns}'),
    ('Average intake', _intake(s, floorKcal)),
    if (protein != null)
      (
        'Protein minimum met',
        '$protein of ${s.completeDays} ${s.completeDays == 1 ? 'day' : 'days'}',
      ),
  ];
}

String _intake(AdherenceSummary s, double floorKcal) {
  final intake = s.averageIntakeKcal;
  if (intake == null) return 'No complete days';
  final target = s.averageTargetKcal;
  final distance = s.distanceKcal;
  final figure = target == null
      ? '${Fmt.whole(intake)} kcal'
      : '${Fmt.whole(intake)} kcal against ${Fmt.whole(target)}';
  final standing = switch (s.standing) {
    null => null,
    IntakeStanding.onTarget => 'on target',
    IntakeStanding.above => '${Fmt.whole(distance!.abs())} over',
    IntakeStanding.below => '${Fmt.whole(distance!.abs())} under',
    IntakeStanding.belowFloor =>
      "below the app's minimum of ${Fmt.whole(floorKcal)}",
  };
  final notes = [
    if (s.completeDays < 4)
      'rests on ${s.completeDays} ${s.completeDays == 1 ? 'day' : 'days'}',
    if (s.mostlyEstimated) 'mostly estimated',
  ];
  return [
    standing == null ? figure : '$figure: $standing',
    ...notes,
  ].join(' · ');
}
