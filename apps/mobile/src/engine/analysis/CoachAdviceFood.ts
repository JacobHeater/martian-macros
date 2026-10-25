import type { CoachAdvice } from './CoachAdvice';

/** The food an order is about (MM-617), as `CoachAdvice.food` holds it. */
export type CoachAdviceFood = NonNullable<CoachAdvice['food']>;
