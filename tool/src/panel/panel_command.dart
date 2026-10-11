import 'dart:io';

import 'panel_checker.dart';

Future<int> runPanel(Directory root, List<String> args) async {
  if (args.length > 1 || args.any((arg) => arg.startsWith('-'))) {
    stderr.writeln('Usage: mm panel [docs/agent-runs/<task-id>]');
    return 64;
  }
  final errors = const PanelChecker().check(
    root,
    run: args.isEmpty ? null : Directory('${root.path}/${args.single}'),
  );
  for (final error in errors) {
    stderr.writeln('  $error');
  }
  if (errors.isNotEmpty) {
    stderr.writeln('mm panel failed: ${errors.length} issue(s).');
    return 1;
  }
  stdout.writeln(
    'mm panel: ok (canonical roles, Claude/Copilot adapters, templates'
    '${args.isEmpty ? '' : ', saved run'}). '
    'Structural checks only; native runtime permissions and evidence truth '
    'require actual inspection.',
  );
  return 0;
}
