/**
 * The shortest passphrase for a backup (MM-63): the file can be attacked
 * offline for as long as anyone holds it, so longer than a login's; a few
 * words reach it easily (NIST SP 800-63B-4 asks 15 of a single-factor
 * login; Argon2id carries the rest here).
 */
export const shortestPassphrase = 12;
