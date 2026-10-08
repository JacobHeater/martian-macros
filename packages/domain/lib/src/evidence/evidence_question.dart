/// A question a user might ask, answered in plain language and tied to the
/// register rows it draws on.
final class EvidenceQuestion {
  const EvidenceQuestion({
    required this.title,
    required this.answer,
    required this.rowNames,
  });

  final String title;
  final String answer;
  final List<String> rowNames;
}
