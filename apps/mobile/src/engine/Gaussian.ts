import type { Mat } from './Mat';

/** A normal distribution over the filter's state: its mean and covariance. */
export interface Gaussian {
  readonly mean: readonly number[];
  readonly cov: Mat;
}
