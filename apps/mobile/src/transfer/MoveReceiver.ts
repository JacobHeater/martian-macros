import type { LinkConnection } from './LinkConnection';
import type { LinkListener } from './LinkListener';
import type { MoveCipher } from './MoveCipher';
import { MoveCode } from './MoveCode';
import type { MoveIdentity } from './MoveIdentity';
import type { MoveReceiving } from './MoveReceiving';
import type { MoveOpener } from './MoveOpener';
import type { MovePayload } from './MovePayload';
import { MoveProblem } from './MoveProblem';
import type { MoveProgress } from './MoveProgress';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const message = (value: object) => encoder.encode(JSON.stringify(value));

/** The most a move may carry: well past any phone's records and photos, short of what a phone could hold in memory. */
const largestPayload = 1024 * 1024 * 1024;

/** How long a connection has to say hello before it is dropped, so a stray one cannot hold the listener. */
const helloWithinMs = 10_000;

/** A connection that did not open under the code's key: dropped, and the phone keeps waiting. */
const refused = Symbol('refused');

/** `promise`'s value, or undefined if it takes longer than `ms`. */
function within<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(undefined), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/**
 * The receiving phone's part of a move (MM-697). `open` makes a fresh key and listens, and gives the code to show;
 * `receive` waits for the phone that scanned it. A connection that does not open under the key is dropped before
 * anything else is read, and the phone keeps waiting. The right phone's version is compared with this one's; only
 * when they are the same is the payload taken, every frame checked as it comes. The listener stops once a move is
 * received, fails, or `stop` is called; a new code needs a new `open`.
 */
export class MoveReceiver implements MoveReceiving {
  private readonly listener: LinkListener;
  private readonly cipher: MoveCipher;
  private readonly identity: () => Promise<MoveIdentity>;
  private key: Uint8Array | undefined;

  constructor({ listener, cipher, identity }: { listener: LinkListener; cipher: MoveCipher; identity: () => Promise<MoveIdentity> }) {
    this.listener = listener;
    this.cipher = cipher;
    this.identity = identity;
  }

  /** Starts listening under a new key. Fails with a `MoveProblem` of kind `noWifi`. */
  async open(): Promise<MoveCode> {
    this.key = await this.cipher.newKey();
    const address = await this.listener.listen();
    return new MoveCode(address, this.key);
  }

  /**
   * The payload the scanning phone sent. Fails with a `MoveProblem`: `stopped`, `versionMismatch` (with the sending
   * phone's identity) or `broken`.
   */
  async receive(progress?: MoveProgress): Promise<MovePayload> {
    const key = this.key;
    if (key === undefined) throw new MoveProblem('stopped');
    try {
      for (;;) {
        const connection = await this.listener.accept();
        const outcome = await this.serve(connection, key, progress);
        if (outcome !== refused) return outcome;
      }
    } finally {
      await this.stop();
    }
  }

  /** Stops listening and forgets the key, so the code shown no longer works. */
  async stop(): Promise<void> {
    this.key = undefined;
    await this.listener.stop().catch(() => undefined);
  }

  private async serve(connection: LinkConnection, key: Uint8Array, progress?: MoveProgress): Promise<MovePayload | typeof refused> {
    try {
      const greeted = await this.greeting(connection, key);
      if (greeted === refused) return refused;
      const { hello, opener } = greeted;
      try {
        const identity = await this.identity();
        const sealer = await this.cipher.sealer(key);
        await connection.send(sealer.header);
        if (hello.app !== identity.app || hello.schema !== identity.schema) {
          await connection.send(sealer.seal(message({ kind: 'mismatch', app: identity.app, schema: identity.schema }), true));
          throw new MoveProblem('versionMismatch', hello);
        }
        await connection.send(sealer.seal(message({ kind: 'ready' })));
        const next = async () => {
          const frame = await connection.receive();
          if (frame === undefined) throw new MoveProblem('broken');
          return opener.open(frame);
        };
        const sizes = JSON.parse(decoder.decode((await next()).plain)) as { kind?: unknown; snapshot?: unknown; photos?: unknown };
        const { snapshot, photos } = sizes;
        if (
          sizes.kind !== 'sizes' ||
          typeof snapshot !== 'number' ||
          typeof photos !== 'number' ||
          !Number.isInteger(snapshot) ||
          !Number.isInteger(photos) ||
          snapshot < 1 ||
          photos < 0 ||
          snapshot + photos > largestPayload
        ) {
          throw new MoveProblem('broken');
        }
        const total = snapshot + photos;
        const whole = new Uint8Array(total);
        let received = 0;
        for (;;) {
          const { plain, final } = await next();
          if (received + plain.length > total) throw new MoveProblem('broken');
          whole.set(plain, received);
          received += plain.length;
          progress?.(received, total);
          if (final) break;
        }
        if (received !== total) throw new MoveProblem('broken');
        await connection.send(sealer.seal(message({ kind: 'received' }), true));
        return { snapshot: whole.slice(0, snapshot), photos: whole.slice(snapshot) };
      } catch (error) {
        throw error instanceof MoveProblem ? error : new MoveProblem('broken');
      }
    } finally {
      await connection.close().catch(() => undefined);
    }
  }

  /** The sender's hello, opened under the key; refused when it does not open, or does not come in time. */
  private async greeting(
    connection: LinkConnection,
    key: Uint8Array,
  ): Promise<{ hello: { app: string; schema: number }; opener: MoveOpener } | typeof refused> {
    try {
      const header = await within(connection.receive(), helloWithinMs);
      if (header === undefined) return refused;
      const opener = await this.cipher.opener(key, header);
      const sealed = await within(connection.receive(), helloWithinMs);
      if (sealed === undefined) return refused;
      const hello = JSON.parse(decoder.decode(opener.open(sealed).plain)) as { kind?: unknown; app?: unknown; schema?: unknown };
      if (hello.kind !== 'hello' || typeof hello.app !== 'string' || typeof hello.schema !== 'number') return refused;
      return { hello: { app: hello.app, schema: hello.schema }, opener };
    } catch {
      return refused;
    }
  }
}
