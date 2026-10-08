import 'package:test/test.dart';

import '../src/arch/snake_case.dart';

void main() {
  const snake = SnakeCase();

  test('converts type names to file stems', () {
    expect(snake.of('MacroBar'), 'macro_bar');
    expect(snake.of('MmStore'), 'mm_store');
    expect(snake.of('TdeeEstimator'), 'tdee_estimator');
  });

  test('keeps acronyms together', () {
    expect(snake.of('HTTPClient'), 'http_client');
    expect(snake.of('BmiCheck'), 'bmi_check');
  });

  test('ignores a leading underscore and digits', () {
    expect(snake.of('_DayPicker'), 'day_picker');
    expect(snake.of('Foo2Bar'), 'foo2_bar');
  });
}
