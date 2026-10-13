/** `count` SQL parameter marks, comma separated: "?, ?, ?". */
export const placeholders = (count: number): string => Array.from({ length: count }, () => '?').join(', ');
