import type { LectureSeries } from './lecture.types';

// The Home series chips, in the order they are shown. Home always shows one series: the first
// one is selected when the screen opens.
export const lectureSeries: { key: LectureSeries; label: string }[] = [
  { key: 'local', label: 'Local' },
  { key: 'guest', label: 'Guest' },
  { key: 'islahi-majlis', label: 'Islāhi Majlis' },
];

export const defaultLectureSeries: LectureSeries = 'local';
