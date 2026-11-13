// Runs before every test file. Keep this to what the tests actually need, each with the
// reason it's here.

// Jest has no native safe-area module. The library's own mock gives every inset as 0.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

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
