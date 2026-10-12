/// What one `gh` invocation returned.
final class GhResult {
  const GhResult({required this.exitCode, this.stdout = '', this.stderr = ''});

  final int exitCode;
  final String stdout;
  final String stderr;
}
