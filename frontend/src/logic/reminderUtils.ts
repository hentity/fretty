import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';

const REMINDERS_PREF_KEY = 'practiceRemindersEnabled';

export async function schedulePracticeReminders() {
  // check if reminders are enabled
  const { value } = await Preferences.get({ key: REMINDERS_PREF_KEY });
  const remindersEnabled = value === 'true';

  // always clear existing notifications first
  const { notifications } = await LocalNotifications.getPending();
  if (notifications.length > 0) {
    await LocalNotifications.cancel({
      notifications: notifications.map((n) => ({ id: n.id })),
    });
  }

  if (!remindersEnabled) {
    return; // if not enabled, nothing more to do
  }

  const now = Date.now();
  const days = [2, 7, 30];

  const notificationsToSchedule = [
    // normal reminders
    ...days.map((d, i) => ({
      id: i + 1, // simple unique IDs (1, 2, 3)
      title: 'Practice Reminder',
      body: `It’s been ${d} day${d > 1 ? 's' : ''} since your last practice!`,
      schedule: { at: new Date(now + d * 24 * 60 * 60 * 1000) },
    })),
  ];

  await LocalNotifications.schedule({ notifications: notificationsToSchedule });
}
