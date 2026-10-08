import 'arch_violation.dart';
import 'source_scrubber.dart';

/// Files under [appliesTo] may not use any of [identifiers], except under
/// one of the [allowedPrefixes]. Comments and strings are ignored.
final class ForbiddenIdentifierRule {
  const ForbiddenIdentifierRule({
    required this.appliesTo,
    required this.identifiers,
    required this.reason,
    this.allowedPrefixes = const [],
    this.scrubber = const SourceScrubber(),
  });

  /// Repo-relative path prefix, with `/`.
  final String appliesTo;
  final List<String> identifiers;
  final String reason;
  final List<String> allowedPrefixes;
  final SourceScrubber scrubber;

  List<ArchViolation> check(String path, String source) {
    if (!path.startsWith(appliesTo) || allowedPrefixes.any(path.startsWith)) {
      return const [];
    }
    final code = scrubber.scrub(source);
    final pattern = RegExp('\\b(${identifiers.join('|')})\\b');
    final found = {for (final m in pattern.allMatches(code)) m.group(1)!};
    return [
      for (final name in found.toList()..sort())
        ArchViolation(path: path, reason: 'uses $name; $reason'),
    ];
  }
}
