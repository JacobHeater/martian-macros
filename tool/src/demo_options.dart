/// Only fixed demo configuration is allowed; no Flutter passthrough can
/// override its identity, entrypoint or seed guard.
final class DemoOptions {
  const DemoOptions(this.deviceId);

  final String deviceId;

  static DemoOptions parse(List<String> args) {
    if (args.length != 3 ||
        args.first != '--seed' ||
        !const {'-d', '--device-id'}.contains(args[1]) ||
        args[2].isEmpty ||
        args[2].startsWith('-')) {
      throw const FormatException(
        'Usage: mm demo --seed -d <Android device ID>',
      );
    }
    return DemoOptions(args[2]);
  }

  List<String> get flutterArguments => [
    'run',
    '--dart-define=MM_DEMO_APP=true',
    '--dart-define-from-file=../../config/dev.json',
    '--dart-define=MM_DEMO_SEED=true',
    '-d',
    deviceId,
  ];
}
