import type { NewProgressPhoto } from '../domain/photos/NewProgressPhoto';
import type { PhotoSettings } from '../domain/photos/PhotoSettings';
import type { ProgressPhoto } from '../domain/photos/ProgressPhoto';
import type { ProgressPhotoRepository } from '../domain/repositories/ProgressPhotoRepository';
import type { Unsubscribe } from '../lang/Unsubscribe';
import type { Watched } from '../lang/Watched';

/**
 * A `ProgressPhotoRepository` opened on first use, never when the app starts
 * (MM-694). On iOS the photo database is unreadable while the phone is locked
 * unless already open (MM-157), and the shell starts the app again whenever
 * iOS drops the web view's process, locked or not: a start must not depend on
 * it. An opening that failed is forgotten, so the next call tries again, as
 * Try again on a photo surface does once the phone is unlocked.
 */
export class LazyProgressPhotoRepository implements ProgressPhotoRepository {
  private readonly open: () => Promise<ProgressPhotoRepository>;
  private opening: Promise<ProgressPhotoRepository> | undefined;

  constructor(open: () => Promise<ProgressPhotoRepository>) {
    this.open = open;
  }

  /** The repository, opened by the first call; one that failed to open is tried again by the next. */
  private opened(): Promise<ProgressPhotoRepository> {
    if (this.opening === undefined) {
      const attempt = this.open();
      this.opening = attempt;
      void attempt.catch(() => {
        if (this.opening === attempt) this.opening = undefined;
      });
    }
    return this.opening;
  }

  /** What `watch` gives once the repository is open; an opening that fails is told to `onError`. */
  private lazily<T>(watch: (repository: ProgressPhotoRepository) => Watched<T>): Watched<T> {
    return {
      subscribe: (listener, onError) => {
        let live = true;
        let stop: Unsubscribe | undefined;
        void this.opened().then(
          (repository) => {
            if (live) stop = watch(repository).subscribe(listener, onError);
          },
          (error: unknown) => {
            if (live) onError?.(error);
          },
        );
        return () => {
          live = false;
          stop?.();
        };
      },
    };
  }

  watchPhotos(): Watched<ProgressPhoto[]> {
    return this.lazily((repository) => repository.watchPhotos());
  }

  async photoBytes(id: number): Promise<Uint8Array | undefined> {
    return (await this.opened()).photoBytes(id);
  }

  watchPhotoSettings(): Watched<PhotoSettings> {
    return this.lazily((repository) => repository.watchPhotoSettings());
  }

  async savePhoto(photo: NewProgressPhoto): Promise<number> {
    return (await this.opened()).savePhoto(photo);
  }

  async deletePhoto(id: number): Promise<void> {
    return (await this.opened()).deletePhoto(id);
  }

  async savePhotoSettings(settings: PhotoSettings): Promise<void> {
    return (await this.opened()).savePhotoSettings(settings);
  }

  async totalBytes(): Promise<number> {
    return (await this.opened()).totalBytes();
  }

  async exportArchive(): Promise<Uint8Array> {
    return (await this.opened()).exportArchive();
  }

  async restoreArchive(archive: Uint8Array): Promise<void> {
    return (await this.opened()).restoreArchive(archive);
  }

  async eraseAll(): Promise<void> {
    return (await this.opened()).eraseAll();
  }
}
