# Audio Player Reminder Notifications — Logic Guide

Nov 14, 2026 · @oumeir

## Overview

The app sends one of two reminders, never both: a continue listening reminder when the user has an unfinished audio, otherwise an inactivity reminder.

- **Goal:** bring users back to the app and help them finish what they started.
- **Constraint:** the two reminders must not compete. When an unfinished audio exists, the continue listening reminder replaces the inactivity reminder.
- **Delivery:** local notifications scheduled on the device (Expo Notifications), so they arrive even when the app is closed.

## Definitions

| Term | Meaning |
| --- | --- |
| Unfinished audio | An audio the user started but did not play to the end. In the code: past 5 seconds and under 95% played. |
| Finished audio | An audio played to the end, or past 95%. |
| Last listen | The last time the user played the unfinished audio. |
| Last activity | The last time the user used the app (opened it and then left). |

## Notification types

| Reminder | When it is sent | Repeats | Example message | On tap |
| --- | --- | --- | --- | --- |
| Continue listening | 24 hours after the last listen | Every 3 days after that, until the audio is finished | "You're partway through \[title\]. Tap to keep listening." | Opens the player at the saved position |
| Inactivity | 3 days after the last activity | No. It is rebooked each time the user uses the app | "New things to listen to are waiting for you." | Opens the app |

## Rules

1. **One type at a time.** Only one reminder type can be scheduled at any moment.
2. **Priority.** The continue listening reminder has priority. If an unfinished audio exists, the inactivity reminder is not scheduled.
3. **Repeat.** The continue listening reminder is sent 24 hours after the last listen, then every 3 days.
4. **Stop.** The continue listening reminders stop when the audio is finished. The inactivity reminder then takes over.
5. **Reset.** Each time the user uses the app, every reminder is cancelled and booked again from that moment.

## Decision logic

The logic runs when the user leaves the app. It also runs when the audio is paused or finishes while the app is in the background, for example from the lock screen.

&#91;embedded content: reminder decision flow · 1 decision, 2 outcomes\]

1. Cancel all scheduled reminders.
2. Check whether there is an unfinished audio.
3. **If yes:** schedule the continue listening reminder 24 hours after the last listen, then every 3 days. Do not schedule the inactivity reminder.
4. **If no:** schedule the inactivity reminder 3 days after the last activity.

Because step 1 always clears everything, the two reminder types can never be scheduled together.

### When the schedule is rebuilt

While the app is open, events only save the playback state. The schedule is rebuilt once, when the user leaves.

| Event | App open | App in background |
| --- | --- | --- |
| User pauses | Save state only | Save state + rebuild |
| Audio finishes | Save state only | Save state + rebuild |
| User leaves the app | Rebuild | (not applicable) |

The background case matters because the user may never open the app again. A pause or finish from the lock screen is the last chance to get the schedule right.

### Advantages over rebuilding on every event

An earlier version rebuilt the schedule on every pause, every finish and every exit. Both versions send the same reminders.

- **Fewer rebuilds.** A visit with 3 pauses and an exit rebuilds once instead of 4 times.
- **Less wasted work.** Each rebuild cancels and books up to 10 notifications; every rebuild except the last was overwritten anyway.
- **No race conditions.** Fast pause/play taps can't trigger overlapping rebuilds that leave a stale schedule.
- **Simpler to reason about.** There is one main moment the schedule changes, when the user leaves, plus a clear exception for background playback.

## Scenarios

| # | Situation | Reminder scheduled | Inactivity reminder? |
| --- | --- | --- | --- |
| 1 | User listens to half an audio and closes the app | Continue listening in 24 h, then every 3 days | No |
| 2 | User finishes the audio and closes the app | Inactivity in 3 days | Yes |
| 3 | User opens the app, plays nothing, has no unfinished audio | Inactivity in 3 days | Yes |
| 4 | User opens the app, plays nothing, but has an unfinished audio from before | Continue listening, 24 h after the last listen (or within a minute if that time has passed) | No |
| 5 | User returns within 24 h and finishes the audio | Continue reminders cancelled; inactivity in 3 days | Yes |
| 6 | User returns within 24 h, listens more, does not finish | Continue listening rebooked: 24 h from this listen, then every 3 days | No |
| 7 | User ignores every continue reminder | Continue listening keeps coming every 3 days | No |
| 8 | User returns within 3 days with no unfinished audio | Inactivity reminder rebooked 3 days from this visit | Yes |
| 9 | User starts audio B while audio A is unfinished | Continue listening for the latest audio, B | No |

**Example timeline (scenario 1 then 7):** the user stops halfway through an audio on Monday at 20:00 and does not come back.

- Tuesday 20:00: continue listening reminder
- Friday 20:00: continue listening reminder
- Next Monday 20:00: continue listening reminder
- ...every 3 days, until the user finishes the audio

No inactivity reminder is sent during this time.

## Implementation notes (React Native + Expo)

- **The check happens at scheduling time.** A local notification cannot run code when it fires, so the app checks for unfinished audio when it books reminders, not when they arrive.
- **Repeats are booked in advance.** The app books 10 continue reminders at once (24 h, then every 3 days), which covers about a month. The whole series is rebooked each time the user uses the app. iOS allows at most 64 pending notifications.
- **Fixed IDs.** Reminders use fixed identifiers (`reminder-continue-0` to `-9`, `reminder-inactive`), so they are easy to cancel and never duplicated.
- **When to save playback:** on pause, on track change, on finish and when the app goes to the background. Not on every progress tick. Saving does not rebuild the schedule unless the app is in the background.
- **Files:** `reminders.ts` holds the logic (`savePlayback`, `markFinished`, `rescheduleReminders`). `useReminders.ts` is the hook mounted at the app root; it handles taps.
- **Packages:** `npx expo install expo-notifications @react-native-async-storage/async-storage`
- **Testing:** use a development build. Expo Go is unreliable for local notifications on Android. To test quickly, temporarily set the delays to minutes.
