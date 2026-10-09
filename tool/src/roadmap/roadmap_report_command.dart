import 'dart:convert';
import 'dart:io';

import 'read_roadmap_tickets.dart';
import 'roadmap_page_data.dart';

const _marker = '/*DATA*/null/*END*/';

/// `mm roadmap [--check] [--no-open]`: writes `roadmap/progress.html`
/// (MM-166) and opens it, or with `--check` says whether the committed page
/// is out of date. It opens only at a terminal and never in CI.
Future<int> runRoadmapReport(Directory repoRoot, List<String> args) async {
  final root = repoRoot.path;
  final template = File('$root/tool/assets/roadmap_report.template.html');
  final roadmapFile = File('$root/roadmap/roadmap.json');
  if (!template.existsSync() || !roadmapFile.existsSync()) {
    stderr.writeln('Missing the page template or roadmap/roadmap.json.');
    return 66;
  }
  final roadmap =
      jsonDecode(roadmapFile.readAsStringSync()) as Map<String, Object?>;
  final tickets = readRoadmapTickets(Directory('$root/requirements'));
  // The date is the roadmap's own, so the page only changes when its inputs do.
  final data = roadmapPageData(
    roadmap: roadmap,
    tickets: tickets,
    generatedOn: '${roadmap['asOf']}',
  );
  final html = template
      .readAsStringSync()
      .replaceAll('\r\n', '\n')
      .replaceFirst(_marker, '/*DATA*/$data/*END*/');
  final out = File('$root/roadmap/progress.html');
  if (args.contains('--check')) {
    final current = out.existsSync() ? out.readAsStringSync() : '';
    if (current.replaceAll('\r\n', '\n') == html) return 0;
    stderr.writeln('roadmap/progress.html is out of date. Run "mm roadmap".');
    return 1;
  }
  out.writeAsStringSync(html);
  stdout.writeln(
    'Wrote roadmap/progress.html (${tickets.length} tickets). '
    '${_shouldOpen(args) ? 'Opening it.' : 'Open it in a browser.'}',
  );
  if (_shouldOpen(args)) await _open(out);
  return 0;
}

bool _shouldOpen(List<String> args) =>
    !args.contains('--no-open') &&
    stdout.hasTerminal &&
    Platform.environment['CI'] == null;

/// Opens the page in the default browser. VS Code has no command-line way to
/// open its built-in browser, so this uses the system one.
Future<void> _open(File page) async {
  final path = page.absolute.path;
  try {
    if (Platform.isWindows) {
      await Process.run('cmd', ['/c', 'start', '', path]);
    } else if (Platform.isMacOS) {
      await Process.run('open', [path]);
    } else {
      await Process.run('xdg-open', [path]);
    }
  } on ProcessException {
    // Opening is a convenience; the page is already written.
  }
}
