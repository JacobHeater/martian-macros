/** The expenditure estimate a month ended on, with its uncertainty (MM-33). */
export interface ReportEstimate {
  readonly kcal: number;
  readonly sigmaKcal: number;
}
