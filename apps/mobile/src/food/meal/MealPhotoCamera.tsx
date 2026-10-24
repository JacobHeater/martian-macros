import { useEffect, useState } from 'react';
import type { CameraPreview } from '../../domain/integration/CameraPreview';
import type { CapturedPhoto } from '../../domain/integration/CapturedPhoto';
import type { PhotoCameraProblem } from '../../domain/integration/PhotoCameraProblem';
import { photoCameraProblemText } from '../../format/photoCameraProblemText';
import { useApp } from '../../app/useApp';
import { MmButton } from '../../ui/MmButton';
import { MmCameraPreview } from '../../ui/MmCameraPreview';
import { Notice } from '../../ui/Notice';
import { useOverlays } from '../../ui/useOverlays';

interface MealPhotoCameraProps {
  /** How many photos the meal has, and the most it may have. */
  count: number;
  max: number;
  onTake: (photo: CapturedPhoto) => void;
  onDone: () => void;
}

/**
 * The camera inside the analysis (MM-599), the progress photos' camera
 * (MM-157) facing away: a photo of the plate is taken in the app, never
 * through the phone's camera app, so none reaches the gallery. It is held
 * only until it is sent.
 */
export function MealPhotoCamera({ count, max, onTake, onDone }: MealPhotoCameraProps) {
  const { services } = useApp();
  const overlays = useOverlays();
  const [preview, setPreview] = useState<CameraPreview>();
  const [problem, setProblem] = useState<PhotoCameraProblem>();
  const [attempt, setAttempt] = useState(0);
  const [taking, setTaking] = useState(false);

  useEffect(() => {
    let live = true;
    let started: CameraPreview | undefined;
    void services.photoCamera.start('environment').then((camera) => {
      const opened = typeof camera === 'string' ? undefined : camera;
      if (!live) {
        opened?.stop();
        return;
      }
      started = opened;
      setPreview(opened);
      setProblem(typeof camera === 'string' ? camera : undefined);
    });
    return () => {
      live = false;
      started?.stop();
      setPreview(undefined);
    };
  }, [services, attempt]);

  const take = async () => {
    if (preview === undefined || taking) return;
    setTaking(true);
    try {
      onTake(await preview.capture());
      if (count + 1 >= max) onDone();
    } catch {
      overlays.snack('The photo could not be taken.');
    } finally {
      setTaking(false);
    }
  };

  return (
    <div className="food-sheet">
      <h2 className="app-headline">Take a photo</h2>
      <p className="app-caption">Everything you ate, from above if you can. Take as many as you need, up to {max}.</p>
      <div className="app-gap-small" />
      {problem !== undefined ? (
        <Notice
          kind="caution"
          title="The camera could not be opened"
          text={photoCameraProblemText(problem)}
          action={<MmButton label="Try again" kind="secondary" onPress={() => setAttempt((n) => n + 1)} />}
        />
      ) : (
        <MmCameraPreview attach={preview?.attach} overlay={undefined} />
      )}
      <p className="app-caption" role="status">
        {count === 0 ? 'No photos yet.' : count === 1 ? '1 photo taken.' : `${count} photos taken.`}
      </p>
      {problem !== undefined ? null : (
        <MmButton
          label={preview === undefined ? 'Opening the camera…' : taking ? 'Taking…' : 'Take photo'}
          icon="camera"
          expand
          onPress={preview === undefined ? undefined : () => void take()}
        />
      )}
      <MmButton label="Done" kind="text" onPress={onDone} />
    </div>
  );
}
