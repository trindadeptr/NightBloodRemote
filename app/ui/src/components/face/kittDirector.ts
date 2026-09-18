/**
 * KITT's behaviour model.
 *
 * Pure logic: canonical state and authorised output amplitude in, renderer
 * segment levels out. No camera input — a dashboard-mounted bar has nothing
 * to look toward, unlike the other two skins.
 */

import { KITT_STATE_PARAMS, type KittColour } from "./kittStateParams";
import type { VisualState } from "./types";

export const KITT_COLUMN_ROWS = 19;
export const KITT_SEGMENT_COUNT = KITT_COLUMN_ROWS * 3;

export interface KittUniforms {
  readonly colour: KittColour;
  /** Three columns of LED levels, each stored top to bottom. */
  readonly segments: readonly number[];
  readonly reducedMotion: boolean;
}

const clamp = (value: number, lower = 0, upper = 1) =>
  Math.min(upper, Math.max(lower, value));

function ease(current: number, target: number, dt: number, seconds: number): number {
  if (seconds <= 0) return target;
  return current + (target - current) * (1 - Math.exp(-dt / seconds));
}

export class KittDirector {
  private state: VisualState = "idle";
  private lastTime: number | null = null;
  /** Smoothed authorised amplitude; silent outside "speaking" always decays to 0. */
  private speak = 0;
  private reducedMotion = false;

  setState(state: VisualState, now: number): void {
    if (state === this.state) return;
    if (state !== "speaking") this.speak = 0;
    this.state = state;
    void now;
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  frame(now: number, authorisedAmplitude: number): KittUniforms {
    const dt = this.lastTime == null ? 1 / 60 : clamp(now - this.lastTime, 0, 0.1);
    this.lastTime = now;

    const rawLevel = this.state === "speaking"
      ? clamp(Number.isFinite(authorisedAmplitude) ? authorisedAmplitude : 0)
      : 0;
    this.speak = ease(this.speak, rawLevel, dt, rawLevel > this.speak ? 0.04 : 0.14);

    const segments = new Array<number>(KITT_SEGMENT_COUNT).fill(0);

    {
      // Interior voice modulator: three vertical columns expand from the
      // middle with actual speech, never a travelling exterior scanner.
      const centre = (KITT_COLUMN_ROWS - 1) / 2;
      const amplitude = this.reducedMotion ? 0 : Math.sqrt(this.speak);
      for (let column = 0; column < 3; column++) {
        const scale = column === 1 ? 1 : 0.72;
        const extent = amplitude * centre * scale;
        for (let row = 0; row < KITT_COLUMN_ROWS; row++) {
          const distance = Math.abs(row - centre);
          const lit = !this.reducedMotion && this.state === "speaking" && this.speak > 0.008
            ? clamp(extent - distance + 0.85)
            : 0;
          const standby = distance === 0 ? (this.state === "offline" ? 0.06 : 0.14) : 0.018;
          segments[column * KITT_COLUMN_ROWS + row] = Math.max(standby, lit * (0.7 + amplitude * 0.3));
        }
      }
    }

    for (let i = 0; i < KITT_SEGMENT_COUNT; i++) segments[i] = clamp(segments[i]);

    return {
      colour: KITT_STATE_PARAMS.idle.colour,
      segments,
      reducedMotion: this.reducedMotion,
    };
  }
}
