import { Micronutrient } from '../domain/food/micros/Micronutrient';
import { Micronutrients } from '../domain/food/micros/Micronutrients';
import type { SqlRow } from '../sql/SqlRow';
import { optionalNumber } from './columns';

/** The micronutrients a row states in the columns MM-308 added, sodium included when the row has it. */
export function microsFromRow(r: SqlRow): Micronutrients {
  return new Micronutrients(
    Object.fromEntries(Micronutrient.values.map((n) => [n, optionalNumber(r, Micronutrient.column(n))])),
  );
}
