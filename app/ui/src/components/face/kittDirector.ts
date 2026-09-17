/**
 * KITT's behaviour model.
 *
 * Pure logic: canonical state and authorised output amplitude in, renderer
 * segment levels out. No camera input — a dashboard-mounted bar has nothing
 * to look toward, unlike the other two skins.
 */

import { KITT_STATE_PARAMS, type KittColour } from "./kittStateParams";
import type { VisualState } from "./types";

export const KITT_SEGMENT_COUNT = 19;

export interface KittUniforms {
  readonly colour: KittColour;
  /** 0..1 brightness per LED segment, left to right. */
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
  private sweepPhase = 0;
  /** Smoothed authorised amplitude; silent outside "speaking" always decays to 0. */
  private speak = 0;
  /** One-shot bloom on entering completed/error. */
  private flash = 0;
  private reducedMotion = false;

  setState(state: VisualState, now: number): void {
    if (state === this.state) return;
    if (state === "completed" || state === "error") this.flash = 1;
    this.state = state;
    void now;
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  frame(now: number, authorisedAmplitude: number): KittUniforms {
    const dt = this.lastTime == null ? 1 / 60 : clamp(now - this.lastTime, 0, 0.1);
    this.lastTime = now;
    const params = KITT_STATE_PARAMS[this.state];

    const rawLevel = this.state === "speaking"
      ? clamp(Number.isFinite(authorisedAmplitude) ? authorisedAmplitude : 0)
      : 0;
    this.speak = ease(this.speak, rawLevel, dt, rawLevel > this.speak ? 0.04 : 0.14);
    this.flash = ease(this.flash, 0, dt, 0.35);

    const hz = this.reducedMotion ? 0 : params.sweepHz + this.speak * params.ampGain * 1.6;
    this.sweepPhase += dt * hz;

    const segments = new Array<number>(KITT_SEGMENT_COUNT).fill(0);
    const centre = (KITT_SEGMENT_COUNT - 1) / 2;

    if (params.mode === "off") {
      // Stays fully unlit.
    } else if (params.mode === "pulse") {
      const pulse = this.reducedMotion
        ? 0.5
        : 0.5 + 0.5 * Math.sin(this.sweepPhase * Math.PI * 2);
      for (let i = 0; i < KITT_SEGMENT_COUNT; i++) segments[i] = params.floor + pulse * 0.7;
    } else if (params.mode === "flash") {
      for (let i = 0; i < KITT_SEGMENT_COUNT; i++) segments[i] = params.floor + this.flash * 0.9;
    } else if (params.mode === "flicker") {
      // Irregular, deliberately not periodic: a stuck-relay read, not a heartbeat.
      const flicker = this.reducedMotion
        ? 0.7
        : 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(now * 11.3 + Math.sin(now * 2.7) * 3));
      for (let i = 0; i < KITT_SEGMENT_COUNT; i++) segments[i] = params.floor * flicker;
    } else {
      // sweep: a comet bouncing end to end (triangle wave over a 2-phase cycle).
      const t = this.reducedMotion ? 0.5 : this.sweepPhase % 2;
      const pos = t <= 1 ? t : 2 - t;
      const cometHalfWidth = Math.max(
        0.6,
        (params.cometWidth * KITT_SEGMENT_COUNT * (1 - this.speak * 0.35)) / 2,
      );
      const cometCentre = pos * (KITT_SEGMENT_COUNT - 1);
      for (let i = 0; i < KITT_SEGMENT_COUNT; i++) {
        const distance = Math.abs(i - cometCentre);
        const comet = Math.max(0, 1 - distance / cometHalfWidth);
        segments[i] = params.floor + comet * (1 - params.floor);
      }

      // Speaking: bloom a centre-out amplitude bar over the comet. This is
      // the classic voice-modulator look — louder speech lights more
      // segments out from the middle, not just a brighter travelling dot.
      if (this.state === "speaking" && this.speak > 0.015) {
        const litHalf = this.speak * centre;
        for (let i = 0; i < KITT_SEGMENT_COUNT; i++) {
          const distance = Math.abs(i - centre);
          if (distance > litHalf) continue;
          const bloom = 0.55 + 0.45 * (1 - distance / Math.max(0.001, litHalf));
          segments[i] = Math.max(segments[i], bloom);
        }
      }
    }

    for (let i = 0; i < KITT_SEGMENT_COUNT; i++) segments[i] = clamp(segments[i]);

    return {
      colour: params.colour,
      segments,
      reducedMotion: this.reducedMotion,
    };
  }
}
