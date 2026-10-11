import 'package:mm_engine/mm_engine.dart';

extension TimeSpanProblemText on TimeSpanProblem {
  /// Why a typed time was not kept (MM-191).
  String get message => switch (this) {
    TimeSpanProblem.endNotAfterStart => 'The end has to be after the start.',
    TimeSpanProblem.tooEarly => 'That is before the workout started.',
    TimeSpanProblem.tooLate => 'That is after the workout, or still to come.',
    TimeSpanProblem.overlappingSet =>
      'That overlaps another set in this workout.',
  };
}
