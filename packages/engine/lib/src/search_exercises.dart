import 'package:mm_domain/mm_domain.dart';

/// The exercises to offer when one is being chosen (MM-76).
///
/// With no [query], the recently used come first, most recent first, then the
/// rest by name. With one, only exercises whose name has a word starting with
/// every word typed, and among those the recently used still come first, then
/// names that start with what was typed.
///
/// [exercises] is the built-in library and the user's own together.
/// [recentIds] is most recent first.
List<Exercise> searchExercises({
  required String query,
  required Iterable<Exercise> exercises,
  List<String> recentIds = const [],
}) {
  final typed = _words(query);
  final typedName = typed.join(' ');
  final recency = {for (var i = 0; i < recentIds.length; i++) recentIds[i]: i};

  final matches = [
    for (final exercise in exercises)
      if (_matches(typed, _words(exercise.name))) exercise,
  ];

  int rank(Exercise exercise) {
    final recent = recency[exercise.id];
    if (recent != null) return recent;
    final startsWithTyped =
        typed.isNotEmpty &&
        _words(exercise.name).join(' ').startsWith(typedName);
    return recentIds.length + (startsWithTyped ? 0 : 1);
  }

  return matches..sort((a, b) {
    final byRank = rank(a).compareTo(rank(b));
    if (byRank != 0) return byRank;
    return a.name.toLowerCase().compareTo(b.name.toLowerCase());
  });
}

/// Lower-case words, with hyphens and apostrophes not counting: "pull up"
/// finds "Pull-up", and "farmers" finds "Farmer's carry".
List<String> _words(String text) => text
    .toLowerCase()
    .replaceAll("'", '')
    .split(RegExp('[^a-z0-9]+'))
    .where((word) => word.isNotEmpty)
    .toList();

bool _matches(List<String> typed, List<String> name) =>
    typed.every((word) => name.any((part) => part.startsWith(word)));
