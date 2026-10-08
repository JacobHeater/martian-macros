import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/onboarding/mode_reason_explanation.dart';
import 'package:mm_engine/mm_engine.dart';

/// MM-132: a recommendation that rests on body fat admits it is an estimate.
void main() {
  test('every reason that depends on body fat says it is an estimate', () {
    for (final reason in [
      ModeReason.highBodyFat,
      ModeReason.recompEligible,
      ModeReason.leanAndTrained,
      ModeReason.cutFirst,
    ]) {
      expect(reason.explanation, contains('estimate'), reason: reason.name);
    }
  });

  test('reasons that do not depend on body fat are left alone', () {
    expect(
      ModeReason.deficitNotAllowed.explanation,
      isNot(contains('estimate')),
    );
    expect(ModeReason.underweight.explanation, isNot(contains('estimate')));
  });
}
