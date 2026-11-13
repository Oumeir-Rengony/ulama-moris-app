import { setAudioModeAsync } from 'expo-audio';

// Called once, from the root layout, when the app starts. The audio mode is global, so this is
// the only place that sets it.
// - playsInSilentMode: lectures are speech the user chose to hear, so the silent switch shouldn't mute them.
// - shouldPlayInBackground: keep playing with the screen locked or another app open.
// - interruptionMode 'doNotMix': required for the lock screen / notification controls. The
//   default ('mixWithOthers') silently stops the OS from linking its controls to this player.
export async function setupAudio(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  } catch (error) {
    // Playback still works with the default mode, minus background audio and lock-screen controls.
    console.error('Could not set the audio mode. Background playback and lock-screen controls may not work.', error);
  }
}
