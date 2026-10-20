/**
 * The two functions the accessibility test uses from `dom-accessibility-api`,
 * the accessible-name computation Testing Library itself runs on (MM-106).
 * The package ships types but its `exports` map does not point at them, so
 * TypeScript cannot find them under bundler resolution.
 */
declare module 'dom-accessibility-api' {
  export function computeAccessibleName(element: Element): string;
  export function isInaccessible(element: Element): boolean;
}
