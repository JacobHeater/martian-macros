import 'insight.dart';

/// The insight chosen for today, and whether it starts showing now (so the
/// caller records it) or was already showing (MM-141).
final class InsightSelection {
  const InsightSelection(this.insight, {required this.isNew});

  final Insight insight;
  final bool isNew;
}
