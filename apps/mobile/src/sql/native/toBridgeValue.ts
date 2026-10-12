import { base64OfBytes } from '../../lang/base64OfBytes';
import type { SqlValue } from '../SqlValue';
import type { BridgeSqlValue } from './BridgeSqlValue';

/** `value` as the plugin bridge carries it. */
export function toBridgeValue(value: SqlValue): BridgeSqlValue {
  return value instanceof Uint8Array ? { $blob: base64OfBytes(value) } : value;
}
