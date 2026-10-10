import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/demo/demo_configuration.dart';

void main() {
  test('normal dev/prod configurations never select demo storage', () {
    for (final env in ['dev', 'prod']) {
      for (final android in [false, true]) {
        final config = DemoConfiguration(
          demoApp: false,
          isAndroid: android,
          environment: env,
          seed: false,
        );
        expect(config.isDemo, isFalse);
        expect(config.databaseName, 'martian_macros');
        expect(config.seed, isFalse);
      }
    }
  });

  test(
    'demo storage is distinct and guarded by Android identity and dev env',
    () {
      final config = DemoConfiguration(
        demoApp: true,
        isAndroid: true,
        environment: 'dev',
        seed: true,
      );
      expect(config.databaseName, 'martian_macros_demo');
      for (final (demo, android, env, seed) in [
        (false, true, 'dev', true),
        (false, true, 'prod', true),
        (true, true, 'prod', true),
        (true, true, 'prod', false),
        (true, false, 'dev', true),
      ]) {
        expect(
          () => DemoConfiguration(
            demoApp: demo,
            isAndroid: android,
            environment: env,
            seed: seed,
          ),
          throwsStateError,
        );
      }
    },
  );
}
