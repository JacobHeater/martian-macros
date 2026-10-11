import 'dart:convert';
import 'dart:io';

import 'package:test/test.dart';

import '../src/panel/panel_checker.dart';
import '../src/panel/panel_command.dart';

void main() {
  final source = Directory.current.path.endsWith('${Platform.pathSeparator}tool')
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
  };

  setUp(() {
    root = Directory.systemTemp.createTempSync('mm_panel_test');
    copyDirectory('agents');
    // Copy only permitted Claude profiles, never inspect Copilot agent files.
    copyDirectory('.claude/agents');
    run = Directory('${root.path}/docs/agent-runs/test-run')
      ..createSync(recursive: true);
    for (final name in ['brief.md', 'decision.md', 'handoff.md']) {
      File('${root.path}/agents/templates/$name').copySync('${run.path}/$name');
    }
    state =
        jsonDecode(
              File('${root.path}/agents/templates/state.json').readAsStringSync(),
            )
            as Map<String, dynamic>;
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
    expect(errors.any((e) => e.contains('missing section: Exclusions')), isTrue);
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

  test('schema role coverage and malformed schema fail clearly', () {
    final file = File('${root.path}/agents/state.schema.json');
    final schema = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
    final items = schema['properties']['assignments']['items'];
    items['properties']['role']['enum'].remove('qa');
    file.writeAsStringSync(jsonEncode(schema));
    expect(checker.check(root).any((e) => e.contains('15 canonical')), isTrue);
    file.writeAsStringSync('{}');
    expect(checker.check(root), contains('Schema missing assignments role enum'));
    file.writeAsStringSync('{');
    expect(checker.check(root).any((e) => e.contains('not valid JSON')), isTrue);
  });

  test('MM-195 non-object schema cannot bypass panel validation', () async {
    final file = File('${root.path}/agents/state.schema.json');
    for (final content in ['null', '[]', 'true', '"schema"']) {
      file.writeAsStringSync(content);
      expect(checker.check(root), contains('Schema must be a JSON object'));
      expect(await runPanel(root, const []), 1);
    }
  });

  test('MM-195 native saved-run separators validate on Windows', () {
    expect(
      checker.check(root, run: Directory(run.path.replaceAll('/', r'\'))),
      isEmpty,
    );
  }, skip: !Platform.isWindows ? 'Windows path semantics' : false);

  test('template schema rejects extra fields and invalid enums', () {
    final file = File('${root.path}/agents/templates/state.json');
    state['phase'] = 'invented';
    state['extra'] = true;
    file.writeAsStringSync(jsonEncode(state));
    final errors = checker.check(root);
    expect(errors, contains('template.phase has unsupported value'));
    expect(errors, contains('template has unknown field extra'));
  });

  test('run requires identity, real baseline and local artifacts', () {
    state['task_id'] = 'wrong-dir';
    state['baseline']['commit'] = List.filled(40, '0').join();
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
    expect(errors.any((e) => e.contains('must be findings/training.md')), isTrue);
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
    expect(checkRun(), contains('Test result/exit code disagree: mm test tool'));
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
    state['assignments'] = [
      assignment('chair', 'complete'),
      for (final role in [
        'training',
        'nutrition',
        'coaching',
        'measurement',
        'safety',
      ])
        assignment(role, 'omitted'),
    ];
    File('${run.path}/findings/chair.md')
      ..createSync(recursive: true)
      ..writeAsStringSync('Synthetic test report');
    expect(checkRun(), isEmpty);
  });

  test('command validates package and rejects unsupported flags', () async {
    expect(await runPanel(root, const []), 0);
    expect(await runPanel(root, const ['--repair']), 64);
  });
}
