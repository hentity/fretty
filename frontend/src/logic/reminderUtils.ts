import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { Progress } from '../types';

const REMINDERS_PREF_KEY = 'practiceRemindersEnabled';

function scheduleAt8pm(dateISO: string): Date {
  const date = new Date(`${dateISO}T20:00:00`);
  return date;
}

function isoForOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toLocaleDateString('sv-SE');
}

function todayISO(): string {
  return new Date().toLocaleDateString('sv-SE');
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
  const today = todayISO();

  const hasUnseenNotes = progress.spots.some(s => s.status === 'unseen');

  if (hasUnseenNotes) {
    // Still learning: remind on days 1–3 if there's content, plus lapsed fallbacks
    for (let day = 1; day <= 3; day++) {
      const dateISO = isoForOffset(day);
      const reviews = progress.review_date_to_spots[dateISO] ?? [];
      if (reviews.length > 0 || hasUnseenNotes) {
        toSchedule.push({
          id: id++,
          title: 'Fretty',
          body: "Don't forget to practice today!",
          schedule: { at: scheduleAt8pm(dateISO) },
        });
      }
    }

    for (const { days, body } of [
      { days: 7,  body: "It's been 1 week since your last lesson" },
      { days: 14, body: "It's been 2 weeks since your last lesson" },
      { days: 30, body: "It's been 1 month since your last lesson" },
    ]) {
      toSchedule.push({
        id: id++,
        title: 'Fretty',
        body,
        schedule: { at: scheduleAt8pm(isoForOffset(days)) },
      });
    }
  } else {
    // All notes learned: only notify on the next 3 actual review dates
    const upcomingDates = Object.keys(progress.review_date_to_spots)
      .filter(d => d > today && (progress.review_date_to_spots[d]?.length ?? 0) > 0)
      .sort()
      .slice(0, 3);

    for (const dateISO of upcomingDates) {
      toSchedule.push({
        id: id++,
        title: 'Fretty',
        body: "You have notes due for review today!",
        schedule: { at: scheduleAt8pm(dateISO) },
      });
    }
  }

  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({ notifications: toSchedule });
  }
}
