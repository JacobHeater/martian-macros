import 'dart:convert';
import 'dart:io';

import 'demo_options.dart';
import 'toolchain.dart';

Future<int> runDemo(Toolchain tc, List<String> args) async {
  final DemoOptions options;
  try {
    options = DemoOptions.parse(args);
  } on FormatException catch (e) {
    stderr.writeln(e.message);
    return 64;
  }
  final output = await tc.captureFlutter(['devices', '--machine']);
  if (output == null) {
    stderr.writeln('Could not list devices. Run mm doctor.');
    return 69;
  }
  final start = output.indexOf('[');
  final end = output.lastIndexOf(']');
  if (start < 0 || end < start) return 69;
  final devices = (jsonDecode(output.substring(start, end + 1)) as List)
      .cast<Map<String, Object?>>();
  final androidIds = [
    for (final device in devices)
      if ('${device['targetPlatform']}'.startsWith('android'))
        '${device['id']}',
  ];
  if (!androidIds.contains(options.deviceId)) {
    stderr.writeln(
      'Choose an exact connected Android ID: ${androidIds.join(', ')}. '
      'Use flutter devices to list phones and emulators.',
    );
    return 69;
  }
  stdout.writeln(
    'Starting Martian Macros DEMO (.demo): only its isolated database '
    'will reset on every launch. The normal app is untouched.',
  );
  return tc.flutter(options.flutterArguments, inDir: 'apps/mobile');
}
