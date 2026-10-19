const values = ['prod', 'dev', 'demo'] as const;

/**
 * Which app this build is (MM-8, MM-177): the real one, the development
 * twin that installs beside it, or the seeded demo. Each has its own app
 * id, name and sandbox on the phone; the build is otherwise the same.
 */
export type AppIdentity = (typeof values)[number];

export const AppIdentity = {
  values,
  /** The identity named by a build define, or `dev` for anything else, as a browser is. */
  of(named: string): AppIdentity {
    return (values as readonly string[]).includes(named) ? (named as AppIdentity) : 'dev';
  },
} as const;
