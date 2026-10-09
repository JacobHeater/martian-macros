/// A pack that is installed on this device.
final class InstalledPack {
  const InstalledPack({
    required this.id,
    required this.version,
    required this.path,
    required this.bytes,
  });

  final String id;
  final String version;
  final String path;
  final int bytes;
}
