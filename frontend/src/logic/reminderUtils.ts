import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { Progress } from '../types';

const REMINDERS_PREF_KEY = 'practiceRemindersEnabled';

function scheduleAt8pm(daysOffset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(20, 0, 0, 0);
  return date;
}

function isoForOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toLocaleDateString('sv-SE');
}

// A day has content if there are scheduled reviews or unseen notes to learn
function hasContentOnDate(progress: Progress, dateISO: string): boolean {
  const reviews = progress.review_date_to_spots[dateISO] ?? [];
  return reviews.length > 0 || progress.spots.some(s => s.status === 'unseen');
}

export async function schedulePracticeReminders(progress: Progress) {
  const { value } = await Preferences.get({ key: REMINDERS_PREF_KEY });
  const remindersEnabled = value === 'true';

  // Always clear existing notifications first
  const { notifications } = await LocalNotifications.getPending();
  if (notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: notifications.map(n => ({ id: n.id })),
    });
  }

  if (!remindersEnabled) return;

  const toSchedule: { id: number; title: string; body: string; schedule: { at: Date } }[] = [];
  let id = 1;

  // Days 1–3: 8pm reminder only when there's actually something to review or learn
  for (let day = 1; day <= 3; day++) {
    if (hasContentOnDate(progress, isoForOffset(day))) {
      toSchedule.push({
        id: id++,
        title: 'Fretty',
        body: 'Don\'t forget to practice today!',
        schedule: { at: scheduleAt8pm(day) },
      });
    }
  }

  // Lapsed reminders regardless of content — user has fallen behind
  for (const { days, body } of [
    { days: 7,  body: "It's been 1 week since your last lesson" },
    { days: 14, body: "It's been 2 weeks since your last lesson" },
    { days: 30, body: "It's been 1 month since your last lesson" },
  ]) {
    toSchedule.push({
      id: id++,
      title: 'Fretty',
      body,
      schedule: { at: scheduleAt8pm(days) },
    });
  }

  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({ notifications: toSchedule });
  }
}
