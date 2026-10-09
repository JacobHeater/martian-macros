import 'dart:convert';

import 'package:test/test.dart';

import '../src/roadmap/roadmap_page_data.dart';
import '../src/roadmap/roadmap_ticket.dart';

void main() {
  final roadmap = <String, Object?>{
    'asOf': '2026-10-08',
    'milestones': [
      {'id': 'M1', 'name': 'First'},
    ],
    'workstreams': [
      {
        'id': 'WS-01',
        'name': 'One </script>',
        'intent': 'x',
        'recommendedOrder': 1,
        'riskLevel': 'low',
        'dependsOn': <String>[],
        'sequence': <Object?>[],
        'gate': null,
        'sourceRequirements': {
          'built': ['MM-1'],
          'remaining': ['MM-2'],
        },
      },
    ],
  };
  final tickets = [
    const RoadmapTicket(id: 'MM-1', title: 'A', status: 'done', component: 'c'),
    const RoadmapTicket(
      id: 'MM-2',
      title: 'B',
      status: 'proposed',
      component: 'c',
    ),
  ];

  test('the page data carries ticket status from the tickets', () {
    final json = roadmapPageData(
      roadmap: roadmap,
      tickets: tickets,
      generatedOn: '2026-10-08',
    );
    final data =
        jsonDecode(json.replaceAll(r'<\/', '</')) as Map<String, Object?>;
    final byId = data['tickets']! as Map<String, Object?>;
    expect((byId['MM-1']! as Map<String, Object?>)['status'], 'done');
    expect((byId['MM-2']! as Map<String, Object?>)['status'], 'proposed');
    final ws =
        (data['workstreams']! as List<Object?>).single! as Map<String, Object?>;
    final listed = ws['listed']! as Map<String, Object?>;
    expect(listed['built'], ['MM-1']);
  });

  test('a closing script tag in a string cannot end the page script', () {
    final json = roadmapPageData(
      roadmap: roadmap,
      tickets: tickets,
      generatedOn: '2026-10-08',
    );
    expect(json, isNot(contains('</')));
  });
}
