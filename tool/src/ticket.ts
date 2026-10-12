/** One requirements ticket, as `mm req` reads it. */
export interface Ticket {
  readonly component: string;
  readonly fileName: string;
  readonly type: string;
  readonly slug: string;
  readonly id: string;
  readonly number: number;
  readonly status: string;
  readonly related: readonly string[];
}
