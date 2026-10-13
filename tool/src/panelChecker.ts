import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { sep } from 'node:path';

/** Structural checks for the repository panel, not native permission attestation. */
export class PanelChecker {
  check(root: string, run?: string): string[] {
    const errors: string[] = [];
    const read = (path: string): string => {
      const file = `${root}/${path}`;
      if (!existsSync(file)) {
        errors.push(`Missing ${path}`);
        return '';
      }
      return readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
    };

    for (const path of [
      'agents/README.md',
      'agents/panel-protocol.md',
      'agents/review-contract.md',
      'agents/run-state.md',
      'agents/native-surfaces.md',
    ]) {
      read(path);
    }
    const schema = this.decode(read('agents/state.schema.json'), 'agents/state.schema.json', errors);
    if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
      errors.push('Schema must be a JSON object');
      return errors;
    }
    const schemaObject = schema as Record<string, unknown>;
    this.checkSchema(schemaObject, 'schema', errors);
    if (errors.length > 0) return errors;
    const properties = schemaObject['properties'];
    const assignmentsSchema = typeof properties === 'object' && properties !== null ? (properties as Record<string, unknown>)['assignments'] : undefined;
    const itemSchema =
      typeof assignmentsSchema === 'object' && assignmentsSchema !== null ? (assignmentsSchema as Record<string, unknown>)['items'] : undefined;
    const itemProperties = typeof itemSchema === 'object' && itemSchema !== null ? (itemSchema as Record<string, unknown>)['properties'] : undefined;
    const roleSchema =
      typeof itemProperties === 'object' && itemProperties !== null ? (itemProperties as Record<string, unknown>)['role'] : undefined;
    const roleNames = typeof roleSchema === 'object' && roleSchema !== null ? (roleSchema as Record<string, unknown>)['enum'] : undefined;
    if (!Array.isArray(roleNames)) {
      errors.push('Schema missing assignments role enum');
      return errors;
    }
    const requiredRoles = [
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
      'react-capacitor',
      'integrations',
      'privacy-security',
      'qa',
    ];
    const names = new Set(roleNames as string[]);
    if (
      roleNames.length !== requiredRoles.length ||
      requiredRoles.some((role) => !names.has(role)) ||
      [...names].some((role) => !requiredRoles.includes(role))
    ) {
      errors.push('Schema must cover exactly the 15 canonical roles');
    }
    const index = read('agents/README.md');
    for (const role of requiredRoles) {
      const path = `agents/roles/${role}.md`;
      const text = read(path);
      if (!index.includes(`roles/${role}.md`)) errors.push(`agents/README.md must link ${path}`);
      for (const heading of [
        'Responsibilities',
        'Existing implementation audit',
        'Exclusions',
        'Invocation criteria',
        'Inputs',
        'Evidence standards',
        'Outputs',
        'Cross-domain dependencies',
      ]) {
        if (!text.includes(`## ${heading}\n`)) errors.push(`${path} missing section: ${heading}`);
      }
      const adapterPath = `.claude/agents/panel-${role}.md`;
      const adapter = read(adapterPath);
      const claudeTools =
        role === 'chair'
          ? 'Read, Grep, Glob, WebSearch, WebFetch, Write, Edit, ' +
            'Agent(panel-training, panel-nutrition, panel-micronutrients, ' +
            'panel-coaching, panel-measurement, panel-safety, panel-product, ' +
            'panel-product-designer, panel-ux-accessibility, panel-architecture, ' +
            'panel-react-capacitor, panel-integrations, panel-privacy-security, panel-qa)'
          : 'Read, Grep, Glob, WebSearch, WebFetch';
      const lines = adapter.split('\n');
      if (
        lines.length < 5 ||
        lines[0] !== '---' ||
        lines[1] !== `name: panel-${role}` ||
        !lines[2]!.startsWith('description: ') ||
        lines[2]!.slice('description: '.length).trim() === '' ||
        lines[3] !== `tools: ${claudeTools}` ||
        lines[4] !== '---'
      ) {
        errors.push(`${adapterPath} must use the restricted Claude profile shape`);
      }
      const copilotPath = `.github/agents/panel-${role}.agent.md`;
      const copilot = read(copilotPath);
      this.checkCopilot(copilotPath, copilot, role, requiredRoles, errors);
      for (const reference of ['AGENTS.md', path, 'agents/panel-protocol.md', 'agents/review-contract.md', 'PANEL_CONFIG_MISSING']) {
        if (!adapter.includes(`\`${reference}`)) errors.push(`${adapterPath} missing reference/refusal: ${reference}`);
        if (!copilot.includes(`\`${reference}`)) errors.push(`${copilotPath} missing reference/refusal: ${reference}`);
      }
      for (const profile of [adapter, copilot]) {
        if (!profile.includes('existing-implementation audit protocol')) {
          errors.push(`panel-${role} adapter missing shared audit invocation`);
        }
      }
      for (const reference of ['agents/panel-protocol.md', 'agents/review-contract.md']) {
        if (!text.includes(`\`${reference}\``)) errors.push(`${path} missing shared research reference: ${reference}`);
      }
    }
    for (const path of ['brief.md', 'decision.md', 'handoff.md', 'findings/role.md']) {
      read(`agents/templates/${path}`);
    }
    const report = read('agents/templates/findings/role.md');
    for (const heading of [
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
      if (!report.includes(`## ${heading}\n`)) errors.push(`Findings template missing section: ${heading}`);
    }
    const template = this.decode(read('agents/templates/state.json'), 'agents/templates/state.json', errors);
    this.validate(schemaObject, template, 'template', errors);
    if (run !== undefined) {
      const stateFile = `${run}/state.json`;
      if (!existsSync(stateFile)) {
        errors.push(`Missing ${stateFile}`);
      } else {
        const state = this.decode(readFileSync(stateFile, 'utf8'), stateFile, errors);
        const before = errors.length;
        this.validate(schemaObject, state, 'state', errors);
        if (errors.length === before && typeof state === 'object' && state !== null && !Array.isArray(state)) {
          this.checkRun(root, run, state as Record<string, unknown>, errors);
        }
      }
    }
    return errors;
  }

  private checkCopilot(path: string, text: string, role: string, roles: readonly string[], errors: string[]): void {
    const lines = text.split('\n');
    if (
      lines.length < 6 ||
      lines[0] !== '---' ||
      lines[1] !== `name: panel-${role}` ||
      !lines[2]!.startsWith('description: ') ||
      lines[2]!.slice('description: '.length).trim() === '' ||
      !lines[3]!.startsWith('tools: ') ||
      !lines[4]!.startsWith('agents: ') ||
      lines[5] !== '---'
    ) {
      errors.push(`${path} must use the supported Copilot profile shape`);
      return;
    }
    const tools = this.decode(lines[3]!.slice(7), `${path} tools`, errors);
    const workers = this.decode(lines[4]!.slice(8), `${path} agents`, errors);
    const allowed = [
      'read',
      'search',
      'web',
      'githubRepo',
      'githubTextSearch',
      'github/search_repositories',
      'github/search_code',
      ...(role === 'chair' ? ['edit', 'agent'] : []),
    ];
    const toolSet = Array.isArray(tools) ? new Set(tools as string[]) : undefined;
    if (
      toolSet === undefined ||
      (tools as unknown[]).length !== allowed.length ||
      allowed.some((tool) => !toolSet.has(tool)) ||
      [...toolSet].some((tool) => !allowed.includes(tool))
    ) {
      errors.push(`${path} must use the restricted Copilot tool allowlist`);
    }
    const expectedWorkers = role === 'chair' ? roles.filter((name) => name !== 'chair').map((name) => `panel-${name}`) : [];
    const workerSet = Array.isArray(workers) ? new Set(workers as string[]) : undefined;
    if (
      workerSet === undefined ||
      (workers as unknown[]).length !== expectedWorkers.length ||
      expectedWorkers.some((worker) => !workerSet.has(worker)) ||
      [...workerSet].some((worker) => !expectedWorkers.includes(worker))
    ) {
      errors.push(`${path} must restrict native delegation to panel specialists`);
    }
  }

  private decode(text: string, path: string, errors: string[]): unknown {
    try {
      return JSON.parse(text);
    } catch {
      errors.push(`${path} is not valid JSON`);
      return null;
    }
  }

  private checkSchema(schema: Record<string, unknown>, path: string, errors: string[]): void {
    const types = ['object', 'array', 'string', 'integer', 'boolean', 'null'];
    for (const [keyword, value] of Object.entries(schema)) {
      let valid: boolean;
      switch (keyword) {
        case 'type':
          valid =
            typeof value === 'string'
              ? types.includes(value)
              : Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && types.includes(item));
          break;
        case 'required':
          valid = Array.isArray(value) && value.every((item) => typeof item === 'string');
          break;
        case 'properties':
        case 'items':
          valid = typeof value === 'object' && value !== null && !Array.isArray(value);
          break;
        case 'additionalProperties':
          valid = typeof value === 'boolean' || (typeof value === 'object' && value !== null && !Array.isArray(value));
          break;
        case 'enum':
          valid = Array.isArray(value) && value.length > 0;
          break;
        case 'pattern':
          valid = typeof value === 'string';
          break;
        case 'minLength':
          valid = typeof value === 'number' && Number.isInteger(value) && value >= 0;
          break;
        default:
          valid = true;
      }
      if (!valid) {
        errors.push(`Schema keyword ${path}.${keyword} has invalid shape`);
        continue;
      }
      if (keyword === 'pattern' && typeof value === 'string') {
        try {
          new RegExp(value);
        } catch {
          errors.push(`Schema keyword ${path}.pattern has invalid regex`);
        }
      }
      if (keyword === 'properties' && typeof value === 'object' && value !== null) {
        for (const [property, rule] of Object.entries(value as Record<string, unknown>)) {
          if (typeof rule !== 'object' || rule === null || Array.isArray(rule)) {
            errors.push(`Schema keyword ${path}.properties.${property} must be an object`);
          } else {
            this.checkSchema(rule as Record<string, unknown>, `${path}.properties.${property}`, errors);
          }
        }
      } else if ((keyword === 'items' || keyword === 'additionalProperties') && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.checkSchema(value as Record<string, unknown>, `${path}.${keyword}`, errors);
      }
    }
  }

  private validate(schema: Record<string, unknown>, value: unknown, path: string, errors: string[]): void {
    const declared = schema['type'];
    const types = Array.isArray(declared) ? declared : [declared];
    const matches = types.some((type) => {
      switch (type) {
        case 'object':
          return typeof value === 'object' && value !== null && !Array.isArray(value);
        case 'array':
          return Array.isArray(value);
        case 'string':
          return typeof value === 'string';
        case 'integer':
          return typeof value === 'number' && Number.isInteger(value);
        case 'boolean':
          return typeof value === 'boolean';
        case 'null':
          return value === null;
        default:
          return false;
      }
    });
    if (!matches) {
      errors.push(`${path} has wrong type (expected ${Array.isArray(declared) ? declared.join(',') : declared})`);
      return;
    }
    const allowed = schema['enum'];
    if (Array.isArray(allowed) && !allowed.includes(value)) errors.push(`${path} has unsupported value`);
    if (value === null) return;
    if (typeof value === 'string') {
      const pattern = schema['pattern'];
      if (typeof pattern === 'string' && !new RegExp(pattern).test(value)) errors.push(`${path} has invalid format`);
      if (value.length < ((schema['minLength'] as number | undefined) ?? 0)) errors.push(`${path} must not be empty`);
    }
    const items = schema['items'];
    if (Array.isArray(value) && typeof items === 'object' && items !== null && !Array.isArray(items)) {
      for (let at = 0; at < value.length; at++) {
        this.validate(items as Record<string, unknown>, value[at], `${path}[${at}]`, errors);
      }
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      const properties = (schema['properties'] as Record<string, unknown> | undefined) ?? {};
      for (const key of (schema['required'] as string[] | undefined) ?? []) {
        if (!(key in record)) errors.push(`${path} missing ${key}`);
      }
      for (const [key, field] of Object.entries(record)) {
        const rule = properties[key];
        if (typeof rule === 'object' && rule !== null && !Array.isArray(rule)) {
          this.validate(rule as Record<string, unknown>, field, `${path}.${key}`, errors);
        } else if (schema['additionalProperties'] === false) {
          errors.push(`${path} has unknown field ${key}`);
        } else if (typeof schema['additionalProperties'] === 'object' && schema['additionalProperties'] !== null) {
          this.validate(schema['additionalProperties'] as Record<string, unknown>, field, `${path}.${key}`, errors);
        }
      }
    }
  }

  private relative(path: string): boolean {
    return (
      path !== '' &&
      !path.startsWith('/') &&
      !path.includes('\\') &&
      !path.includes(':') &&
      path.split('/').every((part) => part !== '' && part !== '.' && part !== '..')
    );
  }

  private localFile(root: string, path: string): boolean {
    if (!this.relative(path)) return false;
    const file = `${root}/${path}`;
    if (!existsSync(file) || !lstatSync(file).isFile()) return false;
    const resolved = realpathSync(file);
    return resolved.startsWith(`${realpathSync(root)}${sep}`);
  }

  private checkRun(root: string, run: string, state: Record<string, unknown>, errors: string[]): void {
    const id = state['task_id'] as string;
    const expected = `${root}/docs/agent-runs/${id}`;
    if (
      !existsSync(run) ||
      !existsSync(expected) ||
      realpathSync(run) !== realpathSync(expected) ||
      !realpathSync(run).startsWith(`${realpathSync(root)}${sep}`)
    ) {
      errors.push(`Run must live at docs/agent-runs/${id} in this repository`);
    }
    if ((state['baseline'] as Record<string, unknown>)['commit'] === '0000000000000000000000000000000000000000') {
      errors.push('Run baseline still contains the template placeholder');
    }
    for (const path of ['brief.md', 'decision.md', 'handoff.md']) {
      if (!this.localFile(run, path)) errors.push(`Missing/local-only run file: ${path}`);
    }
    const owner = state['owner'] as Record<string, unknown> | null;
    if (state['phase'] === 'edits' && owner === null) errors.push('Edits require one designated owner');
    if (owner !== null) {
      const paths = owner['paths'] as string[];
      if (paths.length === 0 || paths.some((path) => !this.relative(path))) {
        errors.push('Owner must have explicit repository-relative paths');
      }
    }
    const checkpoint = state['checkpoint'] as Record<string, unknown>;
    if (state['phase'] === 'checkpoint' && (owner !== null || checkpoint['writers_stopped'] !== true || checkpoint['at'] === null)) {
      errors.push('Checkpoint requires stopped writers, timestamp and no owner');
    }
    const assignments = state['assignments'] as Record<string, unknown>[];
    const capabilities = state['research_capabilities'] as Record<string, unknown>[];
    const assigned = new Set<string>();
    for (const item of assignments) {
      const role = item['role'] as string;
      if (assigned.has(role)) errors.push(`Duplicate assignment: ${role}`);
      assigned.add(role);
      if (item['report'] !== `findings/${role}.md`) errors.push(`${role} report must be findings/${role}.md`);
      const hashes = item['input_hashes'] as Record<string, unknown>;
      if (Object.keys(hashes).some((path) => !this.relative(path))) {
        errors.push(`${role} input paths must be repository-relative`);
      }
      if (item['status'] === 'omitted') {
        const reason = item['omission_reason'] as string | null;
        if (reason === null || reason === undefined || reason.trim() === '') {
          errors.push(`${role} omission needs a recorded reason`);
        } else {
          const recorded = ['brief.md', item['report'] as string].some(
            (path) => this.localFile(run, path) && readFileSync(`${run}/${path}`, 'utf8').includes(reason),
          );
          if (!recorded) errors.push(`${role} omission reason missing from brief/report`);
        }
      }
      if (item['status'] === 'complete') {
        const coverage = item['coverage'] as Record<string, unknown>;
        if ((coverage['inspected'] as unknown[]).length === 0 || (coverage['methods'] as unknown[]).length === 0) {
          errors.push(`${role} completed audit needs inspected coverage and methods`);
        }
        if (item['inspected_commit'] === null || Object.keys(hashes).length === 0) {
          errors.push(`${role} completed review needs a commit and input hashes`);
        }
        for (const path of [`agents/roles/${role}.md`, 'agents/panel-protocol.md', 'agents/review-contract.md']) {
          if (!(path in hashes)) errors.push(`${role} completed review missing canonical input: ${path}`);
        }
        if (!this.localFile(run, item['report'] as string)) {
          errors.push(`${role} completed review report missing or outside run`);
        } else {
          const report = readFileSync(`${run}/${item['report']}`, 'utf8').replaceAll('\r\n', '\n');
          const template = readFileSync(`${root}/agents/templates/findings/role.md`, 'utf8');
          for (const heading of [...template.matchAll(/^## .+$/gm)].map((match) => match[0].trim())) {
            if (!report.includes(`${heading}\n`)) errors.push(`${role} report missing section: ${heading}`);
          }
          for (const source of (item['research'] as Record<string, unknown>)['sources'] as Record<string, unknown>[]) {
            if (!report.includes(source['url'] as string)) errors.push(`${role} report missing consulted source URL`);
          }
        }
      }
      const research = item['research'] as Record<string, unknown>;
      const status = research['status'];
      const sources = research['sources'] as unknown[];
      if (
        status === 'performed' &&
        (sources.length === 0 || (research['question'] as string).trim() === '' || !['direct', 'chair'].includes(research['path'] as string))
      ) {
        errors.push(`${role} performed research needs question, sources and actual path`);
      }
      if (
        status === 'performed' &&
        !capabilities.some(
          (capability) =>
            capability['status'] === 'observed' &&
            (capability['discovery'] as unknown[]).length > 0 &&
            (capability['retrieval'] as unknown[]).length > 0,
        )
      ) {
        errors.push(`${role} performed research needs observed discovery/retrieval capabilities`);
      }
      if (status !== 'performed' && sources.length > 0) {
        errors.push(`${role} unperformed research cannot claim consulted sources`);
      }
      if (item['status'] === 'complete' && !['performed', 'unnecessary'].includes(status as string)) {
        errors.push(`${role} completed review has unresolved research`);
      }
      if (status === 'blocked' && research['path'] !== 'unavailable' && research['path'] !== 'chair') {
        errors.push(`${role} blocked research must identify unavailable/chair path`);
      }
    }
    if (state['phase'] !== 'scope') {
      for (const role of ['chair', 'training', 'nutrition', 'coaching', 'measurement', 'safety']) {
        if (!assigned.has(role)) errors.push(`Core role must be assigned or explicitly omitted: ${role}`);
      }
    }
    for (const test of state['tests'] as Record<string, unknown>[]) {
      const code = test['exit_code'];
      if (
        (test['result'] === 'passed' && code !== 0) ||
        (test['result'] === 'failed' && (code === null || code === 0)) ||
        (test['result'] === 'not-run' && code !== null)
      ) {
        errors.push(`Test result/exit code disagree: ${test['command']}`);
      }
    }
    if (
      state['phase'] === 'complete' &&
      (owner !== null ||
        (state['unresolved_questions'] as unknown[]).length > 0 ||
        (state['pending_work'] as unknown[]).length > 0 ||
        assignments.some((a) => a['status'] === 'pending' || a['status'] === 'stale') ||
        (state['decisions'] as Record<string, unknown>[]).some((d) => d['status'] === 'pending'))
    ) {
      errors.push('Complete run still has an owner or unresolved work');
    }
    if (state['phase'] === 'complete' && (checkpoint['writers_stopped'] !== true || checkpoint['at'] === null)) {
      errors.push('Complete run requires stopped writers and checkpoint timestamp');
    }
  }
}
