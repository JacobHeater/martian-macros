import { useContext, useEffect, useRef, useState } from 'react';
import type { CameraPreview } from '../domain/integration/CameraPreview';
import { PhotoPose } from '../domain/photos/PhotoPose';
import { photoSets } from '../domain/photos/photoSets';
import { tooSoonForPhotos } from '../domain/photos/tooSoonForPhotos';
import { photoPoseLabel } from '../format/photoPoseLabel';
import { CloseScreenContext } from '../app/CloseScreenContext';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmCameraPreview } from '../ui/MmCameraPreview';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmSegmented } from '../ui/MmSegmented';
import { Notice } from '../ui/Notice';
import { useOverlays } from '../ui/useOverlays';
import { PhotoLockGate } from './PhotoLockGate';
import { usePhotoBytes } from './usePhotoBytes';
import { usePhotoLock } from './usePhotoLock';
import './progress.css';

/** How many sets the checklist is drawn for; from then on the habit is set. */
const checklistSets = 3;

/** What makes two photos comparable, said the first times (MM-157). */
const checklist = [
  'The same place, against the same background.',
  'The same light: no window behind you.',
  'The same time of day: the morning, with the weigh-in, before eating.',
  'The same clothing, and the camera at the same height and distance.',
] as const;

/** The self-timer's choices, in seconds; none is the shutter at once. */
const timers = [0, 5, 10] as const;

/**
 * Taking a progress photo (MM-157), inside the app: the camera's picture
 * with the last photo of the same pose laid over it faintly, to match
 * distance and framing; the checklist folded under "Each time, the same
 * way" for the first sets, open on the very first, so the picture and the
 * shutter fit the first screenful after that; front, side and back in
 * turn, each optional. A self-timer of 5 or 10 seconds, counted aloud and
 * cancellable, for a photo taken alone; the very first set starts on the
 * front camera, which shows the person themselves. A set within a week of
 * the last is kept and gently noted. A camera that cannot be opened is
 * tried again on "Try again" and on coming back to the app. Behind the
 * phone's lock with the other photo screens (`usePhotoLock`). The photo
 * goes nowhere but this phone's app storage.
 */
export function PhotoCameraScreen() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const close = useContext(CloseScreenContext);
  const today = useCell(state.today);
  const loaded = useLoaded(state.progressPhotos);
  const photos = loaded ?? [];
  const { status, unlock } = usePhotoLock();
  const [pose, setPose] = useState<PhotoPose>('front');
  const [chosenFacing, setFacing] = useState<'user' | 'environment'>();
  const [preview, setPreview] = useState<CameraPreview>();
  const [unavailable, setUnavailable] = useState(false);
  /** Each try at opening the camera; a new one opens it again. */
  const [attempt, setAttempt] = useState(0);
  const [taking, setTaking] = useState(false);
  const [timer, setTimer] = useState<(typeof timers)[number]>(0);
  /** The self-timer's seconds left while it counts; undefined when it is not counting. */
  const [countdown, setCountdown] = useState<number>();

  const setsBefore = photoSets(photos.filter((photo) => photo.date !== today)).length;
  // The very first set is most often taken alone, facing the phone: the front camera shows the person themselves.
  const facing = chosenFacing ?? (setsBefore === 0 ? 'user' : 'environment');
  const open = status === 'open' && loaded !== undefined;

  // The last photo of this pose is on screen: kept out of the app switcher (and, on Android, screenshots).
  useEffect(() => services.privateScreen.hide(), [services]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    let started: CameraPreview | undefined;
    void services.photoCamera.start(facing).then((camera) => {
      if (!live) {
        camera?.stop();
        return;
      }
      started = camera;
      setPreview(camera);
      setUnavailable(camera === undefined);
    });
    return () => {
      live = false;
      started?.stop();
      // A stopped camera is never pressed: nothing can be taken until the next one runs.
      setPreview(undefined);
      setCountdown(undefined);
    };
  }, [services, facing, open, attempt]);

  // Allowed in the phone's settings meanwhile, the camera opens on the way back.
  useEffect(() => {
    if (!unavailable) return;
    const back = () => {
      if (document.visibilityState === 'visible') setAttempt((n) => n + 1);
    };
    document.addEventListener('visibilitychange', back);
    return () => document.removeEventListener('visibilitychange', back);
  }, [unavailable]);

  const previous = [...photos].reverse().find((photo) => photo.pose === pose);
  const overlay = usePhotoBytes(previous?.id);

  const take = async () => {
    if (preview === undefined || taking) return;
    setTaking(true);
    try {
      const captured = await preview.capture();
      const firstToday = !photos.some((photo) => photo.date === today);
      await services.progressPhotos.savePhoto({ date: today, pose, takenAt: services.clock.now(), ...captured });
      const soon = firstToday && tooSoonForPhotos(photos, today);
      overlays.snack(
        soon
          ? `${photoPoseLabel(pose)} photo kept. Less than a week since the last set: every two to four weeks shows more.`
          : `${photoPoseLabel(pose)} photo kept.`,
      );
      const next = PhotoPose.values[PhotoPose.values.indexOf(pose) + 1];
      if (next === undefined) close?.();
      else setPose(next);
    } catch {
      overlays.snack('The photo could not be taken. Nothing was kept.');
    } finally {
      setTaking(false);
    }
  };
  const latestTake = useRef(take);
  useEffect(() => {
    latestTake.current = take;
  });

  // The self-timer, a second at a time; at none left, the photo is taken.
  useEffect(() => {
    if (countdown === undefined) return;
    if (countdown === 0) {
      setCountdown(undefined);
      void latestTake.current();
      return;
    }
    const tick = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(tick);
  }, [countdown]);

  if (status !== 'open') return <PhotoLockGate title="Take photos" status={status} onUnlock={unlock} />;

  const counting = countdown !== undefined;
  const shutter = () => {
    if (timer === 0) void take();
    else setCountdown(timer);
  };

  return (
    <Screen title="Take photos">
      {setsBefore >= checklistSets ? null : (
        <MmDisclosure title="Each time, the same way" initiallyExpanded={setsBefore === 0}>
          {checklist.map((line) => (
            <p key={line} className="app-text">
              {line}
            </p>
          ))}
        </MmDisclosure>
      )}
      <MmSegmented<PhotoPose>
        name="Pose"
        segments={PhotoPose.values.map((value) => ({ value, label: photoPoseLabel(value) }))}
        selected={pose}
        onChange={(chosen) => {
          setCountdown(undefined);
          setPose(chosen ?? pose);
        }}
      />
      <div className="app-gap-small" />
      {unavailable ? (
        <Notice
          kind="caution"
          title="The camera could not be opened"
          text="Allow the camera for Martian Macros in your phone’s settings, then come back. It is tried again when you do."
          action={<MmButton label="Try again" kind="secondary" onPress={() => setAttempt((n) => n + 1)} />}
        />
      ) : (
        <MmCameraPreview
          attach={preview?.attach}
          overlay={overlay}
          overlayLabel={`Your last ${photoPoseLabel(pose).toLowerCase()} photo, faint, to line this one up with`}
          countdown={countdown === 0 ? undefined : countdown}
        />
      )}
      {/* The self-timer, said aloud as it counts. */}
      <p className="app-caption" role="status">
        {countdown === undefined || countdown === 0 ? '' : `Photo in ${countdown} ${countdown === 1 ? 'second' : 'seconds'}.`}
      </p>
      {unavailable ? null : (
        <>
          <p className="app-caption">
            {previous === undefined
              ? `Stand relaxed, ${pose === 'front' ? 'facing the camera' : pose === 'side' ? 'side on to the camera' : 'back to the camera'}, arms loose.`
              : 'Line yourself up with the faint photo: the same distance and the same framing.'}
          </p>
          <MmSegmented<(typeof timers)[number]>
            name="Self-timer"
            segments={timers.map((value) => ({ value, label: value === 0 ? 'No timer' : `${value} s timer` }))}
            selected={timer}
            onChange={(chosen) => {
              setCountdown(undefined);
              setTimer(chosen ?? timer);
            }}
          />
          <div className="app-gap-small" />
          {counting ? (
            <MmButton label="Cancel timer" kind="secondary" expand onPress={() => setCountdown(undefined)} />
          ) : (
            <MmButton
              label={taking ? 'Taking…' : `Take ${photoPoseLabel(pose).toLowerCase()} photo`}
              icon="camera"
              expand
              onPress={preview === undefined ? undefined : shutter}
            />
          )}
          <MmButton
            label={facing === 'environment' ? 'Use the front camera' : 'Use the back camera'}
            kind="text"
            onPress={() => {
              setCountdown(undefined);
              setFacing(facing === 'environment' ? 'user' : 'environment');
            }}
          />
        </>
      )}
    </Screen>
  );
}
