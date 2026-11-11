import { Stack } from 'expo-router';

// A deep link to /events/<slug> still gets a back button to the Events list.
export const unstable_settings = {
  anchor: 'index',
};

export default function EventsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
