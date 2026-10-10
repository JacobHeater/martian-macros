import '../../biological_sex.dart';

/// What the hand model needs to know about a person (MM-46): the two things
/// that set the size of their hand.
final class HandSize {
  const HandSize({required this.heightCm, required this.sex});

  final double heightCm;
  final BiologicalSex sex;
}
