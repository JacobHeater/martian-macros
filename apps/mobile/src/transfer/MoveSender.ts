import type { LinkConnection } from './LinkConnection';
import type { LinkDialer } from './LinkDialer';
import type { MoveCipher } from './MoveCipher';
import type { MoveCode } from './MoveCode';
import type { MoveIdentity } from './MoveIdentity';
import type { MoveSending } from './MoveSending';
import type { MovePayload } from './MovePayload';
import { MoveProblem } from './MoveProblem';
import type { MoveProgress } from './MoveProgress';
import { moveChunkBytes } from './moveChunkBytes';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const message = (value: object) => encoder.encode(JSON.stringify(value));

/** The next frame, or a broken move when the other phone hung up. */
async function next(connection: LinkConnection): Promise<Uint8Array> {
  const frame = await connection.receive();
  if (frame === undefined) throw new MoveProblem('broken');
  return frame;
}

/**
 * The sending phone's part of a move (MM-697). It connects to the address in the scanned code and says, sealed under
 * the code's key, which version it runs; the receiving phone answers whether it runs the same. Only then is the
 * payload sent, in sealed frames, the last one marked final, and the move is done when the receiving phone says it
 * has it all. Nothing of the person's data crosses the network before both phones agree, and nothing unsealed ever.
 */
export class MoveSender implements MoveSending {
  private readonly dialer: LinkDialer;
  private readonly cipher: MoveCipher;
  private readonly identity: () => Promise<MoveIdentity>;

  constructor({ dialer, cipher, identity }: { dialer: LinkDialer; cipher: MoveCipher; identity: () => Promise<MoveIdentity> }) {
    this.dialer = dialer;
    this.cipher = cipher;
    this.identity = identity;
  }

  /**
   * Sends `payload` to the phone that showed `code`. Fails with a `MoveProblem`: `unreachable`, `versionMismatch`
   * (with the other phone's identity) or `broken`.
   */
  async send(code: MoveCode, payload: MovePayload, progress?: MoveProgress): Promise<void> {
    const connection = await this.dialer.connect(code.address);
    try {
      const identity = await this.identity();
      const sealer = await this.cipher.sealer(code.key);
      await connection.send(sealer.header);
      await connection.send(sealer.seal(message({ kind: 'hello', app: identity.app, schema: identity.schema })));
      const opener = await this.cipher.opener(code.key, await next(connection));
      const reply = JSON.parse(decoder.decode(opener.open(await next(connection)).plain)) as {
        kind?: unknown;
        app?: unknown;
        schema?: unknown;
      };
      if (reply.kind === 'mismatch' && typeof reply.app === 'string' && typeof reply.schema === 'number') {
        throw new MoveProblem('versionMismatch', { app: reply.app, schema: reply.schema });
      }
      if (reply.kind !== 'ready') throw new MoveProblem('broken');
      const total = payload.snapshot.length + payload.photos.length;
      await connection.send(sealer.seal(message({ kind: 'sizes', snapshot: payload.snapshot.length, photos: payload.photos.length })));
      const whole = new Uint8Array(total);
      whole.set(payload.snapshot, 0);
      whole.set(payload.photos, payload.snapshot.length);
      let sent = 0;
      do {
        const chunk = whole.subarray(sent, sent + moveChunkBytes);
        sent += chunk.length;
        await connection.send(sealer.seal(chunk, sent === total));
        progress?.(sent, total);
      } while (sent < total);
      const done = JSON.parse(decoder.decode(opener.open(await next(connection)).plain)) as { kind?: unknown };
      if (done.kind !== 'received') throw new MoveProblem('broken');
    } catch (error) {
      throw error instanceof MoveProblem ? error : new MoveProblem('broken');
    } finally {
      await connection.close().catch(() => undefined);
    }
  }
}
