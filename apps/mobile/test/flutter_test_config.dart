import 'dart:async';

import 'package:flutter_test/flutter_test.dart';

/// A widget test that waits longer than this fails instead of hanging the run
/// (MM-93). Widget tests run on a fake clock, so a test that awaits real I/O
/// (a database, a stream) from the test body never completes; such reads go
/// through `tester.runAsync`.
const _widgetTestTimeout = Timeout(Duration(seconds: 60));

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  final binding = TestWidgetsFlutterBinding.instance;
  if (binding is AutomatedTestWidgetsFlutterBinding) {
    binding.defaultTestTimeout = _widgetTestTimeout;
  }
  await testMain();
}
