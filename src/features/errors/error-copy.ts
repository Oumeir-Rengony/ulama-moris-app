// The words of the error states. Say what happened and what to do; never
// apologise. The message stays the same after a failed "Try again": no second wording.

// Under an error card's title ("Lectures didn’t load", "Results didn’t load").
export const errorCardMessage = 'Check your internet connection, then try again.';

// In Now Playing's "This lecture didn’t load" row. The players have no "Try again": opening the
// lecture again loads it again.
export const audioErrorMessage = 'Check your internet connection, then open the lecture again.';

// Under a "More lectures didn’t load" footer's title.
export const loadMoreErrorMessage = 'Check your connection.';

// What VoiceOver reads when an error appears: the title, then the message.
export function errorAnnouncement(title: string, message: string): string {
  return `${title}. ${message}`;
}
