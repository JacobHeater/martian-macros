import 'dart:convert';

import 'roadmap_ticket.dart';

/// The JSON the progress page embeds: every ticket, and the roadmap's own
/// structure (milestones, workstreams). Status is taken from [tickets].
String roadmapPageData({
  required Map<String, Object?> roadmap,
  required List<RoadmapTicket> tickets,
  required String generatedOn,
}) {
  final data = {
    'generatedOn': generatedOn,
    'milestones': roadmap['milestones'],
    'workstreams': [
      for (final w
          in (roadmap['workstreams'] as List).cast<Map<String, Object?>>())
        {
          'id': w['id'],
          'name': w['name'],
          'intent': w['intent'],
          'order': w['recommendedOrder'],
          'risk': w['riskLevel'],
          'dependsOn': w['dependsOn'],
          'sequence': w['sequence'],
          'gate': w['gate'],
          'listed': w['sourceRequirements'],
        },
    ],
    'tickets': {for (final t in tickets) t.id: t.toJson()},
  };
  // Keep "</script>" inside a string from ending the page's script block.
  return jsonEncode(data).replaceAll('</', r'<\/');
}
