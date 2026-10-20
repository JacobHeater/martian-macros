import { base64OfBytes } from '../lang/base64OfBytes';
import type { MmBackupApi } from '../platform/MmBackupApi';
import type { MmDbApi } from '../sql/native/MmDbApi';
import { NativeSqlDatabase } from '../sql/native/NativeSqlDatabase';
import type { SqlDatabase } from '../sql/SqlDatabase';

/**
 * A backup's bytes as a connection to a copy on the phone (MM-63): written
 * to a temporary file by `MmBackup`, opened through `MmDb`, and the file
 * removed when the connection closes.
 */
export const openNativeSnapshot =
  ({ api, db }: { api: MmBackupApi; db: MmDbApi }) =>
  async (bytes: Uint8Array): Promise<SqlDatabase> => {
    const { path } = await api.writeTemp({ name: 'restore.sqlite', data: base64OfBytes(bytes) });
    const opened = await NativeSqlDatabase.open({ path }, db);
    return {
      select: (sql, params) => opened.select(sql, params),
      execute: (sql, params) => opened.execute(sql, params),
      executeScript: (sql) => opened.executeScript(sql),
      transaction: (work) => opened.transaction(work),
      close: async () => {
        await opened.close();
        await api.removeTemp({ path });
      },
    };
  };
