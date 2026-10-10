import 'dart:convert';

/// Selects a single physical Android device from Flutter's machine output.
String physicalAndroidDeviceId(String output) {
  final start = output.indexOf('[');
  final end = output.lastIndexOf(']');
  if (start == -1 || end < start) {
    throw const FormatException('Flutter returned no device list.');
  }
  final decoded = jsonDecode(output.substring(start, end + 1));
  if (decoded is! List) {
    throw const FormatException('Flutter returned an invalid device list.');
  }
  final ids = <String>[];
  for (final device in decoded) {
    if (device is! Map<String, dynamic> ||
        device['id'] is! String ||
        device['targetPlatform'] is! String ||
        device['emulator'] is! bool) {
      throw const FormatException('Flutter returned invalid device metadata.');
    }
    if ((device['targetPlatform'] as String).startsWith('android') &&
        device['emulator'] == false) {
      ids.add(device['id'] as String);
    }
  }
  if (ids.isEmpty) {
    throw StateError(
      'No Android phone connected. Connect a data-capable USB cable, enable '
      'USB debugging, and accept the authorization prompt on your phone.',
    );
  }
  if (ids.length > 1) {
    throw StateError(
      'Multiple Android phones connected: ${ids.join(', ')}. '
      'Select one with mm run --env dev -d DEVICE_ID.',
    );
  }
  return ids.single;
}
