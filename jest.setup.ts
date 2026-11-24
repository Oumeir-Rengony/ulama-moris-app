// Runs before every test file. Keep this to what the tests actually need, each with the
// reason it's here.

// Jest has no native safe-area module. The library's own mock gives every inset as 0.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Reanimated 4 loads native code Jest can't run, and its own mock fails under jest-expo's iOS
// preset. A small stand-in covers the parts the app uses (src/test-utils/reanimated-mock.ts).
jest.mock('react-native-reanimated', () => require('./src/test-utils/reanimated-mock'));

// The player's motion hands animation results back to JS with react-native-worklets'
// scheduleOnRN, whose real module needs the native worklets runtime. In tests, call at once.
jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: (...args: unknown[]) => unknown, ...args: unknown[]) => {
    callback(...args);
  },
}));

// The Now Playing sheet (@gorhom/bottom-sheet) runs on Reanimated and Gesture Handler internals
// Jest can't load. Its own mock renders the sheet's children and ignores the motion. The mock sets
// `default` without `__esModule`, so it's added here or `import BottomSheet from` gets the whole
// module object.
jest.mock('@gorhom/bottom-sheet', () => ({ __esModule: true, ...require('@gorhom/bottom-sheet/mock') }));

// Gesture Handler's native module isn't available in Jest. Its own setup swaps in mocks.
require('react-native-gesture-handler/jestSetup');

// Gesture Handler would hand its gestures to Reanimated when it finds it. In tests, tell it
// Reanimated and worklets aren't installed, so gestures run as plain JS callbacks.
jest.mock('react-native-gesture-handler/lib/module/handlers/gestures/reanimatedWrapper', () => ({
  Reanimated: undefined,
  Worklets: undefined,
}));

// The listening history is persisted to AsyncStorage, which has no native module in Jest.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// NetInfo has no native module in Jest: subscribing crashes ("reading 'isInternetReachable'").
// The player bridge listens for the connection coming back, so every test that renders it needs
// this. The library's own mock reports a connection and records listeners.
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock'),
);

// expo-notifications has no native module in Jest, and on import it warns that Expo Go lacks
// push notifications, which fails the test. The player bridge reaches it through the reminders,
// so every test gets the in-memory stand-in.
jest.mock('expo-notifications', () => require('./src/test-utils/fake-expo-notifications'));

// A console.error or console.warn during a test is a bug (a missing list key, an update outside
// act, a bad prop), so it fails the test that caused it instead of scrolling past in the output.
let consoleMessages: string[] = [];

// React passes a template ("…%s…") followed by its values; listing them all is enough to see
// what went wrong.
function describeConsoleCall(args: unknown[]): string {
  const parts: string[] = [];
  for (const arg of args) {
    parts.push(String(arg));
  }
  return parts.join(' ');
}

let consoleErrorSpy: jest.SpyInstance;
let consoleWarnSpy: jest.SpyInstance;

beforeEach(() => {
  consoleMessages = [];

  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    consoleMessages.push(`console.error: ${describeConsoleCall(args)}`);
  });
  consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    consoleMessages.push(`console.warn: ${describeConsoleCall(args)}`);
  });
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();

  if (consoleMessages.length > 0) {
    throw new Error(`The test printed to the console:\n\n${consoleMessages.join('\n\n')}`);
  }
});
