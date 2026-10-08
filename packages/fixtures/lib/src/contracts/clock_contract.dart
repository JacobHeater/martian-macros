import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

/// What every [Clock] must do.
void clockContract(String name, Clock Function() create) {
  group('$name as a Clock', () {
    test('today is the calendar day of now', () {
      final clock = create();
      final now = clock.now();
      expect(
        clock.today().epochDay,
        CalendarDate.fromDateTime(now).epochDay,
        reason: 'now and today agree on the day',
      );
    });
  });
}
