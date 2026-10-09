/// The user cancelled. What was downloaded is kept so a later start resumes.
final class PackDownloadCancelled implements Exception {
  const PackDownloadCancelled();

  @override
  String toString() => 'PackDownloadCancelled';
}
