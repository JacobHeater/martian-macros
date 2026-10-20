/** One line of the week's summary: a label, a figure, and what the figure is measured against or rests on (MM-149, MM-342). */
export interface AdherenceLine {
  readonly label: string;
  readonly value: string;
  readonly detail?: string;
}
