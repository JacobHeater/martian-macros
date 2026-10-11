import 'package:mm_domain/mm_domain.dart';

final class MuscleVolume {
  const MuscleVolume({
    required this.group,
    required this.currentSets,
    required this.previousSets,
  });

  final MuscleGroup group;
  final double currentSets;
  final double previousSets;
  double get change => currentSets - previousSets;
}
