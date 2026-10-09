import 'dart:io';

import 'roadmap_ticket.dart';

/// Reads every ticket under [requirements]: id, status, component and the
/// title from its first heading. Validation is `mm req`'s job, not this one's.
List<RoadmapTicket> readRoadmapTickets(Directory requirements) {
  final tickets = <RoadmapTicket>[];
  for (final dir in requirements.listSync().whereType<Directory>()) {
    for (final file in dir.listSync().whereType<File>()) {
      final text = file.readAsStringSync().replaceAll('\r\n', '\n');
      final id = _field(text, 'id');
      if (id == null) continue;
      final heading = RegExp(r'^# (.+)$', multiLine: true).firstMatch(text);
      tickets.add(
        RoadmapTicket(
          id: id,
          title: _title(heading?.group(1) ?? id),
          status: _field(text, 'status') ?? 'proposed',
          component: _field(text, 'component') ?? '',
        ),
      );
    }
  }
  tickets.sort((a, b) => _number(a.id).compareTo(_number(b.id)));
  return tickets;
}

int _number(String id) => int.tryParse(id.split('-').last) ?? 0;

String? _field(String text, String name) => RegExp(
  '^$name: *(.+)\$',
  multiLine: true,
).firstMatch(text)?.group(1)?.trim();

/// "Task: A register" becomes "A register".
String _title(String heading) =>
    heading.replaceFirst(RegExp(r'^(Task|Story|Epic|Bug|Spike): *'), '');
