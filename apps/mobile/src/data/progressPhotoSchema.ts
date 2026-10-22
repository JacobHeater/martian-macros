/**
 * The photo database (MM-157): the progress photos and the choices about
 * them, in a database file of their own beside the user's. The user's
 * database, and so its snapshot for a backup, never holds a photo; the
 * photos join a backup only as an archive, and only when the person has
 * chosen that. Named databases live where the phone's own backup does not
 * reach (`android:allowBackup="false"`; iOS `isExcludedFromBackup`, MM-65).
 * Version 1; a later change adds a step in `SqlProgressPhotoRepository`.
 */
export const progressPhotoSchema = `
CREATE TABLE IF NOT EXISTS "progress_photos" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "epoch_day" INTEGER NOT NULL,
  "pose" TEXT NOT NULL CHECK ("pose" IN ('front', 'side', 'back')),
  "taken_at_ms" INTEGER NOT NULL,
  "width" INTEGER NOT NULL CHECK ("width" > 0),
  "height" INTEGER NOT NULL CHECK ("height" > 0),
  "bytes" INTEGER NOT NULL CHECK ("bytes" > 0)
);
CREATE TABLE IF NOT EXISTS "progress_photo_pictures" (
  "photo_id" INTEGER NOT NULL PRIMARY KEY,
  "jpeg" BLOB NOT NULL
);
CREATE TABLE IF NOT EXISTS "photo_settings" (
  "id" INTEGER NOT NULL PRIMARY KEY CHECK ("id" = 1),
  "offered" INTEGER NULL CHECK ("offered" IS NULL OR "offered" IN (0, 1)),
  "back_up" INTEGER NOT NULL DEFAULT 0 CHECK ("back_up" IN (0, 1))
);
`;
