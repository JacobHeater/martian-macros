/** The id a logged food is written to the health platform under (MM-70): the app's own, found again to remove it. */
export function foodRecordId(id: number): string {
  return `martian-macros-food-${id}`;
}
