import { useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

// Reads `message` aloud with VoiceOver when it appears or changes ("Lectures didn’t load. Check
// your internet connection, then try again."). Pass null while there is nothing to announce.
//
// iOS only. Android reads the error views itself, because they are live regions
// (accessibilityLiveRegion="polite"), and the web maps that prop to aria-live. Announcing on
// those as well would read the error twice.
export function useAnnouncement(message: string | null): void {
  useEffect(() => {
    if (message === null) {
      return;
    }
    if (Platform.OS !== 'ios') {
      return;
    }
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
}
