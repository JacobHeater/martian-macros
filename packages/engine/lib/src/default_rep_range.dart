import 'package:mm_domain/mm_domain.dart';

/// The rep range a suggestion works within (MM-79), bottom and top: 6 to 10
/// for a barbell lift and 8 to 12 otherwise. These are conventions, not
/// optima; the evidence does not single out a range.
(int, int) defaultRepRange(Exercise? exercise) =>
    exercise?.equipment == Equipment.barbell ? (6, 10) : (8, 12);
