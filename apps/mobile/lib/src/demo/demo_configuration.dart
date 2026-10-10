/// The Android build derives its separate app ID from this same demo flag.
/// A seed flag alone must never select or erase the ordinary database.
final class DemoConfiguration {
  DemoConfiguration({
    required bool demoApp,
    required bool isAndroid,
    required String environment,
    required this.seed,
  }) : isDemo = demoApp {
    if ((isDemo && (!isAndroid || environment != 'dev')) || (seed && !isDemo)) {
      throw StateError(
        'Demo seeding requires Android demo identity and dev config.',
      );
    }
  }

  final bool isDemo;
  final bool seed;
  String get databaseName => isDemo ? 'martian_macros_demo' : 'martian_macros';
}
