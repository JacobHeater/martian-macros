/** The app's version as the phone reports it (MM-697), compared by two phones before a move. */
export interface AppVersionReader {
  read(): Promise<string>;
}
