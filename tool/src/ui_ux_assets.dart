import 'dart:io';

/// Where the HTML UI/UX assets live, from the repository root (MM-210).
const uiUxAssetsFolder = 'requirements/ui-ux-assets';

/// The heading a ticket lists its assets under, exactly.
const uiUxAssetsHeading = '## UI/UX Assets';

/// What an asset can be said to be. Linking one approves nothing.
///
/// `current` is a drawing of what is built (MM-211); the others are designs.
const uiUxAssetStatuses = [
  'current',
  'exploratory',
  'proposed',
  'accepted',
  'superseded',
];

const _unresolvedHeading = '## Unresolved assets';
const _notAssetsHeading = '## HTML that is not a UI/UX asset';

/// What is wrong with how the HTML UI/UX assets are tracked (MM-210), each
/// problem named by a path from `requirements/`.
///
/// [htmlFiles] is every HTML file in the repository that git does not
/// ignore, as paths from [repoRoot] with forward slashes, or null when that
/// could not be found out, in which case HTML outside the folder goes
/// unchecked.
///
/// This checks that things exist and are written down. It cannot tell
/// whether an asset belongs with the ticket that links it, whether it looks
/// right, or whether the owner approved it.
List<String> uiUxAssetProblems(Directory repoRoot, {List<String>? htmlFiles}) {
  final problems = <String>[];
  final root = repoRoot.path.replaceAll('\\', '/');
  final folder = Directory('$root/$uiUxAssetsFolder');
  final readme = File('${folder.path}/README.md');
  final readmeLines = readme.existsSync()
      ? readme.readAsLinesSync()
      : const <String>[];

  // ---- what the tickets say
  final linked = <String>{};
  final requirements = Directory('$root/requirements');
  final components = requirements.existsSync()
      ? (requirements.listSync().whereType<Directory>().toList()
          ..sort((a, b) => a.path.compareTo(b.path)))
      : const <Directory>[];
  for (final component in components) {
    final name = _slashed(component.path).split('/').last;
    if (name == uiUxAssetsFolder.split('/').last) continue;
    final files =
        component
            .listSync()
            .whereType<File>()
            .where((f) => f.path.endsWith('.md'))
            .toList()
          ..sort((a, b) => a.path.compareTo(b.path));
    for (final file in files) {
      final where = '$name/${_slashed(file.path).split('/').last}';
      final lines = file.readAsLinesSync();
      for (final line in _outsideFences(lines)) {
        final heading = RegExp(r'^#{1,6}\s+(.*?)\s*$').firstMatch(line);
        if (heading == null || line == uiUxAssetsHeading) continue;
        if (RegExp(
          r'^ui\s*[/ ]?\s*ux\s+assets?:?$',
          caseSensitive: false,
        ).hasMatch(heading[1]!)) {
          problems.add(
            '$where: the heading must be exactly "$uiUxAssetsHeading", '
            'not "$line".',
          );
        }
      }
      if (!lines.contains(uiUxAssetsHeading)) continue;
      final items = _items(lines, uiUxAssetsHeading);
      if (items.isEmpty) {
        problems.add('$where: "$uiUxAssetsHeading" lists no asset.');
      }
      for (final item in items) {
        final entry = _entry.firstMatch(item);
        if (entry == null) {
          problems.add(
            '$where: an asset entry must read "- [Title](relative/link) — '
            'Status. What it shows.": "${_short(item)}".',
          );
          continue;
        }
        final title = entry[1]!;
        final status = entry[3]!.toLowerCase();
        if (!uiUxAssetStatuses.contains(status)) {
          problems.add(
            '$where: asset "$title" has status "${entry[3]}"; it must be one '
            'of ${uiUxAssetStatuses.join(', ')}.',
          );
        }
        if (entry[4]!.trim().isEmpty) {
          problems.add('$where: asset "$title" does not say what it shows.');
        }
        final target = _resolve('requirements/$name', entry[2]!);
        if (target == null) {
          problems.add(
            '$where: asset "$title" needs a relative link, not '
            '"${entry[2]}".',
          );
        } else if (!target.startsWith('$uiUxAssetsFolder/')) {
          problems.add(
            '$where: asset "$title" links $target, which is outside '
            '$uiUxAssetsFolder/. Assets live there.',
          );
        } else if (!File('$root/$target').existsSync()) {
          problems.add(
            '$where: asset "$title" links $target, which is missing.',
          );
        } else {
          linked.add(target);
          final frame = _fragment(entry[2]!);
          if (frame != null &&
              !uiUxAssetHasAnchor(
                File('$root/$target').readAsStringSync(),
                frame,
              )) {
            problems.add(
              '$where: asset "$title" links $target#$frame, and that sheet '
              'has no frame "$frame".',
            );
          }
        }
      }
    }
  }

  // ---- what the folder holds
  final unresolved = <String>{};
  for (final item in _items(readmeLines, _unresolvedHeading)) {
    final entry = RegExp(r'^- \[([^\]]+)\]\(([^)\s]+)\)(.*)$').firstMatch(item);
    final target = entry == null ? null : _resolve(uiUxAssetsFolder, entry[2]!);
    if (entry == null || target == null) {
      problems.add(
        'ui-ux-assets/README.md: an unresolved asset must read '
        '"- [Title](file.html): what it seems to show and what must be '
        'decided": "${_short(item)}".',
      );
    } else if (!File('$root/$target').existsSync()) {
      problems.add(
        'ui-ux-assets/README.md: unresolved asset $target is missing.',
      );
    } else if (entry[3]!.replaceAll(RegExp(r'[\s:—–.-]'), '').isEmpty) {
      problems.add(
        'ui-ux-assets/README.md: unresolved asset $target does not say '
        'what must be decided.',
      );
    } else {
      unresolved.add(target);
    }
  }

  final assets = <String, String>{};
  if (folder.existsSync()) {
    final files =
        folder
            .listSync(recursive: true)
            .whereType<File>()
            .where((f) => f.path.toLowerCase().endsWith('.html'))
            .toList()
          ..sort((a, b) => a.path.compareTo(b.path));
    for (final file in files) {
      assets[_slashed(file.path).substring(root.length + 1)] = file
          .readAsStringSync();
    }
  }
  final seen = <String, String>{};
  for (final MapEntry(key: path, value: html) in assets.entries) {
    if (linked.contains(path) && unresolved.contains(path)) {
      problems.add(
        'ui-ux-assets/README.md: $path is linked from a ticket, so it is no '
        'longer unresolved. Take it off that list.',
      );
    } else if (!linked.contains(path) && !unresolved.contains(path)) {
      problems.add(
        '$path: no ticket lists it under "$uiUxAssetsHeading". Link it from '
        'the tickets it supports, or record it under "$_unresolvedHeading" '
        'in $uiUxAssetsFolder/README.md.',
      );
    }
    final same = seen[html];
    if (same != null) {
      problems.add(
        '$path: the same file as $same. Keep one copy and link it from each '
        'ticket.',
      );
    } else {
      seen[html] = path;
    }
    final at = path.substring(0, path.lastIndexOf('/'));
    for (final (reference, loaded) in _references(html)) {
      if (RegExp(r'^(https?:)?//', caseSensitive: false).hasMatch(reference)) {
        if (loaded) {
          problems.add(
            '$path: loads $reference from the network. An asset carries what '
            'it needs to render.',
          );
        }
        continue;
      }
      final target = _resolve(at, reference);
      if (target == null) continue;
      if (!File('$root/$target').existsSync() &&
          !Directory('$root/$target').existsSync()) {
        problems.add('$path: refers to $reference, which is missing.');
        continue;
      }
      final frame = _fragment(reference);
      if (frame != null &&
          target.toLowerCase().endsWith('.html') &&
          !uiUxAssetHasAnchor(
            File('$root/$target').readAsStringSync(),
            frame,
          )) {
        problems.add(
          '$path: links $reference, and that sheet has no frame "$frame".',
        );
      }
    }
  }

  // ---- HTML anywhere else
  final notAssets = <String>{};
  for (final item in _items(readmeLines, _notAssetsHeading)) {
    final path = RegExp(r'^- `([^`]+)`(.*)$').firstMatch(item);
    if (path == null || path[2]!.replaceAll(RegExp(r'[\s:—–.-]'), '').isEmpty) {
      problems.add(
        'ui-ux-assets/README.md: HTML kept elsewhere must read '
        '"- `path/from/the/repository/root.html`: what it is": '
        '"${_short(item)}".',
      );
      continue;
    }
    notAssets.add(path[1]!);
    if (!File('$root/${path[1]}').existsSync()) {
      problems.add(
        'ui-ux-assets/README.md: ${path[1]} is listed as HTML kept '
        'elsewhere, and is missing. Take it off the list.',
      );
    }
  }
  for (final path in [...?htmlFiles]..sort()) {
    if (path.startsWith('$uiUxAssetsFolder/') || notAssets.contains(path)) {
      continue;
    }
    problems.add(
      '$path: HTML outside $uiUxAssetsFolder/. If it shows a screen or a '
      'flow, move it there and link it from its tickets; if it does not, '
      'list it under "$_notAssetsHeading" in $uiUxAssetsFolder/README.md.',
    );
  }
  if (!readme.existsSync() && (assets.isNotEmpty || problems.isNotEmpty)) {
    problems.add('$uiUxAssetsFolder/README.md is missing.');
  }
  return problems;
}

/// `- [Title](link) — Status. What it shows.`
final _entry = RegExp(
  r'^- \[([^\]]+)\]\(([^)\s]+)\)\s*(?:—|–|-|:)\s*([A-Za-z-]+)\b[.:,]?\s*(.*)$',
);

String _slashed(String path) => path.replaceAll('\\', '/');

String _short(String text) =>
    text.length <= 60 ? text : '${text.substring(0, 57)}...';

/// [lines] without those inside a fenced code block.
Iterable<String> _outsideFences(List<String> lines) sync* {
  var fenced = false;
  for (final line in lines) {
    if (line.trimLeft().startsWith('```')) {
      fenced = !fenced;
    } else if (!fenced) {
      yield line;
    }
  }
}

/// The top-level list items under [heading], each joined onto one line.
List<String> _items(List<String> lines, String heading) {
  final items = <String>[];
  var inside = false;
  var open = false;
  for (final line in _outsideFences(lines)) {
    if (line.startsWith('#')) {
      inside = line.trimRight() == heading;
      open = false;
    } else if (!inside) {
      continue;
    } else if (line.startsWith('- ')) {
      items.add(line.trimRight());
      open = true;
    } else if (line.trim().isEmpty) {
      open = false;
    } else if (open && line.startsWith(' ')) {
      items[items.length - 1] = '${items.last} ${line.trim()}';
    }
  }
  return items;
}

/// The part of [link] after `#`, or null.
String? _fragment(String link) {
  final at = link.indexOf('#');
  return at == -1 || at == link.length - 1 ? null : link.substring(at + 1);
}

/// Whether [html] has something addressed by [id]: an element with that id,
/// or a frame the shared script is asked to draw with it.
bool uiUxAssetHasAnchor(String html, String id) {
  final quoted = RegExp.escape(id);
  return RegExp('id="$quoted"|\'$quoted\'').hasMatch(html);
}

/// [link], written in a file in [fromFolder], as a path from the repository
/// root; null for a link that is not a relative path to a file.
String? _resolve(String fromFolder, String link) {
  var path = link.split('#').first.split('?').first;
  if (path.isEmpty ||
      path.startsWith('/') ||
      path.contains(r'${') ||
      RegExp(r'^[a-zA-Z][a-zA-Z0-9+.-]*:').hasMatch(path)) {
    return null;
  }
  path = Uri.decodeFull(path);
  final parts = fromFolder.split('/');
  for (final part in path.split('/')) {
    if (part == '.' || part.isEmpty) continue;
    if (part == '..') {
      if (parts.isEmpty) return null;
      parts.removeLast();
    } else {
      parts.add(part);
    }
  }
  return parts.join('/');
}

/// What [html] refers to, and whether each is loaded to render the page (a
/// script, a stylesheet, an image, a font) and not just pointed at.
Iterable<(String, bool)> _references(String html) sync* {
  final tags = RegExp(r'<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>');
  final attribute = RegExp(
    r'''\b(src|href)\s*=\s*(?:"([^"]*)"|'([^']*)')''',
    caseSensitive: false,
  );
  for (final tag in tags.allMatches(html)) {
    for (final found in attribute.allMatches(tag[2]!)) {
      final value = (found[2] ?? found[3])!.trim();
      if (value.isEmpty) continue;
      yield (
        value,
        found[1]!.toLowerCase() == 'src' || tag[1]!.toLowerCase() == 'link',
      );
    }
  }
  final css = RegExp(r'''url\(\s*["']?([^"')\s]+)["']?\s*\)''');
  for (final found in css.allMatches(html)) {
    yield (found[1]!, true);
  }
}
