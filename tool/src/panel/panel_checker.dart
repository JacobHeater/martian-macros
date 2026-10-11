import 'dart:convert';
import 'dart:io';

/// Structural checks for the repository panel, not native permission attestation.
final class PanelChecker {
  const PanelChecker();

  List<String> check(Directory root, {Directory? run}) {
    final errors = <String>[];
    String read(String path) {
      final file = File('${root.path}/$path');
      if (!file.existsSync()) {
        errors.add('Missing $path');
        return '';
      }
      return file.readAsStringSync().replaceAll('\r\n', '\n');
    }

    for (final path in [
      'agents/README.md',
      'agents/panel-protocol.md',
      'agents/review-contract.md',
      'agents/run-state.md',
      'agents/native-surfaces.md',
    ]) {
      read(path);
    }
    final schema = _decode(
      read('agents/state.schema.json'),
      'agents/state.schema.json',
      errors,
    );
    if (schema is! Map<String, dynamic>) {
      errors.add('Schema must be a JSON object');
      return errors;
    }
    _checkSchema(schema, 'schema', errors);
    if (errors.isNotEmpty) return errors;
    final properties = schema['properties'];
    final assignmentsSchema = properties is Map
        ? properties['assignments']
        : null;
    final itemSchema = assignmentsSchema is Map
        ? assignmentsSchema['items']
        : null;
    final itemProperties = itemSchema is Map ? itemSchema['properties'] : null;
    final roleSchema = itemProperties is Map ? itemProperties['role'] : null;
    final roleNames = roleSchema is Map ? roleSchema['enum'] : null;
    if (roleNames is! List) {
      errors.add('Schema missing assignments role enum');
      return errors;
    }
    const requiredRoles = {
      'chair',
      'training',
      'nutrition',
      'micronutrients',
      'coaching',
      'measurement',
      'safety',
      'product',
      'product-designer',
      'ux-accessibility',
      'architecture',
      'flutter',
      'integrations',
      'privacy-security',
      'qa',
    };
    if (roleNames.toSet().difference(requiredRoles).isNotEmpty ||
        requiredRoles.difference(roleNames.toSet()).isNotEmpty ||
        roleNames.length != requiredRoles.length) {
      errors.add('Schema must cover exactly the 15 canonical roles');
    }
    final index = read('agents/README.md');
    for (final role in requiredRoles) {
      final path = 'agents/roles/$role.md';
      final text = read(path);
      if (!index.contains('roles/$role.md')) {
        errors.add('agents/README.md must link $path');
      }
      for (final heading in [
        'Responsibilities',
        'Existing implementation audit',
        'Exclusions',
        'Invocation criteria',
        'Inputs',
        'Evidence standards',
        'Outputs',
        'Cross-domain dependencies',
      ]) {
        if (!text.contains('## $heading\n')) {
          errors.add('$path missing section: $heading');
        }
      }
      final adapterPath = '.claude/agents/panel-$role.md';
      final adapter = read(adapterPath);
      final claudeTools = role == 'chair'
          ? 'Read, Grep, Glob, WebSearch, WebFetch, Write, Edit, '
                'Agent(panel-training, panel-nutrition, panel-micronutrients, '
                'panel-coaching, panel-measurement, panel-safety, panel-product, '
                'panel-product-designer, panel-ux-accessibility, panel-architecture, '
                'panel-flutter, panel-integrations, panel-privacy-security, panel-qa)'
          : 'Read, Grep, Glob, WebSearch, WebFetch';
      final lines = const LineSplitter().convert(adapter);
      if (lines.length < 5 ||
          lines[0] != '---' ||
          lines[1] != 'name: panel-$role' ||
          !lines[2].startsWith('description: ') ||
          lines[2].substring('description: '.length).trim().isEmpty ||
          lines[3] != 'tools: $claudeTools' ||
          lines[4] != '---') {
        errors.add('$adapterPath must use the restricted Claude profile shape');
      }
      final copilotPath = '.github/agents/panel-$role.agent.md';
      final copilot = read(copilotPath);
      _checkCopilot(copilotPath, copilot, role, requiredRoles, errors);
      for (final reference in [
        'AGENTS.md',
        path,
        'agents/panel-protocol.md',
        'agents/review-contract.md',
        'PANEL_CONFIG_MISSING',
      ]) {
        if (!adapter.contains('`$reference')) {
          errors.add('$adapterPath missing reference/refusal: $reference');
        }
        if (!copilot.contains('`$reference')) {
          errors.add('$copilotPath missing reference/refusal: $reference');
        }
      }
      for (final profile in [adapter, copilot]) {
        if (!profile.contains('existing-implementation audit protocol')) {
          errors.add('panel-$role adapter missing shared audit invocation');
        }
      }
      for (final reference in [
        'agents/panel-protocol.md',
        'agents/review-contract.md',
      ]) {
        if (!text.contains('`$reference`')) {
          errors.add('$path missing shared research reference: $reference');
        }
      }
    }
    for (final path in [
      'brief.md',
      'decision.md',
      'handoff.md',
      'findings/role.md',
    ]) {
      read('agents/templates/$path');
    }
    final report = read('agents/templates/findings/role.md');
    for (final heading in [
      'Scope and traceability',
      'Existing facts versus proposals',
      'Audit coverage',
      'Findings',
      'Sources and evidence',
      'Research',
      'Confidence and limitations',
      'Acceptance criteria and edge cases',
      'Dependencies',
      'Safety concerns',
      'Unresolved product decisions',
      'Verification',
    ]) {
      if (!report.contains('## $heading\n')) {
        errors.add('Findings template missing section: $heading');
      }
    }
    final template = _decode(
      read('agents/templates/state.json'),
      'agents/templates/state.json',
      errors,
    );
    _validate(schema, template, 'template', errors);
    if (run != null) {
      final stateFile = File('${run.path}/state.json');
      if (!stateFile.existsSync()) {
        errors.add('Missing ${stateFile.path}');
      } else {
        final state = _decode(
          stateFile.readAsStringSync(),
          stateFile.path,
          errors,
        );
        final before = errors.length;
        _validate(schema, state, 'state', errors);
        if (errors.length == before && state is Map<String, dynamic>) {
          _checkRun(root, run, state, errors);
        }
      }
    }
    return errors;
  }

  void _checkCopilot(
    String path,
    String text,
    String role,
    Set<String> roles,
    List<String> errors,
  ) {
    final lines = const LineSplitter().convert(text);
    if (lines.length < 6 ||
        lines[0] != '---' ||
        lines[1] != 'name: panel-$role' ||
        !lines[2].startsWith('description: ') ||
        lines[2].substring('description: '.length).trim().isEmpty ||
        !lines[3].startsWith('tools: ') ||
        !lines[4].startsWith('agents: ') ||
        lines[5] != '---') {
      errors.add('$path must use the supported Copilot profile shape');
      return;
    }
    final tools = _decode(lines[3].substring(7), '$path tools', errors);
    final workers = _decode(lines[4].substring(8), '$path agents', errors);
    final allowed = {
      'read',
      'search',
      'web',
      'githubRepo',
      'githubTextSearch',
      'github/search_repositories',
      'github/search_code',
      if (role == 'chair') ...['edit', 'agent'],
    };
    if (tools is! List ||
        tools.length != allowed.length ||
        tools.toSet().difference(allowed).isNotEmpty ||
        allowed.difference(tools.toSet()).isNotEmpty) {
      errors.add('$path must use the restricted Copilot tool allowlist');
    }
    final expectedWorkers = role == 'chair'
        ? {
            for (final name in roles)
              if (name != 'chair') 'panel-$name',
          }
        : <String>{};
    if (workers is! List ||
        workers.length != expectedWorkers.length ||
        workers.toSet().difference(expectedWorkers).isNotEmpty ||
        expectedWorkers.difference(workers.toSet()).isNotEmpty) {
      errors.add('$path must restrict native delegation to panel specialists');
    }
  }

  dynamic _decode(String text, String path, List<String> errors) {
    try {
      return jsonDecode(text);
    } on FormatException {
      errors.add('$path is not valid JSON');
      return null;
    }
  }

  void _checkSchema(
    Map<String, dynamic> schema,
    String path,
    List<String> errors,
  ) {
    const types = {'object', 'array', 'string', 'integer', 'boolean', 'null'};
    for (final entry in schema.entries) {
      final value = entry.value;
      final valid = switch (entry.key) {
        'type' =>
          value is String
              ? types.contains(value)
              : value is List &&
                    value.isNotEmpty &&
                    value.every(
                      (item) => item is String && types.contains(item),
                    ),
        'required' => value is List && value.every((item) => item is String),
        'properties' || 'items' => value is Map<String, dynamic>,
        'additionalProperties' =>
          value is bool || value is Map<String, dynamic>,
        'enum' => value is List && value.isNotEmpty,
        'pattern' => value is String,
        'minLength' => value is int && value >= 0,
        _ => true,
      };
      if (!valid) {
        errors.add('Schema keyword $path.${entry.key} has invalid shape');
        continue;
      }
      if (entry.key == 'pattern' && value is String) {
        try {
          RegExp(value);
        } on FormatException {
          errors.add('Schema keyword $path.pattern has invalid regex');
        }
      }
      if (entry.key == 'properties' && value is Map<String, dynamic>) {
        for (final property in value.entries) {
          if (property.value is! Map<String, dynamic>) {
            errors.add(
              'Schema keyword $path.properties.${property.key} must be an object',
            );
          } else {
            _checkSchema(
              property.value as Map<String, dynamic>,
              '$path.properties.${property.key}',
              errors,
            );
          }
        }
      } else if ((entry.key == 'items' ||
              entry.key == 'additionalProperties') &&
          value is Map<String, dynamic>) {
        _checkSchema(value, '$path.${entry.key}', errors);
      }
    }
  }

  void _validate(
    Map<String, dynamic> schema,
    dynamic value,
    String path,
    List<String> errors,
  ) {
    final declared = schema['type'];
    final types = declared is List ? declared : [declared];
    final matches = types.any(
      (type) => switch (type) {
        'object' => value is Map<String, dynamic>,
        'array' => value is List,
        'string' => value is String,
        'integer' => value is int,
        'boolean' => value is bool,
        'null' => value == null,
        _ => false,
      },
    );
    if (!matches) {
      errors.add('$path has wrong type (expected $declared)');
      return;
    }
    if (schema['enum'] case final List<dynamic> allowed) {
      if (!allowed.contains(value)) errors.add('$path has unsupported value');
    }
    if (value == null) return;
    if (value is String) {
      if (schema['pattern'] case final String pattern) {
        if (!RegExp(pattern).hasMatch(value)) {
          errors.add('$path has invalid format');
        }
      }
      if (value.length < (schema['minLength'] as int? ?? 0)) {
        errors.add('$path must not be empty');
      }
    }
    if (value is List && schema['items'] is Map<String, dynamic>) {
      for (var i = 0; i < value.length; i++) {
        _validate(
          schema['items'] as Map<String, dynamic>,
          value[i],
          '$path[$i]',
          errors,
        );
      }
    }
    if (value is Map<String, dynamic>) {
      final properties = schema['properties'] as Map? ?? const {};
      for (final key in schema['required'] as List? ?? const []) {
        if (!value.containsKey(key)) errors.add('$path missing $key');
      }
      for (final entry in value.entries) {
        final rule = properties[entry.key];
        if (rule is Map<String, dynamic>) {
          _validate(rule, entry.value, '$path.${entry.key}', errors);
        } else if (schema['additionalProperties'] == false) {
          errors.add('$path has unknown field ${entry.key}');
        } else if (schema['additionalProperties'] is Map<String, dynamic>) {
          _validate(
            schema['additionalProperties'] as Map<String, dynamic>,
            entry.value,
            '$path.${entry.key}',
            errors,
          );
        }
      }
    }
  }

  bool _relative(String path) =>
      path.isNotEmpty &&
      !path.startsWith('/') &&
      !path.contains(r'\') &&
      !path.contains(':') &&
      path
          .split('/')
          .every((part) => part.isNotEmpty && part != '.' && part != '..');

  bool _localFile(Directory root, String path) {
    if (!_relative(path)) return false;
    final file = File('${root.path}/$path');
    if (!file.existsSync()) return false;
    final resolved = file.resolveSymbolicLinksSync();
    return resolved.startsWith(
      '${root.resolveSymbolicLinksSync()}${Platform.pathSeparator}',
    );
  }

  void _checkRun(
    Directory root,
    Directory run,
    Map<String, dynamic> state,
    List<String> errors,
  ) {
    final id = state['task_id'] as String;
    final expected = Directory(
      '${root.resolveSymbolicLinksSync()}/docs/agent-runs/$id',
    );
    if (!run.existsSync() ||
        !expected.existsSync() ||
        run.resolveSymbolicLinksSync() != expected.resolveSymbolicLinksSync() ||
        !run.resolveSymbolicLinksSync().startsWith(
          '${root.resolveSymbolicLinksSync()}${Platform.pathSeparator}',
        )) {
      errors.add('Run must live at docs/agent-runs/$id in this repository');
    }
    if ((state['baseline'] as Map)['commit'] ==
        '0000000000000000000000000000000000000000') {
      errors.add('Run baseline still contains the template placeholder');
    }
    for (final path in ['brief.md', 'decision.md', 'handoff.md']) {
      if (!_localFile(run, path)) {
        errors.add('Missing/local-only run file: $path');
      }
    }
    final owner = state['owner'] as Map?;
    if (state['phase'] == 'edits' && owner == null) {
      errors.add('Edits require one designated owner');
    }
    if (owner != null) {
      final paths = owner['paths'] as List;
      if (paths.isEmpty || paths.any((p) => !_relative(p as String))) {
        errors.add('Owner must have explicit repository-relative paths');
      }
    }
    if (state['phase'] == 'checkpoint' &&
        (owner != null ||
            (state['checkpoint'] as Map)['writers_stopped'] != true ||
            (state['checkpoint'] as Map)['at'] == null)) {
      errors.add('Checkpoint requires stopped writers, timestamp and no owner');
    }
    final assignments = (state['assignments'] as List)
        .cast<Map<String, dynamic>>();
    final capabilities = (state['research_capabilities'] as List)
        .cast<Map<String, dynamic>>();
    final assigned = <String>{};
    for (final item in assignments.cast<Map<String, dynamic>>()) {
      final role = item['role'] as String;
      if (!assigned.add(role)) errors.add('Duplicate assignment: $role');
      if (item['report'] != 'findings/$role.md') {
        errors.add('$role report must be findings/$role.md');
      }
      final hashes = item['input_hashes'] as Map;
      if (hashes.keys.any((p) => !_relative(p as String))) {
        errors.add('$role input paths must be repository-relative');
      }
      if (item['status'] == 'omitted') {
        final reason = item['omission_reason'] as String?;
        if (reason == null || reason.trim().isEmpty) {
          errors.add('$role omission needs a recorded reason');
        } else {
          final recorded = ['brief.md', item['report'] as String].any(
            (path) =>
                _localFile(run, path) &&
                File('${run.path}/$path').readAsStringSync().contains(reason),
          );
          if (!recorded) {
            errors.add('$role omission reason missing from brief/report');
          }
        }
      }
      if (item['status'] == 'complete') {
        final coverage = item['coverage'] as Map;
        if ((coverage['inspected'] as List).isEmpty ||
            (coverage['methods'] as List).isEmpty) {
          errors.add(
            '$role completed audit needs inspected coverage and methods',
          );
        }
        if (item['inspected_commit'] == null || hashes.isEmpty) {
          errors.add('$role completed review needs a commit and input hashes');
        }
        for (final path in [
          'agents/roles/$role.md',
          'agents/panel-protocol.md',
          'agents/review-contract.md',
        ]) {
          if (!hashes.containsKey(path)) {
            errors.add('$role completed review missing canonical input: $path');
          }
        }
        if (!_localFile(run, item['report'] as String)) {
          errors.add('$role completed review report missing or outside run');
        } else {
          final report = File('${run.path}/${item['report']}')
              .readAsStringSync()
              .replaceAll('\r\n', '\n');
          final template = File(
            '${root.path}/agents/templates/findings/role.md',
          ).readAsStringSync();
          for (final heading in RegExp(
            r'^## .+$',
            multiLine: true,
          ).allMatches(template).map((m) => m.group(0)!.trim())) {
            if (!report.contains('$heading\n')) {
              errors.add('$role report missing section: $heading');
            }
          }
          for (final source
              in ((item['research'] as Map)['sources'] as List)
                  .cast<Map<String, dynamic>>()) {
            if (!report.contains(source['url'] as String)) {
              errors.add('$role report missing consulted source URL');
            }
          }
        }
      }
      final research = item['research'] as Map;
      final status = research['status'];
      final sources = research['sources'] as List;
      if (status == 'performed' &&
          (sources.isEmpty ||
              (research['question'] as String).trim().isEmpty ||
              !['direct', 'chair'].contains(research['path']))) {
        errors.add(
          '$role performed research needs question, sources and actual path',
        );
      }
      if (status == 'performed' &&
          !capabilities.any(
            (capability) =>
                capability['status'] == 'observed' &&
                (capability['discovery'] as List).isNotEmpty &&
                (capability['retrieval'] as List).isNotEmpty,
          )) {
        errors.add(
          '$role performed research needs observed discovery/retrieval capabilities',
        );
      }
      if (status != 'performed' && sources.isNotEmpty) {
        errors.add('$role unperformed research cannot claim consulted sources');
      }
      if (item['status'] == 'complete' &&
          !['performed', 'unnecessary'].contains(status)) {
        errors.add('$role completed review has unresolved research');
      }
      if (status == 'blocked' &&
          research['path'] != 'unavailable' &&
          research['path'] != 'chair') {
        errors.add(
          '$role blocked research must identify unavailable/chair path',
        );
      }
    }
    if (state['phase'] != 'scope') {
      for (final role in [
        'chair',
        'training',
        'nutrition',
        'coaching',
        'measurement',
        'safety',
      ]) {
        if (!assigned.contains(role)) {
          errors.add('Core role must be assigned or explicitly omitted: $role');
        }
      }
    }
    for (final test in (state['tests'] as List).cast<Map<String, dynamic>>()) {
      final code = test['exit_code'];
      if ((test['result'] == 'passed' && code != 0) ||
          (test['result'] == 'failed' && (code == null || code == 0)) ||
          (test['result'] == 'not-run' && code != null)) {
        errors.add('Test result/exit code disagree: ${test['command']}');
      }
    }
    if (state['phase'] == 'complete' &&
        (owner != null ||
            (state['unresolved_questions'] as List).isNotEmpty ||
            (state['pending_work'] as List).isNotEmpty ||
            assignments.any(
              (a) => a['status'] == 'pending' || a['status'] == 'stale',
            ) ||
            (state['decisions'] as List).any(
              (d) => (d as Map)['status'] == 'pending',
            ))) {
      errors.add('Complete run still has an owner or unresolved work');
    }
    if (state['phase'] == 'complete' &&
        ((state['checkpoint'] as Map)['writers_stopped'] != true ||
            (state['checkpoint'] as Map)['at'] == null)) {
      errors.add(
        'Complete run requires stopped writers and checkpoint timestamp',
      );
    }
  }
}
