import {
  useBottomSheetInternal,
  useGestureEventsHandlersDefault,
  type GestureEventHandlerCallbackType,
  type GestureEventsHandlersHookType,
} from '@gorhom/bottom-sheet';
import { createContext, use, useCallback } from 'react';
import { scheduleOnRN } from 'react-native-worklets';

import { decidePanelRelease, type PanelDecision } from './panel-rules';

// The Now Playing sheet's drag handling, passed to gorhom as `gestureEventsHandlersHook`.
//
// Gorhom's own start / change / finalize handlers are kept (the sheet follows the finger from
// wherever it is, clamped between open and closed). Only the release is ours: it decides open or
// closed with decidePanelRelease, starts the spring there, and reports the decision. So nothing
// depends on gorhom's onAnimate / onChange, which it skips or fires late (see
// docs/now-playing-animation-migration.md, "Pitfalls").

type AnimateToPosition = NonNullable<ReturnType<typeof useBottomSheetInternal>>['animateToPosition'];
// Gorhom's ANIMATION_SOURCE.GESTURE. The enum isn't exported from the package's entry point.
const GESTURE_ANIMATION_SOURCE = 2 as Parameters<AnimateToPosition>[1];

// Called on the JS thread with the release's decision. Provided by the panel (NowPlayingPanel),
// which records where the sheet is heading before passing the decision on to the flows.
export const PanelReleaseContext = createContext<((decision: PanelDecision) => void) | null>(null);

export const usePanelSheetGestures: GestureEventsHandlersHookType = () => {
  const defaultHandlers = useGestureEventsHandlersDefault();
  const { animatedPosition, animatedDetentsState, animateToPosition } = useBottomSheetInternal();
  const onPanelReleased = use(PanelReleaseContext);
  if (onPanelReleased === null) {
    throw new Error('usePanelSheetGestures must be used inside the Now Playing panel');
  }

  const handleOnEnd: GestureEventHandlerCallbackType = useCallback(
    function handleOnEnd(_source, { velocityY }) {
      'worklet';
      const { highestDetentPosition, closedDetentPosition } = animatedDetentsState.get();
      if (highestDetentPosition === undefined || closedDetentPosition === undefined) {
        return;
      }

      // Gorhom's positions are the sheet's top edge in the container: open = highestDetentPosition,
      // closed = closedDetentPosition (just below the bottom edge).
      const height = closedDetentPosition - highestDetentPosition;
      const offset = animatedPosition.get() - highestDetentPosition;
      const decision = decidePanelRelease({ offset, velocityY, height });

      let targetPosition = closedDetentPosition;
      if (decision === 'open') {
        targetPosition = highestDetentPosition;
      }
      // The spring carries on at the finger's speed, so a flick doesn't stall at the release.
      animateToPosition(targetPosition, GESTURE_ANIMATION_SOURCE, velocityY);
      scheduleOnRN(onPanelReleased, decision);
    },
    [animatedDetentsState, animatedPosition, animateToPosition, onPanelReleased],
  );

  return {
    handleOnStart: defaultHandlers.handleOnStart,
    handleOnChange: defaultHandlers.handleOnChange,
    handleOnEnd,
    handleOnFinalize: defaultHandlers.handleOnFinalize,
  };
};
