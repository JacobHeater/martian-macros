/** One entry of a menu or a list of options. */
export interface MmMenuItem<T> {
  readonly value: T;
  readonly label: string;
}
