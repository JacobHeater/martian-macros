import 'toolchain.dart';

/// A runnable `mm` subcommand: gets the toolchain and its arguments, returns
/// the process exit code.
typedef Command = Future<int> Function(Toolchain tc, List<String> args);
