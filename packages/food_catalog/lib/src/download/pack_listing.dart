/// A pack the manifest offers: what it is, how big, and how to check it.
final class PackListing {
  const PackListing({
    required this.id,
    required this.title,
    required this.version,
    required this.formatVersion,
    required this.url,
    required this.downloadBytes,
    required this.sha256,
    this.gzip = true,
  });

  /// `barcode_us`, the same id the pack's header carries.
  final String id;

  /// What the user is told it is: "Barcode foods, United States".
  final String title;

  /// A build date or version, shown to the user and used to say an update
  /// exists.
  final String version;

  /// The pack format version; a pack newer than the app reads is refused.
  final int formatVersion;
  final Uri url;

  /// The size of the file as downloaded (compressed when [gzip]).
  final int downloadBytes;

  /// Lower-case hex SHA-256 of the downloaded file.
  final String sha256;

  /// The downloaded file is gzip-compressed and is unpacked after checking.
  final bool gzip;
}
