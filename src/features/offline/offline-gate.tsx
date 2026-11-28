import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { AppState, Modal, type AppStateStatus } from 'react-native';

import { OfflineSheet, type OfflineSheetStatus } from '@/components/OfflineSheet';
import { lectureSeries } from '@/features/lectures/lecture-series';

const seriesLabels = lectureSeries.map((series) => series.label);

// hidden: the app is usable. Otherwise the offline sheet blocks it, with that status.
type GateStatus = 'hidden' | OfflineSheetStatus;

// NetInfo says null while it doesn't know yet. That counts as connected, so the app isn't
// blocked by a guess; only a definite "no connection" shows the sheet.
function isDefinitelyOffline(isConnected: boolean | null): boolean {
  return isConnected === false;
}

// The blocking "No internet connection" sheet. Checked when the app opens and when it comes back
// to the front; a connection lost while the app is open is handled by each screen's own error
// states instead. Mounted once in the root layout, above everything.
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

  // While the sheet shows: close it as soon as the connection is back.
  const isShowing = status !== 'hidden';
  useEffect(() => {
    if (!isShowing) {
      return;
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected === true && !isDefinitelyOffline(state.isConnected)) {
        setStatus('hidden');
      }
    });
    return unsubscribe;
  }, [isShowing]);

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
