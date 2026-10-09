import 'dart:convert';
import 'dart:io';

import 'read_roadmap_tickets.dart';
import 'roadmap_page_data.dart';

const _marker = '/*DATA*/null/*END*/';

/// `mm roadmap [--check]`: writes `roadmap/progress.html` (MM-166), or with
/// `--check` says whether the committed page is out of date.
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
    'Open it in a browser.',
  );
  return 0;
}
