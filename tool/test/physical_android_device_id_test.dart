import 'dart:convert';

import 'package:test/test.dart';

import '../src/physical_android_device_id.dart';

void main() {
  Map<String, Object> device(String id, String platform, bool emulator) => {
    'id': id,
    'targetPlatform': platform,
    'emulator': emulator,
  };

  test('selects the phone and ignores emulators and other platforms', () {
    final output = jsonEncode([
      device('emulator-5554', 'android-x64', true),
      device('phone-id', 'android-arm64', false),
      device('windows', 'windows-x64', false),
      device('iphone', 'ios', false),
    ]);
    expect(physicalAndroidDeviceId(output), 'phone-id');
  });

  test('accepts Flutter preamble before machine output', () {
    expect(
      physicalAndroidDeviceId(
        'Resolving dependencies...\n'
        '${jsonEncode([device('phone', 'android-arm64', false)])}\n',
      ),
      'phone',
    );
  });

  test('no phone reports authorization guidance rather than an emulator', () {
    expect(
      () => physicalAndroidDeviceId(
        jsonEncode([device('emulator-5554', 'android-x64', true)]),
      ),
      throwsA(
        isA<StateError>().having(
          (error) => error.message,
          'message',
          contains('USB debugging'),
        ),
      ),
    );
  });

  test('multiple phones list IDs and explicit selection guidance', () {
    expect(
      () => physicalAndroidDeviceId(
        jsonEncode([
          device('first', 'android-arm64', false),
          device('second', 'android-arm64', false),
        ]),
      ),
      throwsA(
        isA<StateError>().having(
          (error) => error.message,
          'message',
          allOf(contains('first, second'), contains('--env dev -d')),
        ),
      ),
    );
  });

  for (final output in ['not json', '[invalid]', '[{}]']) {
    test('malformed discovery reports an error: $output', () {
      expect(() => physicalAndroidDeviceId(output), throwsFormatException);
    });
  }
}
