import { Notice, type App } from "obsidian";
import {
  executeRegisteredCommand,
  registeredCommandEnabled,
} from "./commands/registered";
import { t } from "./i18n/i18n";
import { RECORD_START } from "./model/command-table";

/** Obsidian's recorder keeps its state to itself: `start` answers only while
 * nothing is recording and `stop` only while something is, so the pair of
 * commands is the whole state it exposes. This module reads it back so one
 * button can start a recording and stop it again, the way Word's does. */

const RECORD_STOP = "audio-recorder:stop";

/** The system's own permission prompt stands between the click and the
 * recording, so a start is not a failure until it has had time to happen. */
const START_GRACE_MS = 5000;

/** Set on the click, not on the recorder's answer: the clock should count the
 * wait too, and a recording begun elsewhere is picked up by `pollRecording`. */
let startedAt: number | null = null;

/** Whether a tick has seen the recorder running since the last start. */
let confirmed = false;

/** Whether the recorder is recording right now. */
export function isRecording(app: App): boolean {
  return registeredCommandEnabled(app, RECORD_STOP);
}

/** `00:42`, the way Word's recorder counts. */
export function recordingClock(): string {
  const seconds =
    startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000);
  return `${clockPart(Math.floor(seconds / 60))}:${clockPart(seconds % 60)}`;
}

function clockPart(value: number): string {
  return String(value).padStart(2, "0");
}

/** Starts a recording, or stops the one running. */
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

/** One tick; true when the toolbar has to redraw. Also how the bar learns
 * about a recording Obsidian's own microphone button started or stopped. */
export function pollRecording(app: App): boolean {
  if (isRecording(app)) {
    confirmed = true;
    startedAt ??= Date.now();
    // The clock moves, so the button's label moves with it.
    return true;
  }
  if (startedAt === null) return false;
  if (!confirmed && Date.now() - startedAt < START_GRACE_MS) return false;
  // The start never took. The recorder reports that on its own ribbon button,
  // which is no help to anyone who runs it from here.
  if (!confirmed)
    new Notice(
      t("Recording did not start. Check that Obsidian may use the microphone."),
    );
  startedAt = null;
  confirmed = false;
  return true;
}
