import { useAudioPlayerStatus, type AudioStatus } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import {
  failCurrentLecture,
  finishPendingResumeIfReady,
  getPlayer,
  playNext,
  saveCurrentLectureAsFinished,
  saveCurrentProgress,
} from './audio-engine';
import { rescheduleRemindersIfInBackground } from '@/features/reminders/reschedule-reminders';

import { selectHasAudioFailed, usePlayerStore } from './player.store';

// While playing, the resume point is saved this often.
const CHECKPOINT_INTERVAL_MS = 10_000;

function logResumeError(error: unknown): void {
  console.error('Could not seek to the saved resume point.', error);
}

// True when this update says the lecture's audio didn't load (or broke off).
// One exception, on web: the browser refuses to start playback that no tap started (an
// auto-advance while the tab is in the background, for example). expo-audio reports that as an
// error too, but the audio is loaded and fine: it just stays paused, and play works on the next
// tap. A real load failure on web comes with isLoaded false.
function isAudioFailure(status: AudioStatus): boolean {
  const audioError = status.error ?? null;
  if (audioError === null) {
    return false;
  }
  const isPlayRefusedByBrowser = Platform.OS === 'web' && status.isLoaded;
  if (isPlayRefusedByBrowser) {
    return false;
  }
  return true;
}


// The one place where expo-audio's status reaches the app. Mounted once in the root layout.
// Renders nothing.
//
// Status flows one way: player → this bridge → player.store. Pauses from outside the app (the
// lock screen, a phone call, unplugged headphones) reach the UI only through here, which is why
// buttons never set isPlaying themselves.
export function PlayerStatusBridge() {
  const status = useAudioPlayerStatus(getPlayer());

  const wasPlayingRef = useRef(false);
  const lastCheckpointTimeRef = useRef(0);
  // The same "finished" status can arrive more than once. Advance only once per finish.
  const hasHandledFinishRef = useRef(false);

  useEffect(() => {
    const playerStore = usePlayerStore.getState();
    playerStore.applyStatus({
      isPlaying: status.playing,
      isBuffering: status.isBuffering,
      isLoaded: status.isLoaded,
      positionSec: status.currentTime,
      durationSec: status.duration,
    });

    // The audio didn't load. expo-audio says so in this one update only, so the store keeps it.
    // Nothing else happens on a failed update: no checkpoint, no auto-advance.
    if (isAudioFailure(status)) {
      failCurrentLecture();
      wasPlayingRef.current = false;
      return;
    }

    // Loaded after all (a late error from an earlier load): back to the normal controls, so the
    // user can never be left with audio playing and no pause button.
    if (selectHasAudioFailed(playerStore) && status.isLoaded) {
      playerStore.clearAudioFailure();
    }

    finishPendingResumeIfReady().catch(logResumeError);

    // Auto-advance. The finished lecture restarts from 0 next time.
    if (status.didJustFinish) {
      wasPlayingRef.current = false;
      if (!hasHandledFinishRef.current) {
        hasHandledFinishRef.current = true;
        saveCurrentLectureAsFinished();
        playNext();
        // A finish from the lock screen may be the last chance to get the reminders right.
        rescheduleRemindersIfInBackground();
      }
      return;
    }
    hasHandledFinishRef.current = false;

    const wasPlaying = wasPlayingRef.current;
    wasPlayingRef.current = status.playing;
    const now = Date.now();

    const didStartPlaying = !wasPlaying && status.playing;
    if (didStartPlaying) {
      lastCheckpointTimeRef.current = now;
      // Start checkpoint: Continue listening switches to this lecture as soon as it plays.
      saveCurrentProgress();
      // Played again after the queue ended (for example from the lock screen): the session is back.
      if (playerStore.hasQueueEnded) {
        playerStore.setHasQueueEnded(false);
      }
      return;
    }

    // A pause from anywhere: the app, the lock screen, a call, headphones.
    const didPause = wasPlaying && !status.playing;
    if (didPause) {
      saveCurrentProgress();
      // A pause from the lock screen may be the last chance to get the reminders right.
      rescheduleRemindersIfInBackground();
      return;
    }

    const isCheckpointDue = status.playing && now - lastCheckpointTimeRef.current >= CHECKPOINT_INTERVAL_MS;
    if (isCheckpointDue) {
      lastCheckpointTimeRef.current = now;
      saveCurrentProgress();
    }
  }, [status]);

  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'background') {
        saveCurrentProgress();
        return;
      }
      // Back from the background: show the player's real state on the first frame, before the
      // next status update arrives.
      if (nextState === 'active') {
        const player = getPlayer();
        usePlayerStore.getState().applyStatus({
          isPlaying: player.playing,
          isBuffering: player.isBuffering,
          isLoaded: player.isLoaded,
          positionSec: player.currentTime,
          durationSec: player.duration,
        });
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
