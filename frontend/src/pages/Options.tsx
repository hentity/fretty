import { useState, useEffect, useMemo } from "react";
import { TextBox } from "../components/TextBox";
import { useAuth } from "../context/UserContext";
import useProgress from "../hooks/useProgress";
import { createDefaultProgress } from "../logic/progressUtils";
import { useLesson } from "../context/LessonContext";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { LocalNotifications } from "@capacitor/local-notifications";
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';

const NOTES = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
const DEFAULT_TUNING = ["E", "A", "D", "G", "B", "E"];

const REMINDERS_PREF_KEY = "practiceRemindersEnabled";

function getNoteName(note: string): string {
  const match = note.match(/^[A-G]#?/);
  return match ? match[0] : note;
}

function getNextNote(current: string, direction: 1 | -1) {
  const baseNote = getNoteName(current);
  const index = NOTES.indexOf(baseNote);
  const nextIndex = (index + direction + NOTES.length) % NOTES.length;
  return NOTES[nextIndex];
}

export default function Options() {
  const { user } = useAuth();
  const { progress, saveProgress } = useProgress(user);
  const { setLessonStatus } = useLesson();

  const [tuning, setTuning] = useState(DEFAULT_TUNING);
  const [initialTuning, setInitialTuning] = useState(DEFAULT_TUNING);
  const [confirming, setConfirming] = useState(false);

  const [remindersEnabled, setRemindersEnabled] = useState(false);

  useEffect(() => {
    if (progress?.tuning) {
      const stripped = progress.tuning.map(getNoteName);
      setTuning(stripped);
      setInitialTuning(stripped);
    }
  }, [progress?.tuning]);

  useEffect(() => {
    const loadRemindersPref = async () => {
      const isWeb = Capacitor.getPlatform() === "web";
      if (isWeb) return;

      const { value } = await Preferences.get({ key: REMINDERS_PREF_KEY });
      const flag = value === "true";

      setRemindersEnabled(flag); // <- just reflect the stored preference
    };

    loadRemindersPref();
  }, []);

  const toggleReminders = async () => {
    const isWeb = Capacitor.getPlatform() === "web";
    if (isWeb) return;

    // Always read current value from Preferences (source of truth)
    const { value } = await Preferences.get({ key: REMINDERS_PREF_KEY });
    const remindersEnabledPref = value === "true";

    if (!remindersEnabledPref) {
      // Enable: ask for permission first
      const { display } = await LocalNotifications.requestPermissions();
      if (display === "granted") {
        await Preferences.set({ key: REMINDERS_PREF_KEY, value: "true" });
        setRemindersEnabled(true);
      } else if (display === "denied") {
        const confirm = window.confirm(
          "Notifications are disabled in settings. Would you like to enable them?"
        );
        if (confirm) {
          const platform = Capacitor.getPlatform();
          if (platform === 'android') {
            await NativeSettings.openAndroid({
              option: AndroidSettings.ApplicationDetails,
            });
          } else if (platform === 'ios') {
            await NativeSettings.openIOS({
              option: IOSSettings.App,
            });
          }
        }
      }
    } else {
      // Disable → store flag only
      await Preferences.set({ key: REMINDERS_PREF_KEY, value: "false" });
      setRemindersEnabled(false);
    }
  };

  const hasChanged = useMemo(() => {
    return tuning.some((note, i) => note !== initialTuning[i]);
  }, [tuning, initialTuning]);

  if (!progress) return null;

  const handleChange = (index: number, direction: 1 | -1) => {
    const newTuning = [...tuning];
    newTuning[index] = getNextNote(newTuning[index], direction);
    setTuning(newTuning);
    setConfirming(false); // reset confirmation if tuning changes again
  };

  const handleConfirmUpdate = () => {
    const updatedTuning = tuning.map((note) => `${note}3`);
    const resetProgress = createDefaultProgress(updatedTuning);
    setLessonStatus("before");
    saveProgress(resetProgress);
    setInitialTuning(tuning);
    setConfirming(false);
    window.location.href = "/";
  };

  const handleUpdateClick = () => {
    if (hasChanged) setConfirming(true);
  };

  const tuningControls = [0, 1, 2].flatMap((row) => {
    return tuning
      .map((note, i) => {
        if (row === 0) {
          return {
            text: `  +  `,
            className:
              "text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg cursor-pointer brightness-80",
            onClick: () => handleChange(i, 1),
          };
        }
        if (row === 1) {
          return {
            text: `${note}`,
            className: "text-fg",
            manualWidth: 5,
          };
        }
        return {
          text: `  -  `,
          className:
            "text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg cursor-pointer brightness-80",
          onClick: () => handleChange(i, -1),
        };
      })
      .concat({ text: "\n", className: "", manualWidth: 0 });
  });

  const isWeb = Capacitor.getPlatform() === "web";

  const content = (() => {
    const items = [
      { text: "thick                 thin\n", className: "text-fg" },
      ...tuningControls,
      confirming
        ? {
            text: "this will reset all progress".toUpperCase(),
            className: "text-hard",
          }
        : {
            text: "\n[ update tuning ]\n",
            className: hasChanged
              ? "text-fg font-bold hover:bg-fg hover:text-bg active:bg-fg active:text-bg cursor-pointer"
              : "text-fg font-bold brightness-60",
            onClick: hasChanged ? handleUpdateClick : undefined,
          },
      ...(confirming
        ? [
            { text: "\n", className: "" },
            {
              text: "[ ok ]",
              className:
                "text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg cursor-pointer font-bold transition",
              onClick: handleConfirmUpdate,
            },
            {
              text: "[ cancel ]",
              className:
                "text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg cursor-pointer transition font-bold",
              onClick: () => setConfirming(false),
            },
          ]
        : []),
    ...(!isWeb
      ? [
          { text: "\n\n", className: "" },
          { text: "practice reminders   ", className: "text-fg" },
          {
            text: remindersEnabled ? "   " : "  ",
            className: remindersEnabled ? "bg-good" : "bg-fg",
            onClick: toggleReminders,
          },
          {
            text: remindersEnabled ? "  " : "   ",
            className: remindersEnabled ? "bg-fg" : "bg-fail",
            onClick: toggleReminders,
          },
        ]
      : [])
    ];
    return items;
  })();

  return (
    <div className="flex flex-col flex-grow items-center justify-center overflow-hidden">
      <TextBox width={80} height={10} content={content} />
    </div>
  );
}
