final class Ticket {
  Ticket({
    required this.component,
    required this.fileName,
    required this.type,
    required this.slug,
    required this.id,
    required this.number,
    required this.status,
    required this.related,
  });

  final String component;
  final String fileName;
  final String type;
  final String slug;
  final String id;
  final int number;
  final String status;
  final List<String> related;
}
