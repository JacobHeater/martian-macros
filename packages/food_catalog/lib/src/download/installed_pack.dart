/// A pack that is installed on this device.
final class InstalledPack {
  const InstalledPack({
    required this.id,
    required this.version,
    required this.path,
    required this.bytes,
    this.title,
  });

  final String id;
  final String version;
  final String path;
  final int bytes;

  /// What the user was told it is when they downloaded it.
  final String? title;
}
