import 'dart:io';

import 'package:test/test.dart';

void main() {
  test('MM-178: native identity uses an unshadowed Base64 import', () {
    final script = File('../apps/mobile/android/app/build.gradle.kts')
        .readAsStringSync();
    expect(script, contains('import java.util.Base64'));
    expect(script, contains('Base64.getDecoder().decode(it)'));
    expect(script, isNot(contains('String(java.util.Base64')));
    expect(script, contains('contains("MM_DEMO_APP=true")'));
    expect(script, contains('"com.martianmacros.martian_macros.demo"'));
    expect(script, contains('else "com.martianmacros.martian_macros"'));
    expect(script, contains('if (demoApp) "Martian Macros DEMO"'));
  });
}
