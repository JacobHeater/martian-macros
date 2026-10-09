import 'dart:convert';
import 'dart:io';

/// Where the sources came from, written by the fetch step: the date goes in
/// the pack header, so a build never reads the clock.
final class BuildProvenance {
  const BuildProvenance({required this.builtOn, required this.sources});

  factory BuildProvenance.read(File file) {
    final json = jsonDecode(file.readAsStringSync()) as Map<String, Object?>;
    return BuildProvenance(
      builtOn: json['builtOn']! as String,
      sources: (json['sources']! as List<Object?>).cast<String>(),
    );
  }

  /// An ISO date, the day the sources were downloaded.
  final String builtOn;

  /// Each source with its version and download date.
  final List<String> sources;
}
