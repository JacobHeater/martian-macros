import 'dart:convert';
import 'dart:io';

/// Locates the Flutter/Dart toolchain and runs processes in the repo.
///
/// Resolution order:
///  1. `MM_FLUTTER_ROOT` env var: `<root>/bin/flutter` and `<root>/bin/dart`.
///  2. FVM, when `.fvmrc` exists and `fvm` is on PATH (`fvm flutter ...`).
///  3. `flutter` / `dart` on PATH.
final class Toolchain {
  Toolchain._(this.repoRoot, this._flutter, this._dart, this.description);

  factory Toolchain.detect(Directory repoRoot) {
    final override = Platform.environment['MM_FLUTTER_ROOT'];
    if (override != null && override.isNotEmpty) {
      final bin =
          '$override${Platform.pathSeparator}bin${Platform.pathSeparator}';
      return Toolchain._(
        repoRoot,
        ['${bin}flutter'],
        ['${bin}dart'],
        'MM_FLUTTER_ROOT=$override',
      );
    }
    final hasFvmrc = File(_join(repoRoot.path, '.fvmrc')).existsSync();
    if (hasFvmrc && _onPath('fvm')) {
      return Toolchain._(
        repoRoot,
        ['fvm', 'flutter'],
        ['fvm', 'dart'],
        'FVM (.fvmrc)',
      );
    }
    return Toolchain._(repoRoot, ['flutter'], ['dart'], 'PATH');
  }

  final Directory repoRoot;
  final List<String> _flutter;
  final List<String> _dart;
  final String description;

  /// The Flutter version pinned in `.fvmrc`, if any.
  String? get pinnedFlutterVersion {
    final file = File(_join(repoRoot.path, '.fvmrc'));
    if (!file.existsSync()) return null;
    final json = jsonDecode(file.readAsStringSync()) as Map<String, Object?>;
    return json['flutter'] as String?;
  }

  Future<int> flutter(List<String> args, {String? inDir}) =>
      run([..._flutter, ...args], inDir: inDir);

  Future<int> dart(List<String> args, {String? inDir}) =>
      run([..._dart, ...args], inDir: inDir);

  /// Captures `flutter --version --machine`; null if Flutter isn't found.
  Future<String?> flutterVersion() async {
    try {
      final result = await Process.run(
        _flutter.first,
        [..._flutter.skip(1), '--version', '--machine'],
        runInShell: Platform.isWindows,
        workingDirectory: repoRoot.path,
      );
      if (result.exitCode != 0) return null;
      final json = jsonDecode(result.stdout as String) as Map<String, Object?>;
      return json['frameworkVersion'] as String?;
    } on ProcessException {
      return null;
    } on FormatException {
      return null;
    }
  }

  /// Runs `flutter <args>` and returns its stdout, or null on failure.
  Future<String?> captureFlutter(List<String> args) async {
    try {
      final result = await Process.run(
        _flutter.first,
        [..._flutter.skip(1), ...args],
        runInShell: Platform.isWindows,
        workingDirectory: repoRoot.path,
        // Flutter prints UTF-8; the Windows default would garble it.
        stdoutEncoding: const Utf8Codec(allowMalformed: true),
      );
      return result.exitCode == 0 ? result.stdout as String : null;
    } on ProcessException {
      return null;
    }
  }

  /// Ids of connected phones, tablets, and running emulators/simulators
  /// (desktop and web targets are excluded: the app doesn't build for them).
  Future<List<String>> mobileDeviceIds() async {
    final out = await captureFlutter(['devices', '--machine']);
    if (out == null) return const [];
    final start = out.indexOf('[');
    final end = out.lastIndexOf(']');
    if (start == -1 || end < start) return const [];
    try {
      final devices =
          jsonDecode(out.substring(start, end + 1)) as List<Object?>;
      return [
        for (final d in devices.cast<Map<String, Object?>>())
          if (RegExp(r'^(android|ios)').hasMatch('${d['targetPlatform']}'))
            '${d['id']}',
      ];
    } on FormatException {
      return const [];
    }
  }

  /// Ids of installed emulators/simulators, parsed from `flutter emulators`
  /// (which has no machine-readable mode): rows are `id • name • vendor •
  /// platform`.
  Future<List<String>> emulatorIds() async {
    final out = await captureFlutter(['emulators']) ?? '';
    return [
      for (final line in out.split('\n'))
        // Split on the bullet, or whatever non-ASCII it was decoded as.
        if (line.split(RegExp(r'\s[^\x00-\x7F]+\s'))
            case [final id, _, _, final platform]
            when id.trim() != 'Id' && RegExp(r'android|ios').hasMatch(platform))
          id.trim(),
    ];
  }

  /// Runs [command] with inherited stdio, from [inDir] relative to the repo
  /// root. Returns the exit code.
  Future<int> run(List<String> command, {String? inDir}) async {
    final dir = inDir == null ? repoRoot.path : _join(repoRoot.path, inDir);
    stdout.writeln(
      '\x1B[2m\$ ${command.join(' ')}  (in ${inDir ?? '.'})\x1B[0m',
    );
    try {
      final process = await Process.start(
        command.first,
        command.skip(1).toList(),
        workingDirectory: dir,
        mode: ProcessStartMode.inheritStdio,
        // .bat/.cmd shims (flutter.bat, fvm.bat) need a shell on Windows.
        runInShell: Platform.isWindows,
      );
      return await process.exitCode;
    } on ProcessException catch (e) {
      stderr.writeln('Could not start "${command.first}": ${e.message}');
      stderr.writeln('Run `mm doctor` for toolchain help.');
      return 127;
    }
  }

  static bool _onPath(String executable) {
    final result = Process.runSync(Platform.isWindows ? 'where' : 'which', [
      executable,
    ], runInShell: Platform.isWindows);
    return result.exitCode == 0;
  }
}

String _join(String a, String b) => '$a${Platform.pathSeparator}$b';
