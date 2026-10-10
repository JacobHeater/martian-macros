import 'package:test/test.dart';

import '../src/demo_options.dart';

void main() {
  test('explicit physical Android ID keeps all demo guards', () {
    final options = DemoOptions.parse(['--seed', '-d', 'physical-serial']);
    expect(options.flutterArguments, [
      'run',
      '--dart-define=MM_DEMO_APP=true',
      '--dart-define-from-file=../../config/dev.json',
      '--dart-define=MM_DEMO_SEED=true',
      '-d',
      'physical-serial',
    ]);
    expect(
      DemoOptions.parse(['--seed', '--device-id', 'emulator-5554']).deviceId,
      'emulator-5554',
    );
  });

  test('cannot select production config or override safe arguments', () {
    for (final args in [
      <String>[],
      ['--seed'],
      ['--seed', '-d', ''],
      ['--seed', '-d', '--flavor'],
      ['--seed', '-d', 'serial', '--env', 'prod'],
      ['--seed', '-d', 'serial', '--flavor', 'standard'],
    ]) {
      expect(() => DemoOptions.parse(args), throwsFormatException);
    }
  });
}
