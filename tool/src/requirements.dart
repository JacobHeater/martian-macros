import 'dart:io';

import 'requirements_scan.dart';
import 'ticket.dart';

/// The requirements tracker: validates `requirements/` against the rules in
/// its README and answers questions about tickets.
///
///   mm req                 validate, then print a status summary
///   mm req list [--status S] [--component C]
///   mm req next            print the next unused short_id
///   mm req show MM-42      print the path of a ticket
Future<int> runRequirements(Directory repoRoot, List<String> args) async {
  final root = Directory('${repoRoot.path}/requirements');
  if (!root.existsSync()) {
    stderr.writeln('No requirements/ folder at ${repoRoot.path}.');
    return 66;
  }
  final scan = _scan(root);

  switch (args.firstOrNull) {
    case 'next':
      stdout.writeln('$_key-${scan.highestNumber + 1}');
      return 0;
    case 'show':
      final id = args.elementAtOrNull(1);
      final matches = scan.tickets.where((t) => t.id == id).toList();
      if (matches.isEmpty) {
        stderr.writeln('No ticket with id "$id".');
        return 1;
      }
      for (final t in matches) {
        stdout.writeln('requirements/${t.component}/${t.fileName}');
      }
      return 0;
    case 'list':
      final status = _option(args, '--status');
      final component = _option(args, '--component');
      final shown = scan.tickets.where(
        (t) =>
            (status == null || t.status == status) &&
            (component == null || t.component == component),
      );
      for (final t in shown) {
        stdout.writeln(
          '${t.id.padRight(7)} ${t.status.padRight(12)} '
          '${t.type.padRight(6)} ${t.component}/${t.slug}',
        );
      }
      return scan.problems.isEmpty ? 0 : 1;
    case null:
      break;
    default:
      stderr.writeln(
        'Usage: mm req [list [--status S] [--component C] | '
        'next | show <id>]',
      );
      return 64;
  }

  if (scan.problems.isNotEmpty) {
    for (final p in scan.problems) {
      stderr.writeln('  $p');
    }
    stderr.writeln('\n${scan.problems.length} requirements problem(s).');
    return 1;
  }

  final components = <String, Map<String, int>>{};
  for (final t in scan.tickets) {
    final counts = components.putIfAbsent(t.component, () => {});
    counts[t.status] = (counts[t.status] ?? 0) + 1;
  }
  stdout.writeln(
    '${'component'.padRight(20)} ${_statuses.map((s) => s.padLeft(12)).join()}',
  );
  for (final name in components.keys.toList()..sort()) {
    final counts = components[name]!;
    stdout.writeln(
      '${name.padRight(20)} '
      '${_statuses.map((s) => '${counts[s] ?? 0}'.padLeft(12)).join()}',
    );
  }
  final totals = _statuses.map(
    (s) => '${scan.tickets.where((t) => t.status == s).length}'.padLeft(12),
  );
  stdout.writeln('${'total'.padRight(20)} ${totals.join()}');
  stdout.writeln(
    '\n${scan.tickets.length} tickets, all valid. '
    'Next id: $_key-${scan.highestNumber + 1}',
  );
  return 0;
}

const _key = 'MM';
const _statuses = ['proposed', 'in-progress', 'done'];
final _fileName = RegExp(
  r'^(STORY|TASK|BUG|EPIC|SPIKE)\.([a-z0-9]+(?:-[a-z0-9]+)*)\.(MM-(\d+))\.md$',
);
final _idPattern = RegExp(r'^MM-\d+$');

RequirementsScan _scan(Directory root) {
  final tickets = <Ticket>[];
  final problems = <String>[];

  for (final entity
      in root.listSync()..sort((a, b) => a.path.compareTo(b.path))) {
    final name = _baseName(entity.path);
    if (entity is File) {
      if (name != 'README.md') {
        problems.add('$name: tickets belong in a component folder.');
      }
      continue;
    }
    if (entity is! Directory) continue;
    if (!RegExp(r'^[a-z0-9]+(-[a-z0-9]+)*$').hasMatch(name)) {
      problems.add('$name/: component folders are kebab-case.');
    }
    final files = entity.listSync()..sort((a, b) => a.path.compareTo(b.path));
    for (final file in files) {
      final fileName = _baseName(file.path);
      final where = '$name/$fileName';
      if (file is! File) {
        problems.add('$where: component folders hold ticket files only.');
        continue;
      }
      final match = _fileName.firstMatch(fileName);
      if (match == null) {
        problems.add(
          '$where: expected TYPE.brief-description.MM-<n>.md '
          '(TYPE is STORY, TASK, BUG, EPIC or SPIKE).',
        );
        continue;
      }
      final id = match[3]!;
      final front = _frontmatter(file.readAsLinesSync());
      if (front == null) {
        problems.add('$where: missing frontmatter.');
        continue;
      }
      if (front['id'] != id) {
        problems.add(
          '$where: frontmatter id "${front['id']}" does not match the '
          'filename id "$id".',
        );
      }
      if (front['component'] != name) {
        problems.add(
          '$where: frontmatter component "${front['component']}" does not '
          'match its folder "$name".',
        );
      }
      final status = front['status'] ?? '';
      if (!_statuses.contains(status)) {
        problems.add(
          '$where: status "$status" is not one of ${_statuses.join(', ')}.',
        );
      }
      final related = _list(front['related']);
      for (final r in related) {
        if (!_idPattern.hasMatch(r)) {
          problems.add('$where: related "$r" is not a short_id.');
        } else if (r == id) {
          problems.add('$where: a ticket cannot be related to itself.');
        }
      }
      tickets.add(
        Ticket(
          component: name,
          fileName: fileName,
          type: match[1]!,
          slug: match[2]!,
          id: id,
          number: int.parse(match[4]!),
          status: status,
          related: related,
        ),
      );
    }
  }

  final byId = <String, List<Ticket>>{};
  for (final t in tickets) {
    byId.putIfAbsent(t.id, () => []).add(t);
  }
  for (final MapEntry(key: id, value: sharing) in byId.entries) {
    if (sharing.length > 1) {
      problems.add(
        '$id is used by ${sharing.length} tickets: '
        '${sharing.map((t) => '${t.component}/${t.fileName}').join(', ')}.',
      );
    }
  }
  for (final t in tickets) {
    for (final r in t.related) {
      if (_idPattern.hasMatch(r) && !byId.containsKey(r)) {
        problems.add(
          '${t.component}/${t.fileName}: related $r does not exist.',
        );
      }
    }
  }

  tickets.sort((a, b) => a.number.compareTo(b.number));
  final highest = tickets.isEmpty ? 0 : tickets.last.number;
  return (tickets: tickets, problems: problems, highestNumber: highest);
}

/// Reads `key: value` pairs between the leading `---` fences.
Map<String, String>? _frontmatter(List<String> lines) {
  if (lines.isEmpty || lines.first.trim() != '---') return null;
  final end = lines.indexWhere((l) => l.trim() == '---', 1);
  if (end == -1) return null;
  final fields = <String, String>{};
  for (final line in lines.sublist(1, end)) {
    final colon = line.indexOf(':');
    if (colon == -1) continue;
    fields[line.substring(0, colon).trim()] = line.substring(colon + 1).trim();
  }
  return fields;
}

/// Parses a YAML flow list such as `[MM-1, MM-2]`.
List<String> _list(String? value) {
  if (value == null) return const [];
  final inner = value.replaceAll(RegExp(r'^\[|\]$'), '').trim();
  if (inner.isEmpty) return const [];
  return [for (final item in inner.split(',')) item.trim()];
}

String? _option(List<String> args, String name) {
  final i = args.indexOf(name);
  return i == -1 || i + 1 >= args.length ? null : args[i + 1];
}

String _baseName(String path) => path.split(RegExp(r'[/\\]')).last;
