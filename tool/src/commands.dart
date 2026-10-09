import 'dart:io';

import 'arch/arch_command.dart';
import 'command.dart';
import 'requirements.dart';
import 'roadmap/roadmap_report_command.dart';
import 'toolchain.dart';

/// Workspace packages. `flutter: true` packages are tested with
/// `flutter test`; pure-Dart ones with `dart test`.
const _packages = <({String path, bool flutter})>[
  (path: 'packages/domain', flutter: false),
  (path: 'packages/engine', flutter: false),
  (path: 'packages/data', flutter: false),
  (path: 'packages/fixtures', flutter: false),
  (path: 'apps/mobile', flutter: true),
  (path: 'tool', flutter: false),
];

/// A test that waits longer than this fails instead of hanging the run (MM-93).
/// Widget tests run on a fake clock, so one that awaits real I/O never ends.
const _testTimeout = '60s';

const _appDir = 'apps/mobile';
const _envs = ['dev', 'prod'];

final _commands = <String, (String, Command)>{
  'doctor': ('Check the toolchain and pinned Flutter version', _doctor),
  'bootstrap': ('Resolve dependencies for the whole workspace', _bootstrap),
  'check': ('CI gate: format, requirements, arch, analyze, test', _check),
  'test': ('Run tests: mm test [package-path ...]', _test),
  'goldens': ('Screenshot tests (Linux only): mm goldens [--update]', _goldens),
  'roadmap': (
    'Write roadmap/progress.html, the progress page: mm roadmap [--check]',
    _roadmap,
  ),
  'evidence': (
    'Copy docs/evidence.md into the app assets: mm evidence [--check]',
    _evidence,
  ),
  'analyze': ('Static analysis for every package', _analyze),
  'format': ('Format all Dart code (--check to verify only)', _format),
  'gen': ('Run code generation in packages that use build_runner', _gen),
  'schema': (
    'Export the database schema snapshot for the current version',
    _schema,
  ),
  'run': (
    'Run the app (starts an emulator if needed): mm run [--env ..]',
    _run,
  ),
  'emulator': (
    'Start an emulator: mm emulator [id] [--cold] | list',
    _emulator,
  ),
  'build': ('Build: mm build <android|ios> [--env dev|prod]', _build),
  'clean': ('Remove build outputs and caches', _clean),
  'arch': (
    'Engineering rules: one declaration per file (--init writes the baseline)',
    _arch,
  ),
  'req': (
    'Requirements: mm req [list | next | show <id>] (no args validates)',
    _req,
  ),
};

Future<int> runCli(List<String> args) async {
  if (args.isEmpty || const {'help', '-h', '--help'}.contains(args.first)) {
    _printHelp();
    return args.isEmpty ? 64 : 0;
  }
  final entry = _commands[args.first];
  if (entry == null) {
    stderr.writeln('Unknown command "${args.first}".\n');
    _printHelp();
    return 64;
  }
  final toolchain = Toolchain.detect(_findRepoRoot());
  return entry.$2(toolchain, args.sublist(1));
}

void _printHelp() {
  stdout.writeln('Martian Macros task runner\n\nUsage: mm <command> [args]\n');
  for (final MapEntry(:key, :value) in _commands.entries) {
    stdout.writeln('  ${key.padRight(10)} ${value.$1}');
  }
  stdout.writeln(
    '\nToolchain: MM_FLUTTER_ROOT, else FVM (.fvmrc), else flutter on PATH.',
  );
}

Directory _findRepoRoot() {
  // tool/bin/mm.dart -> repo root is two levels up from this script's dir.
  final script = File.fromUri(Platform.script);
  var dir = script.parent;
  while (!File('${dir.path}${Platform.pathSeparator}.fvmrc').existsSync()) {
    final parent = dir.parent;
    if (parent.path == dir.path) return Directory.current;
    dir = parent;
  }
  return dir;
}

Future<int> _doctor(Toolchain tc, List<String> args) async {
  stdout
    ..writeln('OS:         ${Platform.operatingSystem}')
    ..writeln('Toolchain:  ${tc.description}');
  final pinned = tc.pinnedFlutterVersion;
  final actual = await tc.flutterVersion();
  stdout
    ..writeln('Pinned:     ${pinned ?? '(none)'}')
    ..writeln('Found:      ${actual ?? 'NOT FOUND'}');

  if (actual == null) {
    stderr.writeln(
      '\nFlutter not found. Install FVM (https://fvm.app) and run '
      '`fvm install` in the repo root, or set MM_FLUTTER_ROOT.',
    );
    return 1;
  }
  if (pinned != null && actual != pinned) {
    stderr.writeln(
      '\nVersion mismatch: repo pins $pinned. '
      'Run `fvm install` (or `fvm use $pinned`).',
    );
    return 1;
  }
  if (!Platform.isMacOS) {
    stdout.writeln(
      '\nNote: iOS builds require macOS; Android builds only here.',
    );
  }
  stdout.writeln('\nToolchain OK.');
  return 0;
}

Future<int> _bootstrap(Toolchain tc, List<String> args) =>
    tc.flutter(['pub', 'get']);

Future<int> _check(Toolchain tc, List<String> args) async {
  for (final step in <Future<int> Function()>[
    () => _format(tc, const ['--check']),
    () => _req(tc, const []),
    () => _arch(tc, const []),
    () => _analyze(tc, const []),
    () => _test(tc, const []),
  ]) {
    final code = await step();
    if (code != 0) return code;
  }
  stdout.writeln('\nAll checks passed.');
  return 0;
}

Future<int> _test(Toolchain tc, List<String> args) async {
  final selected = args.isEmpty
      ? _packages
      : _packages.where((p) => args.any((a) => _samePath(a, p.path))).toList();
  if (selected.isEmpty) {
    stderr.writeln(
      'No matching packages. Known: ${_packages.map((p) => p.path).join(', ')}',
    );
    return 64;
  }
  var failed = 0;
  for (final p in selected) {
    if (!Directory('${tc.repoRoot.path}/${p.path}/test').existsSync()) continue;
    final code = p.flutter
        ? await tc.flutter(['test', '--timeout', _testTimeout], inDir: p.path)
        : await tc.dart(['test', '--timeout', _testTimeout], inDir: p.path);
    if (code != 0) failed++;
  }
  return failed == 0 ? 0 : 1;
}

/// Runs the screenshot tests, or regenerates their images with `--update`.
///
/// The images are generated on one platform only, Linux (CI), because text
/// renders differently on each operating system (MM-105). Elsewhere this
/// explains how to get them instead of producing images that would not match.
Future<int> _goldens(Toolchain tc, List<String> args) async {
  if (!Platform.isLinux && !args.contains('--force')) {
    stdout.writeln(
      'Screenshot tests run on Linux only (text renders differently on each '
      'operating system).\n'
      'To update the images, run the "Update goldens" workflow on GitHub '
      '(Actions tab), download its artifact and commit the images; CI runs '
      'the comparison on every pull request.',
    );
    return 0;
  }
  return tc.flutter([
    'test',
    '--timeout',
    _testTimeout,
    'test/goldens',
    if (args.contains('--update')) '--update-goldens',
  ], inDir: 'apps/mobile');
}

/// The app ships a copy of the evidence register (MM-143); this keeps it in step.
Future<int> _evidence(Toolchain tc, List<String> args) async {
  final source = File('docs/evidence.md');
  final copy = File('apps/mobile/assets/evidence.md');
  if (args.contains('--check')) {
    final same =
        copy.existsSync() &&
        source.readAsStringSync() == copy.readAsStringSync();
    if (!same) stderr.writeln('Run "mm evidence" to refresh the app copy.');
    return same ? 0 : 1;
  }
  copy.writeAsStringSync(source.readAsStringSync());
  stdout.writeln('Copied docs/evidence.md to apps/mobile/assets/evidence.md.');
  return 0;
}

Future<int> _analyze(Toolchain tc, List<String> args) =>
    tc.dart(['analyze', '--fatal-infos', ...args]);

Future<int> _format(Toolchain tc, List<String> args) {
  final check = args.contains('--check');
  return tc.dart([
    'format',
    if (check) ...['--output=none', '--set-exit-if-changed'],
    'apps',
    'packages',
    'tool',
  ]);
}

Future<int> _gen(Toolchain tc, List<String> args) async {
  var ran = false;
  for (final p in _packages) {
    final pubspec = File('${tc.repoRoot.path}/${p.path}/pubspec.yaml');
    if (!pubspec.readAsStringSync().contains('build_runner:')) continue;
    ran = true;
    final code = await tc.dart(['run', 'build_runner', 'build'], inDir: p.path);
    if (code != 0) return code;
  }
  if (!ran) stdout.writeln('No packages use build_runner yet.');
  return 0;
}

const _dataDir = 'packages/data';
const _schemaDir = 'drift_schemas';

/// Exports the Drift schema snapshot for the current `schemaVersion` and
/// regenerates the helpers the migration tests read.
///
/// Refuses to replace an existing snapshot: a released version's schema
/// never changes, so a changed table needs a version bump first.
Future<int> _schema(Toolchain tc, List<String> args) async {
  final dataDir = '${tc.repoRoot.path}/$_dataDir';
  final source = File('$dataDir/lib/src/app_database.dart').readAsStringSync();
  final version = RegExp(r'currentSchemaVersion = (\d+);')
      .firstMatch(source)
      ?.group(1);
  if (version == null) {
    stderr.writeln('Could not find currentSchemaVersion in app_database.dart.');
    return 1;
  }
  final snapshot = File('$dataDir/$_schemaDir/drift_schema_v$version.json');
  if (snapshot.existsSync() && !args.contains('--force')) {
    stderr.writeln(
      'A snapshot for schema version $version already exists. If a table '
      'changed, bump currentSchemaVersion and add a migration step first. '
      '(--force replaces it; only for a version that was never released.)',
    );
    return 1;
  }
  var code = await tc.dart([
    'run',
    'drift_dev',
    'schema',
    'dump',
    'lib/src/app_database.dart',
    '$_schemaDir/',
  ], inDir: _dataDir);
  if (code != 0) return code;
  code = await tc.dart([
    'run',
    'drift_dev',
    'schema',
    'generate',
    '$_schemaDir/',
    'test/generated_migrations/',
  ], inDir: _dataDir);
  if (code != 0) return code;
  return tc.dart(['format', '$_dataDir/test/generated_migrations']);
}

/// Makes sure a phone or emulator is connected, starting an emulator if
/// needed. [emulatorId] defaults to `MM_EMULATOR`, else the first installed.
///
/// [cold] skips the saved snapshot, which fixes an emulator that hangs
/// while restoring state.
Future<int> _ensureDevice(
  Toolchain tc, {
  String? emulatorId,
  bool cold = false,
}) async {
  if ((await tc.mobileDeviceIds()).isNotEmpty) return 0;

  final installed = await tc.emulatorIds();
  final id =
      emulatorId ??
      Platform.environment['MM_EMULATOR'] ??
      (installed.isEmpty ? null : installed.first);
  if (id == null) {
    stderr.writeln(
      'No phone connected and no emulator installed. Create one in Android '
      'Studio (Virtual Device Manager) or plug in a device with USB '
      'debugging enabled.',
    );
    return 69;
  }
  if (!installed.contains(id)) {
    stderr.writeln(
      'Emulator "$id" not found. Installed: '
      '${installed.isEmpty ? '(none)' : installed.join(', ')}',
    );
    return 64;
  }

  final code = await tc.flutter([
    'emulators',
    '--launch',
    id,
    if (cold) '--cold',
  ]);
  if (code != 0) return code;

  stdout.write('Waiting for $id to boot');
  final deadline = DateTime.now().add(const Duration(minutes: 3));
  while (DateTime.now().isBefore(deadline)) {
    if ((await tc.mobileDeviceIds()).isNotEmpty) {
      stdout.writeln(' ready.');
      return 0;
    }
    stdout.write('.');
    await Future<void>.delayed(const Duration(seconds: 3));
  }
  stderr.writeln(
    '\nTimed out waiting for $id. If its window is stuck, close it and run '
    '`mm emulator --cold` to boot without the saved snapshot.',
  );
  return 69;
}

Future<int> _emulator(Toolchain tc, List<String> args) async {
  if (args.firstOrNull == 'list') {
    final ids = await tc.emulatorIds();
    stdout.writeln(ids.isEmpty ? 'No emulators installed.' : ids.join('\n'));
    return 0;
  }
  final ids = args.where((a) => !a.startsWith('--'));
  final code = await _ensureDevice(
    tc,
    emulatorId: ids.firstOrNull,
    cold: args.contains('--cold'),
  );
  if (code == 0) stdout.writeln('Device ready.');
  return code;
}

Future<int> _run(Toolchain tc, List<String> args) async {
  final (env, rest) = _takeEnv(args);
  if (env == null) return 64;
  // An explicit device choice is the caller's business; otherwise make
  // sure there is something to run on.
  final choseDevice = rest.any((a) => a == '-d' || a.startsWith('--device-id'));
  if (!choseDevice) {
    final code = await _ensureDevice(tc);
    if (code != 0) return code;
  }
  return tc.flutter([
    'run',
    '--dart-define-from-file=../../config/$env.json',
    ...rest,
  ], inDir: _appDir);
}

Future<int> _build(Toolchain tc, List<String> args) async {
  if (args.isEmpty || !const {'android', 'ios'}.contains(args.first)) {
    stderr.writeln('Usage: mm build <android|ios> [--env dev|prod]');
    return 64;
  }
  final target = args.first;
  final (env, rest) = _takeEnv(args.sublist(1));
  if (env == null) return 64;
  if (target == 'ios' && !Platform.isMacOS) {
    stderr.writeln(
      'iOS builds require macOS with Xcode. Run this on a Mac or in CI.',
    );
    return 69;
  }
  return tc.flutter([
    'build',
    if (target == 'android') 'appbundle' else 'ipa',
    '--dart-define-from-file=../../config/$env.json',
    ...rest,
  ], inDir: _appDir);
}

Future<int> _clean(Toolchain tc, List<String> args) async {
  final code = await tc.flutter(['clean'], inDir: _appDir);
  for (final p in _packages.where((p) => !p.flutter)) {
    for (final name in ['.dart_tool', 'build', 'coverage']) {
      final dir = Directory('${tc.repoRoot.path}/${p.path}/$name');
      if (dir.existsSync()) dir.deleteSync(recursive: true);
    }
  }
  return code;
}

/// Extracts `--env <name>` (default `dev`). Returns a null env on error.
(String?, List<String>) _takeEnv(List<String> args) {
  final rest = [...args];
  var env = 'dev';
  final i = rest.indexOf('--env');
  if (i != -1) {
    if (i + 1 >= rest.length || !_envs.contains(rest[i + 1])) {
      stderr.writeln('--env must be one of: ${_envs.join(', ')}');
      return (null, rest);
    }
    env = rest[i + 1];
    rest.removeRange(i, i + 2);
  }
  return (env, rest);
}

bool _samePath(String a, String b) {
  String norm(String s) =>
      s.replaceAll(r'\', '/').replaceAll(RegExp(r'^\./|/$'), '');
  return norm(a) == norm(b) || norm(b).endsWith('/${norm(a)}');
}

Future<int> _req(Toolchain tc, List<String> args) =>
    runRequirements(tc.repoRoot, args);

Future<int> _roadmap(Toolchain tc, List<String> args) =>
    runRoadmapReport(tc.repoRoot, args);

Future<int> _arch(Toolchain tc, List<String> args) =>
    runArch(tc.repoRoot, args);
