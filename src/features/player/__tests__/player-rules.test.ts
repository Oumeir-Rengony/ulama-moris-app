/// <reference types="node" />
// Node types for fs and path: this test reads source files. (@types/node comes with Jest.)
// Guards for the player rules in AGENTS.md ("Audio: expo-audio plays, Zustand remembers" and
// "Zustand rules"). They read the app's source files, so breaking a rule fails a test.
import fs from 'fs';
import path from 'path';

const srcFolder = path.join(__dirname, '..', '..', '..');

// Every app source file: tests and test helpers are left out, since they mock these on purpose.
function listAppSourceFiles(folder: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const entryPath = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      const isTestFolder = entry.name === '__tests__' || entry.name === 'test-utils';
      if (!isTestFolder) {
        files.push(...listAppSourceFiles(entryPath));
      }
      continue;
    }
    const isCode = entry.name.endsWith('.ts') || entry.name.endsWith('.tsx');
    if (isCode) {
      files.push(entryPath);
    }
  }
  return files;
}

const appSourceFiles = listAppSourceFiles(srcFolder);

function relativeName(filePath: string): string {
  return path.relative(srcFolder, filePath);
}

function filesContaining(text: string | RegExp): string[] {
  const matches: string[] = [];
  for (const filePath of appSourceFiles) {
    const source = fs.readFileSync(filePath, 'utf8');
    const found = typeof text === 'string' ? source.includes(text) : text.test(source);
    if (found) {
      matches.push(relativeName(filePath));
    }
  }
  return matches.sort();
}

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(srcFolder, relativePath), 'utf8');
}

describe('player rules', () => {
  it('the stores hold data only: no expo-audio, no expo-router', () => {
    for (const storeFile of ['features/player/player.store.ts', 'features/player/listening-history.store.ts']) {
      const source = readSource(storeFile);
      expect(source).not.toMatch(/from 'expo-audio'/);
      expect(source).not.toMatch(/from 'expo-router'/);
    }
  });

  it('only the listening history is persisted, never the live player store', () => {
    expect(filesContaining('persist(')).toEqual(['features/player/listening-history.store.ts']);
  });

  it('there is one player, created in the engine', () => {
    expect(filesContaining('createAudioPlayer(')).toEqual(['features/player/audio-engine.ts']);
  });

  it('the audio mode is set in one place', () => {
    expect(filesContaining('setAudioModeAsync(')).toEqual(['features/player/setup-audio.ts']);
  });

  it('no screen creates its own player, and expo-av is never used', () => {
    expect(filesContaining('useAudioPlayer(')).toEqual([]);
    expect(filesContaining("'expo-av'")).toEqual([]);
  });

  it('the player store is always read through a selector', () => {
    expect(filesContaining('usePlayerStore()')).toEqual([]);
    expect(filesContaining('useListeningHistoryStore()')).toEqual([]);
  });

  it('Now Playing is never pushed, so it can never be stacked twice', () => {
    expect(filesContaining(/router\.push\([^)]*player/)).toEqual([]);
  });

  it('only the entry point and the Now Playing screen hook say whether Now Playing is on screen', () => {
    const callers = filesContaining('setIsNowPlayingOnScreen(').filter(
      (file) => file !== 'features/player/player.store.ts',
    );
    expect(callers).toEqual(['features/player/open-now-playing.ts', 'features/player/use-now-playing-presentation.ts']);
  });

  it('no component in src/components reads the player stores', () => {
    const componentFilesUsingStores = filesContaining(/usePlayerStore|useListeningHistoryStore/).filter((file) =>
      file.startsWith('components/'),
    );
    expect(componentFilesUsingStores).toEqual([]);
  });
});
