const labels = { dashboard: 'Dashboard', food: 'Food', train: 'Train', progress: 'Progress', coach: 'Coach' } as const;

/** The main destinations, in the drawer's order (MM-711). */
export type HomeDestination = keyof typeof labels;

export const HomeDestination = {
  values: Object.keys(labels) as readonly HomeDestination[],

  label(destination: HomeDestination): string {
    return labels[destination];
  },
} as const;
