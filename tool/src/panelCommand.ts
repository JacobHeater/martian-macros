import { stderr, stdout } from 'node:process';
import { PanelChecker } from './panelChecker.ts';

export async function runPanel(root: string, args: readonly string[]): Promise<number> {
  if (args.length > 1 || args.some((arg) => arg.startsWith('-'))) {
    stderr.write('Usage: mm panel [docs/agent-runs/<task-id>]\n');
    return 64;
  }
  const errors = new PanelChecker().check(root, args.length === 0 ? undefined : `${root}/${args[0]}`);
  for (const error of errors) stderr.write(`  ${error}\n`);
  if (errors.length > 0) {
    stderr.write(`mm panel failed: ${errors.length} issue(s).\n`);
    return 1;
  }
  stdout.write(
    `mm panel: ok (canonical roles, Claude/Copilot adapters, templates${args.length === 0 ? '' : ', saved run'}). ` +
      'Structural checks only; native runtime permissions and evidence truth require actual inspection.\n',
  );
  return 0;
}
