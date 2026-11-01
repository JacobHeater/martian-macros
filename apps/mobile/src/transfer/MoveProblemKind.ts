/**
 * Why a move did not happen (MM-698). `noWifi`: this phone has no Wi-Fi address. `unreachable`: the other phone could
 * not be reached. `noLocalNetwork`: this phone refused the app the local network, so it cannot reach the other
 * (iOS, MM-720). `versionMismatch`: the phones run different versions. `broken`: the connection dropped or what came
 * was changed. `stopped`: the receiving phone stopped listening. `notACode`: what was scanned is not a move code.
 */
export type MoveProblemKind = 'noWifi' | 'unreachable' | 'noLocalNetwork' | 'versionMismatch' | 'broken' | 'stopped' | 'notACode';
