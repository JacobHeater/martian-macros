/** How far a move has come (MM-697): bytes of the payload sent or received, of `total`. */
export type MoveProgress = (done: number, total: number) => void;
