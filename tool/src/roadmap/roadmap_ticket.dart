/// A ticket as the progress page shows it.
final class RoadmapTicket {
  const RoadmapTicket({
    required this.id,
    required this.title,
    required this.status,
    required this.component,
  });

  final String id;
  final String title;
  final String status;
  final String component;

  Map<String, String> toJson() => {
    'title': title,
    'status': status,
    'component': component,
  };
}
