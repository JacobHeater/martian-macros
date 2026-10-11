import 'dart:convert';
import 'dart:io';

import 'package:test/test.dart';

import '../src/panel/panel_checker.dart';
import '../src/panel/panel_command.dart';

void main() {
  final source =
      Directory.current.path.endsWith('${Platform.pathSeparator}tool')
      ? Directory.current.parent
      : Directory.current;
  const checker = PanelChecker();
  late Directory root;
  late Directory run;
  late Map<String, dynamic> state;

  void copyDirectory(String path) {
    final from = Directory('${source.path}/$path');
    for (final file in from.listSync(recursive: true).whereType<File>()) {
      final relative = file.path.substring(source.path.length + 1);
      final destination = File('${root.path}/$relative');
      destination.parent.createSync(recursive: true);
      file.copySync(destination.path);
    }
  }

  List<String> checkRun() {
    File('${run.path}/state.json').writeAsStringSync(jsonEncode(state));
    return checker.check(root, run: run);
  }

  Map<String, dynamic> assignment(String role, String status) => {
    'task': 'Check the bounded synthetic test fixture.',
    'role': role,
    'reviewer': 'test-session',
    'status': status,
    'inspected_commit': List.filled(40, 'a').join(),
    'input_hashes': {
      for (final path in [
        'agents/roles/$role.md',
        'agents/panel-protocol.md',
        'agents/review-contract.md',
      ])
        path: List.filled(64, 'b').join(),
    },
    'report': 'findings/$role.md',
    'coverage': {
      'inspected': ['Synthetic fixture only.'],
      'not_inspected': ['Application behavior.'],
      'referrals': <String>[],
      'methods': ['source-inspection'],
      'limitations': 'Synthetic validator fixture, no real audit.',
    },
    'research': {
      'status': 'unnecessary',
      'question': '',
      'reason': 'Mechanical synthetic fixture test.',
      'path': 'not-needed',
      'sources': <Map<String, dynamic>>[],
      'summary': 'No external factual claims in this test fixture.',
      'limitations': 'Synthetic validator test, not a real review.',
    },
  };

  setUp(() {
    root = Directory.systemTemp.createTempSync('mm_panel_test');
    copyDirectory('agents');
    copyDirectory('.claude/agents');
    copyDirectory('.github/agents');
    run = Directory('${root.path}/docs/agent-runs/test-run')
      ..createSync(recursive: true);
    for (final name in ['brief.md', 'decision.md', 'handoff.md']) {
      File('${root.path}/agents/templates/$name').copySync('${run.path}/$name');
    }
    state = jsonDecode(
      File('${root.path}/agents/templates/state.json').readAsStringSync(),
    ) as Map<String, dynamic>;
    state['task_id'] = 'test-run';
    state['baseline'] = {
      'branch': 'test-branch',
      'commit': List.filled(40, 'a').join(),
    };
  });
  tearDown(() => root.deleteSync(recursive: true));

  test('canonical package and initial run validate', () {
    expect(checker.check(root), isEmpty);
    expect(checkRun(), isEmpty);
  });

  test('missing canonical role fails', () {
    File('${root.path}/agents/roles/training.md').deleteSync();
    expect(checker.check(root), contains('Missing agents/roles/training.md'));
  });

  test('role responsibilities and index coverage are required', () {
    final role = File('${root.path}/agents/roles/training.md');
    role.writeAsStringSync(
      role.readAsStringSync().replaceAll('## Exclusions', '## Other'),
    );
    final index = File('${root.path}/agents/README.md');
    index.writeAsStringSync(
      index.readAsStringSync().replaceAll('roles/training.md', 'other.md'),
    );
    final errors = checker.check(root);
    expect(
      errors.any((e) => e.contains('missing section: Exclusions')),
      isTrue,
    );
    expect(errors.any((e) => e.contains('must link')), isTrue);
  });

  test('adapter cannot grant shell tools or lose canonical references', () {
    final file = File('${root.path}/.claude/agents/panel-training.md');
    file.writeAsStringSync(
      file
          .readAsStringSync()
          .replaceAll('tools: Read, Grep, Glob', 'tools: Read, Bash')
          .replaceAll('agents/review-contract.md', 'other.md'),
    );
    final errors = checker.check(root);
    expect(errors.any((e) => e.contains('restricted Claude')), isTrue);
    expect(errors.any((e) => e.contains('review-contract.md')), isTrue);
  });

  test(
    'Copilot coverage, research tools and reviewer restrictions are required',
    () {
      final file = File('${root.path}/.github/agents/panel-training.agent.md');
      file.writeAsStringSync(
        file
            .readAsStringSync()
            .replaceAll('"web"', '"execute"')
            .replaceAll('agents: []', 'agents: ["panel-chair"]'),
      );
      final errors = checker.check(root);
      expect(errors.any((e) => e.contains('Copilot tool allowlist')), isTrue);
      expect(
        errors.any((e) => e.contains('restrict native delegation')),
        isTrue,
      );
      file.deleteSync();
      expect(
        checker.check(root),
        contains('Missing .github/agents/panel-training.agent.md'),
      );
    },
  );

  test('Copilot malformed frontmatter and broken shared references fail', () {
    final file = File('${root.path}/.github/agents/panel-qa.agent.md');
    file.writeAsStringSync(
      file
          .readAsStringSync()
          .replaceAll('agents/review-contract.md', 'other.md')
          .replaceAll('tools: [', 'tools: invalid ['),
    );
    final errors = checker.check(root);
    expect(errors.any((e) => e.contains('not valid JSON')), isTrue);
    expect(errors.any((e) => e.contains('review-contract.md')), isTrue);
  });

  test('performed research cannot be claimed without consulted sources', () {
    final item = assignment('integrations', 'pending');
    (item['research'] as Map)['status'] = 'performed';
    state['assignments'] = [item];
    expect(
      checkRun().any((e) => e.contains('performed research needs')),
      isTrue,
    );
  });

  test('performed evidence requires observed discovery and retrieval, not YAML claims', () {
    final item = assignment('integrations', 'pending');
    final research = item['research'] as Map;
    research['status'] = 'performed';
    research['question'] = 'Synthetic platform question';
    research['path'] = 'chair';
    research['sources'] = [
      {
        'url': 'https://example.com/source',
        'title': 'Synthetic source fixture',
        'published_or_updated': null,
        'accessed': '2026-10-11',
        'claim': 'Test-only fixture, not consulted evidence.',
      },
    ];
    state['assignments'] = [item];
    expect(
      checkRun().any((e) => e.contains('observed discovery/retrieval')),
      isTrue,
    );
    state['research_capabilities'] = [
      {
        'surface': 'Synthetic fixture',
        'discovery': ['fixture-search'],
        'retrieval': ['fixture-fetch'],
        'status': 'observed',
        'checked_at': '2026-10-11',
        'limitations': 'Synthetic validator test only.',
      },
    ];
    expect(checkRun(), isEmpty);
  });

  test('source dates, URL and bounded assignment fields are validated', () {
    final item = assignment('integrations', 'pending');
    item['research'] = {
      'status': 'performed',
      'question': 'Current documented API?',
      'reason': 'Potentially outdated capability.',
      'path': 'chair',
      'sources': [
        {
          'url': 'invented',
          'title': '',
          'published_or_updated': null,
          'accessed': 'yesterday',
          'claim': 'Test-only invalid source.',
        },
      ],
      'summary': 'Test fixture.',
      'limitations': 'Not actual evidence.',
    };
    item.remove('task');
    state['assignments'] = [item];
    final errors = checkRun();
    expect(errors.any((e) => e.contains('missing task')), isTrue);
    expect(errors.any((e) => e.contains('.url has invalid format')), isTrue);
    expect(errors.any((e) => e.contains('.title must not be empty')), isTrue);
    expect(
      errors.any((e) => e.contains('.accessed has invalid format')),
      isTrue,
    );
  });

  test('completed research requires matching report and resolved evidence', () {
    final item = assignment('integrations', 'complete');
    (item['research'] as Map)['status'] = 'blocked';
    (item['research'] as Map)['path'] = 'unavailable';
    state['assignments'] = [item];
    File('${run.path}/findings/integrations.md')
      ..createSync(recursive: true)
      ..writeAsStringSync('Incomplete synthetic report');
    final errors = checkRun();
    expect(errors.any((e) => e.contains('report missing section')), isTrue);
    expect(errors.any((e) => e.contains('unresolved research')), isTrue);
  });

  test('schema role coverage and malformed schema fail clearly', () {
    final file = File('${root.path}/agents/state.schema.json');
    final schema = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
    final properties = schema['properties'] as Map;
    final items = (properties['assignments'] as Map)['items'] as Map;
    final role = (items['properties'] as Map)['role'] as Map;
    (role['enum'] as List).remove('qa');
    file.writeAsStringSync(jsonEncode(schema));
    expect(checker.check(root).any((e) => e.contains('15 canonical')), isTrue);
    file.writeAsStringSync('{}');
    expect(
      checker.check(root),
      contains('Schema missing assignments role enum'),
    );
    file.writeAsStringSync('{');
    expect(
      checker.check(root).any((e) => e.contains('not valid JSON')),
      isTrue,
    );
  });

  test('MM-197 non-object schema cannot bypass panel validation', () async {
    final file = File('${root.path}/agents/state.schema.json');
    for (final content in ['null', '[]', 'true', '"schema"']) {
      file.writeAsStringSync(content);
      expect(checker.check(root), contains('Schema must be a JSON object'));
      expect(await runPanel(root, const []), 1);
    }
  });

  test('MM-197 native saved-run separators validate on Windows', () {
    expect(checkRun(), isEmpty);
    expect(
      checker.check(root, run: Directory(run.path.replaceAll('/', r'\'))),
      isEmpty,
    );
  }, skip: !Platform.isWindows ? 'Windows path semantics' : false);

  test('MM-199 malformed schema keywords fail without throwing', () async {
    final file = File('${root.path}/agents/state.schema.json');
    final original = file.readAsStringSync();
    for (final entry in {
      'required': 'not-a-list',
      'properties': <Object?>[],
      'minLength': 'one',
      'pattern': '[',
      'items': <Object?>[],
      'additionalProperties': 'invalid',
      'enum': 'invalid',
      'type': ['object', 1],
    }.entries) {
      final schema = jsonDecode(original) as Map<String, dynamic>;
      schema[entry.key] = entry.value;
      file.writeAsStringSync(jsonEncode(schema));
      expect(
        checker.check(root).any((e) => e.contains('Schema keyword')),
        isTrue,
      );
      expect(await runPanel(root, const []), 1);
    }
  });

  test('template schema rejects extra fields and invalid enums', () {
    final file = File('${root.path}/agents/templates/state.json');
    state['phase'] = 'invented';
    state['extra'] = true;
    file.writeAsStringSync(jsonEncode(state));
    final errors = checker.check(root);
    expect(errors, contains('template.phase has unsupported value'));
    expect(errors, contains('template has unknown field extra'));
  });

  test(
    'MM-201 audit mode, coverage and canonical audit invocation are required',
    () {
      state['audit_mode'] = 'planning-only';
      final item = assignment('nutrition', 'complete');
      (item['coverage'] as Map)['inspected'] = <String>[];
      (item['coverage'] as Map)['methods'] = <String>[];
      state['assignments'] = [item];
      expect(checkRun(), contains('state.audit_mode has unsupported value'));
      state['audit_mode'] = 'feature';
      expect(
        checkRun().any((e) => e.contains('completed audit needs')),
        isTrue,
      );
      item.remove('coverage');
      expect(checkRun(), contains('state.assignments[0] missing coverage'));
      final role = File('${root.path}/agents/roles/nutrition.md');
      role.writeAsStringSync(
        role.readAsStringSync().replaceAll(
          '## Existing implementation audit',
          '## Other',
        ),
      );
      final adapter = File(
        '${root.path}/.github/agents/panel-nutrition.agent.md',
      );
      adapter.writeAsStringSync(
        adapter.readAsStringSync().replaceAll(
          'existing-implementation audit protocol',
          'planning only',
        ),
      );
      final errors = checker.check(root);
      expect(
        errors.any(
          (e) => e.contains('missing section: Existing implementation audit'),
        ),
        isTrue,
      );
      expect(
        errors.any((e) => e.contains('missing shared audit invocation')),
        isTrue,
      );
    },
  );

  test('run requires identity, real baseline and local artifacts', () {
    state['task_id'] = 'wrong-dir';
    (state['baseline'] as Map)['commit'] = List.filled(40, '0').join();
    File('${run.path}/brief.md').deleteSync();
    final errors = checkRun();
    expect(errors.any((e) => e.contains('Run must live')), isTrue);
    expect(errors.any((e) => e.contains('placeholder')), isTrue);
    expect(errors.any((e) => e.contains('brief.md')), isTrue);
  });

  test('edit ownership and checkpoint stop acknowledgement are mandatory', () {
    state['phase'] = 'edits';
    expect(checkRun(), contains('Edits require one designated owner'));
    state['phase'] = 'checkpoint';
    state['owner'] = {
      'identity': 'writer',
      'paths': ['../outside'],
    };
    final errors = checkRun();
    expect(errors.any((e) => e.contains('repository-relative paths')), isTrue);
    expect(errors.any((e) => e.contains('Checkpoint requires')), isTrue);
  });

  test('complete review needs report, commit and canonical hashes', () {
    final item = assignment('training', 'complete');
    item['inspected_commit'] = null;
    item['input_hashes'] = <String, dynamic>{};
    state['assignments'] = [item];
    final errors = checkRun();
    expect(errors.any((e) => e.contains('needs a commit')), isTrue);
    expect(errors.any((e) => e.contains('missing canonical input')), isTrue);
    expect(errors.any((e) => e.contains('report missing')), isTrue);
  });

  test('report traversal and duplicate assignments fail', () {
    final item = assignment('training', 'pending');
    item['report'] = '../outside.md';
    item['input_hashes'] = {'../outside': List.filled(64, 'a').join()};
    state['assignments'] = [item, assignment('training', 'pending')];
    final errors = checkRun();
    expect(errors.any((e) => e.contains('Duplicate assignment')), isTrue);
    expect(
      errors.any((e) => e.contains('must be findings/training.md')),
      isTrue,
    );
    expect(errors.any((e) => e.contains('input paths')), isTrue);
  });

  test('actual exit code must match the recorded test result', () {
    state['tests'] = [
      {
        'command': 'mm test tool',
        'commit': List.filled(40, 'a').join(),
        'dirty': true,
        'exit_code': 1,
        'result': 'passed',
        'summary': 'Inconsistent test fixture',
      },
    ];
    expect(
      checkRun(),
      contains('Test result/exit code disagree: mm test tool'),
    );
  });

  test('complete phase cannot conceal pending work or stale reviews', () {
    state['phase'] = 'complete';
    state['assignments'] = [assignment('training', 'stale')];
    final errors = checkRun();
    expect(errors.any((e) => e.contains('Core role')), isTrue);
    expect(errors.any((e) => e.contains('unresolved work')), isTrue);
  });

  test('checkpoint with completed/omitted core reviews validates', () {
    state['phase'] = 'checkpoint';
    state['checkpoint'] = {
      'at': '2026-10-11T02:00:00Z',
      'writers_stopped': true,
    };
    final brief = File('${run.path}/brief.md');
    brief.writeAsStringSync(
      '${brief.readAsStringSync()}\nMechanical fixture; domain review unnecessary.\n',
    );
    state['assignments'] = [
      assignment('chair', 'complete'),
      for (final role in [
        'training',
        'nutrition',
        'coaching',
        'measurement',
        'safety',
      ])
        {
          ...assignment(role, 'omitted'),
          'omission_reason': 'Mechanical fixture; domain review unnecessary.',
        },
    ];
    File('${run.path}/findings/chair.md')
      ..createSync(recursive: true)
      ..writeAsStringSync(
        File('${root.path}/agents/templates/findings/role.md')
            .readAsStringSync(),
      );
    expect(checkRun(), isEmpty);
  });

  test('MM-200 complete runs cannot omit reviews without recorded reasons', () {
    state['phase'] = 'complete';
    state['pending_work'] = <String>[];
    state['checkpoint'] = {
      'at': '2026-10-11T02:00:00Z',
      'writers_stopped': true,
    };
    state['assignments'] = [
      for (final role in [
        'chair',
        'training',
        'nutrition',
        'coaching',
        'measurement',
        'safety',
      ])
        assignment(role, 'omitted'),
    ];
    expect(
      checkRun().any((e) => e.contains('omission needs a recorded reason')),
      isTrue,
    );
    for (final item
        in (state['assignments'] as List).cast<Map<String, dynamic>>()) {
      item['omission_reason'] =
          'Mechanical fixture; domain review unnecessary.';
    }
    expect(
      checkRun().any(
        (e) => e.contains('omission reason missing from brief/report'),
      ),
      isTrue,
    );
    final brief = File('${run.path}/brief.md');
    brief.writeAsStringSync(
      '${brief.readAsStringSync()}\nMechanical fixture; domain review unnecessary.\n',
    );
    expect(checkRun(), isEmpty);
  });

  test('command validates package and rejects unsupported flags', () async {
    expect(await runPanel(root, const []), 0);
    expect(await runPanel(root, const ['--repair']), 64);
  });
}
