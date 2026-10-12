import { spawn } from 'node:child_process';
import { stderr, stdout } from 'node:process';

/** What one captured process gave back. */
export interface Captured {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

const windows = process.platform === 'win32';

/** `part` as one shell word, for the Windows shell the .cmd shims need. */
const quoted = (part: string) => (/[\s"^&|<>()%!]/.test(part) ? `"${part.replaceAll('"', '\\"')}"` : part);

/**
 * Runs `command` with inherited stdio from `cwd` and gives its exit code.
 * On Windows everything runs in a shell, as the .cmd shims (npm, gradlew)
 * need; arguments are our own, never anything read from outside.
 */
export function run(command: readonly string[], { cwd, env }: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): Promise<number> {
  stdout.write(`\x1B[2m$ ${command.join(' ')}  (in ${cwd ?? '.'})\x1B[0m\n`);
  return new Promise((resolve) => {
    const child = windows
      ? spawn(command.map(quoted).join(' '), { cwd, env, stdio: 'inherit', shell: true })
      : spawn(command[0]!, command.slice(1), { cwd, env, stdio: 'inherit' });
    child.on('error', (error) => {
      stderr.write(`Could not start "${command[0]}": ${error.message}\n`);
      resolve(127);
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

/** Runs `command` quietly and gives what it printed. */
export function capture(
  command: readonly string[],
  { cwd, env, timeoutMs }: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number } = {},
): Promise<Captured> {
  return new Promise((resolve) => {
    const child = windows
      ? spawn(command.map(quoted).join(' '), { cwd, env, shell: true, timeout: timeoutMs })
      : spawn(command[0]!, command.slice(1), { cwd, env, timeout: timeoutMs });
    let out = '';
    let err = '';
    child.stdout?.on('data', (data: Buffer) => (out += data.toString('utf8')));
    child.stderr?.on('data', (data: Buffer) => (err += data.toString('utf8')));
    child.on('error', (error) => resolve({ code: 127, stdout: '', stderr: `could not be run: ${error.message}` }));
    child.on('close', (code) => resolve({ code: code ?? 124, stdout: out, stderr: err }));
  });
}
