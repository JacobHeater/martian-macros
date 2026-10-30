/**
 * The food copy's format name and version, written by `foodCopyBytes` and expected by `foodCopyOfBytes`: version 1
 * carried foods (MM-715); version 2 carries water too (MM-718), and a phone reading version 1 refuses it whole
 * rather than add the foods and lose the water.
 */
export const foodCopyFormat = { format: 'martian-macros-food-copy', version: 2 } as const;
