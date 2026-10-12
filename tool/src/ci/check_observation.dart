import 'check_state.dart';

/// One check as observed on a pull request's head commit.
final class CheckObservation {
  const CheckObservation({
    required this.key,
    required this.name,
    required this.kind,
    required this.state,
    this.workflow,
    this.providerStatus,
    this.providerConclusion,
    this.url,
    this.startedAt,
    this.completedAt,
    this.required = false,
  });

  factory CheckObservation.fromJson(Map<String, Object?> json) =>
      CheckObservation(
        key: json['key']! as String,
        name: json['name']! as String,
        kind: json['kind']! as String,
        state:
            CheckState.values.asNameMap()[json['state']] ?? CheckState.unknown,
        workflow: json['workflow'] as String?,
        providerStatus: json['providerStatus'] as String?,
        providerConclusion: json['providerConclusion'] as String?,
        url: json['url'] as String?,
        startedAt: json['startedAt'] as String?,
        completedAt: json['completedAt'] as String?,
        required: json['required'] == true,
      );

  /// Identifies the check across polls: its workflow and name.
  final String key;
  final String name;

  /// `checkRun` or `statusContext`.
  final String kind;
  final CheckState state;
  final String? workflow;

  /// GitHub's own words, unchanged.
  final String? providerStatus;
  final String? providerConclusion;

  /// The run or job page; it carries the run and job identifiers.
  final String? url;

  /// Provider timestamps, as given.
  final String? startedAt;
  final String? completedAt;

  /// Whether GitHub reported this check as required for the branch.
  final bool required;

  CheckObservation asRequired() => CheckObservation(
    key: key,
    name: name,
    kind: kind,
    state: state,
    workflow: workflow,
    providerStatus: providerStatus,
    providerConclusion: providerConclusion,
    url: url,
    startedAt: startedAt,
    completedAt: completedAt,
    required: true,
  );

  Map<String, Object?> toJson() => {
    'key': key,
    'name': name,
    'kind': kind,
    'state': state.name,
    'workflow': workflow,
    'providerStatus': providerStatus,
    'providerConclusion': providerConclusion,
    'url': url,
    'startedAt': startedAt,
    'completedAt': completedAt,
    'required': required,
  };
}
