/**
 * Why a move did not happen (MM-697). `noWifi`: this phone has no Wi-Fi address. `unreachable`: the other phone could
 * not be reached. `versionMismatch`: the phones run different versions. `broken`: the connection dropped or what came
 * was changed. `stopped`: the receiving phone stopped listening. `notACode`: what was scanned is not a move code.
 */
export type MoveProblemKind = 'noWifi' | 'unreachable' | 'versionMismatch' | 'broken' | 'stopped' | 'notACode';
