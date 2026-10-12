import { NativeSqlDatabase } from '../../src/sql/native/NativeSqlDatabase';
import { sqlDatabaseContract } from '../contracts/sqlDatabaseContract';
import { fakeMmDb } from '../support/fakeMmDb';

// MM-232: the adapter the phone uses, with the plugin bridge stood in for
// by the WebAssembly build. What runs on the phone itself is the Kotlin
// side of the same calls.
sqlDatabaseContract('The native adapter', () => NativeSqlDatabase.open({ name: 'martian_macros' }, fakeMmDb()));
