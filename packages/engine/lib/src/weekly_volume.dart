import 'package:mm_domain/mm_domain.dart';

import 'muscle_volume.dart';

final class WeeklyVolume {
  const WeeklyVolume({
    required this.today,
    required this.groups,
    required this.unmappedCurrentSets,
    required this.unmappedPreviousSets,
  });

  final CalendarDate today;
  final List<MuscleVolume> groups;
  final int unmappedCurrentSets;
  final int unmappedPreviousSets;
}
