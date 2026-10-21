import { useApp } from '../app/useApp';
import { useAsync } from '../app/useAsync';

/** The picture of photo `id`, read from the phone when it is first drawn (MM-157); undefined until then, or for no photo. */
export function usePhotoBytes(id: number | undefined): Uint8Array | undefined {
  const { services } = useApp();
  return useAsync(
    () => (id === undefined ? Promise.resolve(undefined) : services.progressPhotos.photoBytes(id)),
    `${id ?? 'none'}`,
  );
}
