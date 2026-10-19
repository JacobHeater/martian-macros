const values = ['android', 'ios', 'web'] as const;

/**
 * What the app is running on (MM-403): one of the two native shells, or a
 * browser, where the app is developed and reviewed and the web is never a
 * product (MM-228). A screen asks this where the platforms differ in what
 * they can do or what they call things, and nowhere else.
 */
export type Platform = (typeof values)[number];

export const Platform = { values } as const;
