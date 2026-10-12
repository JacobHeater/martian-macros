import { bytesOfBase64 } from '../../lang/bytesOfBase64';
import type { SqlValue } from '../SqlValue';
import type { BridgeSqlValue } from './BridgeSqlValue';

/** What `value` carried across the plugin bridge. */
export function fromBridgeValue(value: BridgeSqlValue): SqlValue {
  return typeof value === 'object' && value !== null ? bytesOfBase64(value.$blob) : value;
}
