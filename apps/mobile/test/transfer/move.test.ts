import { describe, expect, it } from 'vitest';
import { FakeLocalNetwork } from '../../src/transfer/FakeLocalNetwork';
import { MoveCode } from '../../src/transfer/MoveCode';
import type { MoveIdentity } from '../../src/transfer/MoveIdentity';
import { MoveProblem } from '../../src/transfer/MoveProblem';
import { MoveReceiver } from '../../src/transfer/MoveReceiver';
import { MoveSender } from '../../src/transfer/MoveSender';
import { SodiumMoveCipher } from '../../src/transfer/SodiumMoveCipher';
import type { MoveParcel } from '../../src/transfer/MoveParcel';
import { moveChunkBytes } from '../../src/transfer/moveChunkBytes';

/**
 * MM-698: a move between two phones, the real sender and receiver sealing under the real cipher, over a Wi-Fi in
 * memory that keeps every frame as someone watching the network would see it.
 */
const cipher = new SodiumMoveCipher();
const same: MoveIdentity = { app: '1.0 (7)', schema: 12 };

/** Bytes that say what they are in words, so a test can look for them on the wire. */
const marked = (word: string, length: number) => {
  const bytes = new Uint8Array(length);
  const mark = new TextEncoder().encode(word);
  for (let at = 0; at + mark.length <= length; at += mark.length * 3) bytes.set(mark, at);
  return bytes;
};

/** A payload larger than one frame, so it crosses in several. */
const payload = { snapshot: marked('Weigh-in 82.4 kg on 2026-10-12', moveChunkBytes + 1000), photos: marked('front pose photo', 5000),
  coachAi: { provider: 'anthropic' as const, apiKey: 'sk-ant-api03-SECRETKEYVALUE' },
};
/** The move's parcel: everything (MM-698). */
const everything: MoveParcel = { kind: 'everything', payload };
/** A copy of foods (MM-715), as the food layer's bytes, larger than one frame. */
const foods: MoveParcel = { kind: 'foods', foods: marked('{"name":"Salmon","kcal":400}', moveChunkBytes + 300) };

/** The move's payload from what arrived, which a move test expects to be everything. */
const payloadOf = (parcel: MoveParcel) => {
  if (parcel.kind !== 'everything') throw new Error(`Expected everything, got ${parcel.kind}.`);
  return parcel.payload;
};

function phones({ receiving = same, sending = same }: { receiving?: MoveIdentity; sending?: MoveIdentity } = {}) {
  const network = new FakeLocalNetwork();
  const receiver = new MoveReceiver({ listener: network, cipher, identity: async () => receiving });
  const sender = new MoveSender({ dialer: network, cipher, identity: async () => sending });
  return { network, receiver, sender };
}

const problemOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error instanceof MoveProblem ? error : error;
  }
  return undefined;
};

describe('a move', () => {
  it('carries the whole payload, and the sender keeps its own', async () => {
    const { receiver, sender } = phones();
    const code = await receiver.open();
    const progress: number[] = [];
    const received = receiver.receive((done) => progress.push(done));
    await sender.send(code, everything);
    const arrived = payloadOf(await received);
    expect(arrived.snapshot).toEqual(payload.snapshot);
    expect(arrived.photos).toEqual(payload.photos);
    // MM-701: the coach's provider and key come too.
    expect(arrived.coachAi).toEqual(payload.coachAi);
    expect(progress.at(-1)).toBe(payload.snapshot.length + payload.photos.length);
    expect(payload.snapshot.length).toBe(moveChunkBytes + 1000);
  });

  it('carries a phone with no photos', async () => {
    const { receiver, sender } = phones();
    const code = await receiver.open();
    const received = receiver.receive();
    await sender.send(code, { kind: 'everything', payload: { snapshot: payload.snapshot, photos: new Uint8Array(), coachAi: payload.coachAi } });
    expect(payloadOf(await received).photos).toHaveLength(0);
  });

  it('MM-715: carries a copy of foods, whole and apart from a move, under the same opening and the same seal', async () => {
    const { network, receiver, sender } = phones();
    const code = await receiver.open();
    const progress: number[] = [];
    const received = receiver.receive((done) => progress.push(done));
    await sender.send(code, foods);
    const arrived = await received;
    expect(arrived.kind).toBe('foods');
    if (arrived.kind === 'foods') expect(arrived.foods).toEqual(foods.foods);
    expect(progress.at(-1)).toBe(foods.foods.length);
    const wire = new TextDecoder('latin1').decode(new Uint8Array(network.frames.flatMap((frame) => [...frame])));
    for (const word of ['Salmon', 'kcal', 'foods', 'sizes']) expect(wire).not.toContain(word);
  });

  it('MM-715: a copy of foods is refused when the versions differ, as a move is', async () => {
    const { receiver, sender } = phones({ sending: { ...same, schema: 13 } });
    const code = await receiver.open();
    const received = problemOf(receiver.receive());
    expect(await problemOf(sender.send(code, foods))).toMatchObject({ kind: 'versionMismatch' });
    await received;
  });

  it('puts nothing readable on the network: every frame is sealed under the code’s key', async () => {
    const { network, receiver, sender } = phones();
    const code = await receiver.open();
    const received = receiver.receive();
    await sender.send(code, everything);
    await received;
    const wire = new TextDecoder('latin1').decode(new Uint8Array(network.frames.flatMap((frame) => [...frame])));
    for (const word of ['Weigh-in', '82.4', '2026-10-12', 'front pose', 'hello', same.app, 'SECRETKEY', 'anthropic']) expect(wire).not.toContain(word);
  });

  it('refuses a phone without the key before reading anything, and keeps waiting for the right one', async () => {
    const { network, receiver, sender } = phones();
    const code = await receiver.open();
    const received = receiver.receive();
    const stranger = new MoveCode(code.address, new Uint8Array(32).fill(1));
    expect(await problemOf(sender.send(stranger, everything))).toMatchObject({ kind: 'broken' });
    expect(network.listening).toBe(true);
    await sender.send(code, everything);
    expect(payloadOf(await received).snapshot).toEqual(payload.snapshot);
  });

  it('refuses a payload with one byte changed on the way, and the receiving phone gets nothing', async () => {
    const { network, receiver, sender } = phones();
    const code = await receiver.open();
    // Frames: the sender's header and hello, the receiver's header and ready, the sizes, then the payload.
    network.tamper = (frame, index) => {
      if (index !== 6) return frame;
      const changed = frame.slice();
      changed[40] = (changed[40] as number) ^ 1;
      return changed;
    };
    const received = problemOf(receiver.receive());
    const sent = problemOf(sender.send(code, everything));
    expect(await received).toMatchObject({ kind: 'broken' });
    expect(await sent).toMatchObject({ kind: 'broken' });
  });

  it('sends nothing when the versions differ, and each phone hears the other’s', async () => {
    const newer: MoveIdentity = { app: '1.1 (8)', schema: 12 };
    const { network, receiver, sender } = phones({ sending: newer });
    const code = await receiver.open();
    const received = problemOf(receiver.receive());
    const sent = await problemOf(sender.send(code, everything));
    expect(sent).toMatchObject({ kind: 'versionMismatch', other: same });
    expect(await received).toMatchObject({ kind: 'versionMismatch', other: newer });
    // The sender's header and hello, the receiver's header and its answer: no payload frame.
    expect(network.frames).toHaveLength(4);
  });

  it('tells a different schema apart even at the same app version', async () => {
    const { receiver, sender } = phones({ sending: { ...same, schema: 13 } });
    const code = await receiver.open();
    const received = problemOf(receiver.receive());
    expect(await problemOf(sender.send(code, everything))).toMatchObject({ kind: 'versionMismatch' });
    await received;
  });

  it('stops listening once a move is received, and the old code no longer reaches it', async () => {
    const { network, receiver, sender } = phones();
    const code = await receiver.open();
    const received = receiver.receive();
    await sender.send(code, everything);
    await received;
    expect(network.listening).toBe(false);
    expect(await problemOf(sender.send(code, everything))).toMatchObject({ kind: 'unreachable' });
  });

  it('stops when told to: a waiting receive ends as stopped', async () => {
    const { network, receiver } = phones();
    await receiver.open();
    const received = problemOf(receiver.receive());
    await receiver.stop();
    expect(await received).toMatchObject({ kind: 'stopped' });
    expect(network.listening).toBe(false);
  });

  it('gives each code shown a new key', async () => {
    const { receiver } = phones();
    const first = await receiver.open();
    await receiver.stop();
    const second = await receiver.open();
    expect(second.key).not.toEqual(first.key);
  });

  it('says there is no Wi-Fi when the phone has no address to listen on', async () => {
    const { network, receiver } = phones();
    network.noWifi = true;
    expect(await problemOf(receiver.open())).toMatchObject({ kind: 'noWifi' });
  });
});

describe('a move code', () => {
  it('carries the address, the port and the key, in the QR code’s alphanumeric set', () => {
    const key = new Uint8Array(32).map((_, i) => i * 5);
    const text = new MoveCode({ host: '192.168.1.24', port: 47_310 }, key).toText();
    expect(text).toMatch(/^[0-9A-Z $%*+\-./:]+$/);
    const parsed = MoveCode.parse(text);
    expect(parsed?.address).toEqual({ host: '192.168.1.24', port: 47_310 });
    expect(parsed?.key).toEqual(key);
  });

  it('is not read from anything else', () => {
    for (const text of ['', '0123456789012', 'https://example.com', 'MMMOVE1:', 'MMMOVE1:ABC', 'MMMOVE1:not base32!']) {
      expect(MoveCode.parse(text)).toBeUndefined();
    }
  });
});
