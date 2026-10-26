import { Notice, type App } from "obsidian";
import {
  executeRegisteredCommand,
  registeredCommandEnabled,
} from "./commands/registered";
import { t } from "./i18n/i18n";
import { RECORD_START } from "./model/command-table";

/** The recorder keeps its state to itself: `start` answers only while idle and `stop`
 * only while recording, so the command pair is all it exposes. */

const RECORD_STOP = "audio-recorder:stop";

/** The permission prompt stands between the click and the recording. */
const START_GRACE_MS = 5000;

/** Set on the click: the clock counts the wait too. */
let startedAt: number | null = null;

let confirmed = false;

export function isRecording(app: App): boolean {
  return registeredCommandEnabled(app, RECORD_STOP);
}

export function recordingClock(): string {
  const seconds =
    startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000);
  return `${clockPart(Math.floor(seconds / 60))}:${clockPart(seconds % 60)}`;
}

function clockPart(value: number): string {
  return String(value).padStart(2, "0");
}

export function toggleRecording(app: App): void {
  if (isRecording(app)) {
    executeRegisteredCommand(app, RECORD_STOP);
    startedAt = null;
    confirmed = false;
    return;
  }
  startedAt = Date.now();
  confirmed = false;
  executeRegisteredCommand(app, RECORD_START);
}

/** True when the toolbar has to redraw; also how a recording started elsewhere is seen. */
export function pollRecording(app: App): boolean {
  if (isRecording(app)) {
    confirmed = true;
    startedAt ??= Date.now();
    return true;
  }
  if (startedAt === null) return false;
  if (!confirmed && Date.now() - startedAt < START_GRACE_MS) return false;
  // A start that never took is reported on the recorder own button, which helps nobody here.
  if (!confirmed)
    new Notice(
      t("Recording did not start. Check that Obsidian may use the microphone."),
    );
  startedAt = null;
  confirmed = false;
  return true;
}
