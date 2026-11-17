import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { AppState, Modal, type AppStateStatus } from 'react-native';

import { OfflineSheet, type OfflineSheetStatus } from '@/components/OfflineSheet';
import { isFailureForced } from '@/features/dev/forced-failures.store';
import { lectureSeries } from '@/features/lectures/lecture-series';

const seriesLabels = lectureSeries.map((series) => series.label);

// hidden: the app is usable. Otherwise the offline sheet blocks it, with that status.
type GateStatus = 'hidden' | OfflineSheetStatus;

// NetInfo says null while it doesn't know yet. That counts as connected, so the app isn't
// blocked by a guess; only a definite "no connection" shows the sheet.
// In development, the "No connection" switch at /dev/failures makes every check say offline.
function isDefinitelyOffline(isConnected: boolean | null): boolean {
  if (isFailureForced('offline')) {
    return true;
  }
  return isConnected === false;
}

// The blocking "No internet connection" sheet. Checked when the app opens and when it comes back
// to the front, and whenever the connection drops while the app is open: a lost connection always
// shows this sheet, whatever was loading (a list, the lecture audio). Mounted once in the root
// layout, above everything.
//
// Closes by itself, once, when the connection comes back (no retry loop). "Try again" checks
// the connection now: connected closes the sheet, and Home's lectures load (TanStack Query
// refetches what failed when NetInfo reports the connection back).
export function OfflineGate() {
  const [status, setStatus] = useState<GateStatus>('hidden');

  // On launch, and every time the app returns to the front.
  useEffect(() => {
    async function checkConnection() {
      const state = await NetInfo.fetch();
      if (isDefinitelyOffline(state.isConnected)) {
        setStatus('offline');
      }
    }

    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'active') {
        checkConnection();
      }
    }

    checkConnection();
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  // While the app is open: show the sheet as soon as the connection drops, and close it as soon
  // as it comes back.
  useEffect(() => {
    function showUnlessAlreadyShowing(current: GateStatus): GateStatus {
      // "Try again" is checking right now: let it finish and decide.
      if (current !== 'hidden') {
        return current;
      }
      return 'offline';
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (isDefinitelyOffline(state.isConnected)) {
        setStatus(showUnlessAlreadyShowing);
        return;
      }
      if (state.isConnected === true) {
        setStatus('hidden');
      }
    });
    return unsubscribe;
  }, []);

  const isShowing = status !== 'hidden';

  async function handleTryAgainPress() {
    setStatus('checking');
    const state = await NetInfo.refresh();
    // Still no connection: the sheet stays as it was, with the same message.
    if (isDefinitelyOffline(state.isConnected)) {
      setStatus('offline');
      return;
    }
    setStatus('hidden');
  }

  // Android's back button does nothing: the sheet can't be dismissed.
  function ignoreBackButton() {}

  if (!isShowing) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={ignoreBackButton}
    >
      <OfflineSheet status={status} seriesLabels={seriesLabels} onTryAgainPress={handleTryAgainPress} />
    </Modal>
  );
}
