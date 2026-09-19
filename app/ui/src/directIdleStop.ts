export interface DirectIdleActivity {
  readonly sessionEligible: boolean;
  readonly userSpeaking: boolean;
  readonly assistantSpeaking: boolean;
  readonly awaitingAssistant: boolean;
  readonly backingWork: boolean;
}

export interface DirectIdleTimerScheduler {
  setTimeout(callback: () => void, delayMs: number): number;
  clearTimeout(handle: number): void;
}

export type DirectIdleStopEvent =
  | { readonly kind: "idle-stop-started"; readonly detail: { readonly idleSeconds: number } }
  | { readonly kind: "idle-stop-completed"; readonly detail: Record<string, never> }
  | { readonly kind: "idle-stop-failed"; readonly detail: { readonly error: string } };

const IDLE_STOP_DELAY_MS = 30_000;

function eligible(activity: DirectIdleActivity): boolean {
  return activity.sessionEligible
    && !activity.userSpeaking
    && !activity.assistantSpeaking
    && !activity.awaitingAssistant
    && !activity.backingWork;
}

/** Owns the one inactivity deadline for the current WebView media session. */
export class DirectIdleStopTimer {
  private timer: number | null = null;
  private stopping = false;
  private epoch = 0;

  constructor(
    private readonly readActivity: () => DirectIdleActivity,
    private readonly stop: () => Promise<void>,
    private readonly onEvent: (event: DirectIdleStopEvent) => void,
    private readonly scheduler: DirectIdleTimerScheduler = window,
  ) {}

  get stopInFlight(): boolean {
    return this.stopping;
  }

  arm(): void {
    this.clear();
    if (!eligible(this.readActivity())) return;
    const epoch = this.epoch;
    this.timer = this.scheduler.setTimeout(() => {
      // A cleared browser callback may already be queued. It must not stop a
      // newer eligible session or erase that session's current timer.
      if (epoch !== this.epoch) return;
      this.timer = null;
      // Activity can change after the timer was armed without producing a
      // matching media event. Revalidate at the actual mutation boundary.
      if (this.stopping || !eligible(this.readActivity())) return;
      this.stopping = true;
      this.onEvent({
        kind: "idle-stop-started",
        detail: { idleSeconds: IDLE_STOP_DELAY_MS / 1_000 },
      });
      void this.stop()
        .then(() => this.onEvent({ kind: "idle-stop-completed", detail: {} }))
        .catch((error: unknown) => {
          this.stopping = false;
          this.onEvent({
            kind: "idle-stop-failed",
            detail: { error: error instanceof Error ? error.message : String(error) },
          });
        });
    }, IDLE_STOP_DELAY_MS);
  }

  clear(): void {
    this.epoch += 1;
    if (this.timer !== null) this.scheduler.clearTimeout(this.timer);
    this.timer = null;
  }

  reset(): void {
    this.clear();
    this.stopping = false;
  }
}
