import { useNavigation, type NativeStackNavigationProp } from 'expo-router';
import { useEffect } from 'react';

import { usePlayerStore } from './player.store';

type RootStackParams = {
  player: undefined;
};

// How long Now Playing takes to slide away (measured on the iOS simulator: about 350 ms).
export const NOW_PLAYING_CLOSE_ANIMATION_MS = 400;

// A close that is still sliding away. Module scope, so a Now Playing that opens again before
// the timer fires can cancel it.
let pendingCloseTimer: ReturnType<typeof setTimeout> | null = null;

function cancelPendingClose(): void {
  if (pendingCloseTimer !== null) {
    clearTimeout(pendingCloseTimer);
    pendingCloseTimer = null;
  }
}

// Called once, at the top of the Now Playing screen. Keeps isNowPlayingOnScreen true while the
// screen is up, and sets it back to false only once the screen has slid away, so the mini player
// never appears underneath (or on top of) Now Playing while it closes.
//
// How "closed" is detected, checked on the iOS simulator:
// - A native dismissal (swipe down, Android back) sends transitionEnd { closing: true } at the
//   end of the animation, before the screen unmounts. Then the bar may show at once.
// - The chevron (router.back) and the web stack send no closing event at all: the screen
//   unmounts right away while the slide-down is still running. Then wait for the animation.
export function useNowPlayingPresentation(): void {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();

  useEffect(() => {
    const { setIsNowPlayingOnScreen } = usePlayerStore.getState();
    let hasFinishedClosing = false;

    // Opened again before the last close finished: that close no longer applies.
    cancelPendingClose();
    // Arrived without openNowPlaying (a deep link): the screen is up, so the bar stays hidden.
    setIsNowPlayingOnScreen(true);

    const removeTransitionEndListener = navigation.addListener('transitionEnd', (event) => {
      if (event.data.closing) {
        hasFinishedClosing = true;
        setIsNowPlayingOnScreen(false);
      }
    });

    return () => {
      removeTransitionEndListener();
      if (hasFinishedClosing) {
        return;
      }
      pendingCloseTimer = setTimeout(() => {
        pendingCloseTimer = null;
        usePlayerStore.getState().setIsNowPlayingOnScreen(false);
      }, NOW_PLAYING_CLOSE_ANIMATION_MS);
    };
  }, [navigation]);
}
