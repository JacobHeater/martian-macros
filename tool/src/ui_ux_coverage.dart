import 'dart:convert';
import 'dart:io';

import 'ui_ux_assets.dart';

/// The manifest of every UI surface and the HTML that draws it (MM-211).
const uiUxCoverageFile = '$uiUxAssetsFolder/coverage.json';

/// Where the app's widgets are.
const uiSourceFolder = 'apps/mobile/lib/src';

const uiUxSurfaceKinds = [
  'view',
  'part',
  'component',
  'sheet',
  'dialog',
  'navigation',
  'painter',
  'host',
];
const uiUxVerifications = ['screenshot-compared', 'source-only', 'not-drawn'];
const uiUxCoverageStatuses = ['covered', 'incomplete', 'not-drawn'];

/// A Dart file that draws something: it declares a widget or a painter, or a
/// top-level `show…` function that opens a dialog or a sheet. A `State`
/// class is its widget's other half and is not counted by itself.
final _drawsSomething = RegExp(
  r'^(?:final |abstract )?class \w+(?:<[^>]*>)? extends '
  r'(?:StatelessWidget|ConsumerWidget|StatefulWidget|ConsumerStatefulWidget|'
  r'CustomPainter)\b|^(?:Future<[^(]*>|void) show[A-Z]\w*\(',
  multiLine: true,
);

/// Every file under [uiSourceFolder] that draws something, as paths from
/// [repoRoot], sorted.
List<String> uiSurfaceSources(Directory repoRoot) {
  final root = repoRoot.path.replaceAll('\\', '/');
  final folder = Directory('$root/$uiSourceFolder');
  if (!folder.existsSync()) return const [];
  return [
    for (final file in folder.listSync(recursive: true).whereType<File>())
      if (file.path.endsWith('.dart') &&
          !file.path.endsWith('.g.dart') &&
          _drawsSomething.hasMatch(file.readAsStringSync()))
        file.path.replaceAll('\\', '/').substring(root.length + 1),
  ]..sort();
}

/// What is wrong with the coverage manifest (MM-211): a widget file it does
/// not account for, an entry for a file or a frame that does not exist, a
/// missing field, a ticket that does not exist, or an HTML sheet the index
/// does not link.
///
/// It checks that every surface is accounted for and that what the manifest
/// points at exists. It cannot tell whether a drawing looks like the screen.
List<String> uiUxCoverageProblems(
  Directory repoRoot, {
  required Set<String> ticketIds,
}) {
  final root = repoRoot.path.replaceAll('\\', '/');
  final sources = uiSurfaceSources(repoRoot);
  final file = File('$root/$uiUxCoverageFile');
  if (!file.existsSync()) {
    return [
      if (sources.isNotEmpty)
        'ui-ux-assets/coverage.json is missing: every view and component '
            'is listed there with the HTML that draws it (MM-211).',
    ];
  }
  final problems = <String>[];
  void problem(String what) =>
      problems.add('ui-ux-assets/coverage.json: $what');

  final Object? decoded;
  try {
    decoded = jsonDecode(file.readAsStringSync());
  } on FormatException catch (e) {
    return ['ui-ux-assets/coverage.json: not valid JSON (${e.message}).'];
  }
  if (decoded is! Map<String, Object?> || decoded['schema'] != 1) {
    return ['ui-ux-assets/coverage.json: expected an object with "schema": 1.'];
  }
  final surfaces = decoded['surfaces'];
  if (surfaces is! List<Object?>) {
    return ['ui-ux-assets/coverage.json: "surfaces" must be a list.'];
  }

  final htmlCache = <String, String?>{};
  String? assetProblem(Object? asset) {
    if (asset is! String || asset.isEmpty) return 'has no "asset"';
    final parts = asset.split('#');
    if (parts.length != 2 || parts[1].isEmpty) {
      return 'asset "$asset" must be "file.html#frame"';
    }
    final html = htmlCache.putIfAbsent(parts[0], () {
      final target = File('$root/$uiUxAssetsFolder/${parts[0]}');
      return target.existsSync() ? target.readAsStringSync() : null;
    });
    if (html == null) return 'asset ${parts[0]} is missing';
    if (!uiUxAssetHasAnchor(html, parts[1])) {
      return 'asset ${parts[0]} has no frame "${parts[1]}"';
    }
    return null;
  }

  void requirementProblems(String who, Object? requirements) {
    if (requirements is! List<Object?> || requirements.isEmpty) {
      problem(
        '$who lists no requirements. If none fits, put it under '
        '"unresolved" and say what must be decided.',
      );
      return;
    }
    for (final id in requirements) {
      if (!ticketIds.contains(id)) {
        problem('$who names $id, which no ticket has.');
      }
    }
  }

  final seen = <String>{};
  for (final entry in surfaces) {
    if (entry is! Map<String, Object?>) {
      problem('every surface must be an object.');
      continue;
    }
    final source = entry['source'];
    if (source is! String || source.isEmpty) {
      problem('a surface has no "source".');
      continue;
    }
    if (!seen.add(source)) problem('$source is listed twice.');
    if (!File('$root/$source').existsSync()) {
      problem(
        '$source no longer exists. Remove its entry, or point it at '
        'what replaced it.',
      );
      continue;
    }
    final symbol = entry['symbol'];
    if (symbol is! String || symbol.isEmpty) {
      problem('$source has no "symbol".');
    } else if (!File('$root/$source').readAsStringSync().contains(symbol)) {
      problem('$source does not declare "$symbol".');
    }
    if (!uiUxSurfaceKinds.contains(entry['kind'])) {
      problem('$source: kind must be one of ${uiUxSurfaceKinds.join(', ')}.');
    }
    if (!uiUxVerifications.contains(entry['verification'])) {
      problem(
        '$source: verification must be one of '
        '${uiUxVerifications.join(', ')}.',
      );
    }
    final status = entry['status'];
    if (!uiUxCoverageStatuses.contains(status)) {
      problem(
        '$source: status must be one of '
        '${uiUxCoverageStatuses.join(', ')}.',
      );
    }
    final states = entry['states'];
    if (states is! List<Object?> || states.isEmpty) {
      problem('$source lists no states.');
    }
    final limits = entry['limits'];
    if (status != 'covered' && (limits is! String || limits.trim().isEmpty)) {
      problem('$source is $status and does not say why under "limits".');
    }
    requirementProblems(source, entry['requirements']);
    final wrong = assetProblem(entry['asset']);
    if (wrong != null) problem('$source: $wrong.');
  }
  for (final source in sources) {
    if (!seen.contains(source)) {
      problem(
        '$source draws something and is not listed. Draw it, add its '
        'entry, and link the sheet from its tickets.',
      );
    }
  }

  final flows = decoded['flows'];
  for (final flow in flows is List<Object?> ? flows : const <Object?>[]) {
    if (flow is! Map<String, Object?> || flow['id'] is! String) {
      problem('every flow needs an "id".');
      continue;
    }
    final who = 'flow ${flow['id']}';
    requirementProblems(who, flow['requirements']);
    final wrong = assetProblem(flow['asset']);
    if (wrong != null) problem('$who: $wrong.');
  }

  final unresolved = decoded['unresolved'];
  for (final item
      in unresolved is List<Object?> ? unresolved : const <Object?>[]) {
    if (item is! Map<String, Object?> ||
        item['what'] is! String ||
        item['decision'] is! String ||
        (item['decision']! as String).trim().isEmpty) {
      problem('an unresolved item needs "what" and the "decision" to be made.');
    }
  }

  // The index is how a person finds a sheet.
  final index = File('$root/$uiUxAssetsFolder/index.html');
  if (!index.existsSync()) {
    problems.add('ui-ux-assets/index.html is missing.');
  } else {
    final text = index.readAsStringSync();
    for (final asset in htmlCache.keys.toList()..sort()) {
      if (htmlCache[asset] != null && !text.contains('href="$asset')) {
        problems.add('ui-ux-assets/index.html does not link $asset.');
      }
    }
  }
  return problems;
}
