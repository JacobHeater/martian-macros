import 'dart:io';

import '../src/commands.dart';

Future<void> main(List<String> args) async {
  exitCode = await runCli(args);
}
