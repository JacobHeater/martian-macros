import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/app/martian_macros_app.dart';
import 'src/repository_providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final container = ProviderContainer();
  await prepareDemoRepositories(container);
  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const MartianMacrosApp(),
    ),
  );
}
