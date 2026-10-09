import 'pack_download_problem.dart';

/// A download that stopped for [problem]. The installed pack, if any, is
/// untouched.
final class PackDownloadFailed implements Exception {
  const PackDownloadFailed(this.problem, [this.detail]);

  final PackDownloadProblem problem;
  final String? detail;

  @override
  String toString() =>
      'PackDownloadFailed(${problem.name}'
      '${detail == null ? '' : ': $detail'})';
}
