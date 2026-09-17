/**
 * KITT's platform-neutral visual contract: a scanning red light bar, not an
 * organic face. Same canonical 15 states as NightBlood and Marshmallow;
 * only the expression vocabulary differs. Values are intentionally portable
 * to Swift/Metal or SwiftUI Canvas, matching the other two skins.
 */

import type { VisualState } from "./types";

export type KittColour = readonly [number, number, number];

/**
 * off: unlit. sweep: a travelling comet, speed set by sweepHz (0 = static).
 * pulse: every segment breathes together. flash: one-shot bloom on entry.
 * flicker: irregular low read, never a clean periodic blink.
 */
export type KittMode = "off" | "sweep" | "pulse" | "flash" | "flicker";

export const KITT_COLOURS = {
  red: [1.0, 0.09, 0.03],
  amber: [1.0, 0.5, 0.03],
  ready: [0.1, 1.0, 0.25],
} as const satisfies Record<string, KittColour>;

export interface KittStateParams {
  readonly mode: KittMode;
  readonly colour: KittColour;
  /** Sweep cycles per second across the full bar, before amplitude drive. */
  readonly sweepHz: number;
  /** Width of the lit comet as a fraction of the bar, 0..1. */
  readonly cometWidth: number;
  /** Baseline brightness (0..1) held even without amplitude or motion. */
  readonly floor: number;
  /** How strongly authorised speech amplitude drives the comet/bloom. */
  readonly ampGain: number;
}

const RED = KITT_COLOURS.red;
const AMBER = KITT_COLOURS.amber;
const READY = KITT_COLOURS.ready;

/** Every canonical state is explicit; adding a new VisualState must fail here. */
export const KITT_STATE_PARAMS: Record<VisualState, KittStateParams> = {
  offline: {
    mode: "off", colour: RED, sweepHz: 0, cometWidth: 0.22, floor: 0, ampGain: 0,
  },
  starting: {
    mode: "sweep", colour: AMBER, sweepHz: 0.6, cometWidth: 0.24, floor: 0.10, ampGain: 0,
  },
  idle: {
    mode: "sweep", colour: RED, sweepHz: 0.55, cometWidth: 0.26, floor: 0.14, ampGain: 0,
  },
  listening: {
    mode: "sweep", colour: RED, sweepHz: 0.85, cometWidth: 0.22, floor: 0.20, ampGain: 0.15,
  },
  transcribing: {
    mode: "sweep", colour: RED, sweepHz: 1.35, cometWidth: 0.18, floor: 0.22, ampGain: 0.10,
  },
  routing: {
    mode: "sweep", colour: RED, sweepHz: 1.70, cometWidth: 0.16, floor: 0.24, ampGain: 0.10,
  },
  voice_working: {
    mode: "sweep", colour: RED, sweepHz: 2.10, cometWidth: 0.15, floor: 0.26, ampGain: 0.20,
  },
  thinking: {
    mode: "sweep", colour: RED, sweepHz: 1.90, cometWidth: 0.16, floor: 0.24, ampGain: 0.10,
  },
  working: {
    mode: "sweep", colour: RED, sweepHz: 1.50, cometWidth: 0.18, floor: 0.22, ampGain: 0.10,
  },
  speaking: {
    // The comet keeps sweeping; the director blooms a centre-out amplitude
    // bar over it, which is the part that actually reads as "talking".
    mode: "sweep", colour: RED, sweepHz: 0.9, cometWidth: 0.22, floor: 0.16, ampGain: 1,
  },
  waiting_approval: {
    mode: "pulse", colour: AMBER, sweepHz: 0.9, cometWidth: 1, floor: 0.10, ampGain: 0,
  },
  completed: {
    mode: "flash", colour: READY, sweepHz: 0, cometWidth: 1, floor: 0.16, ampGain: 0,
  },
  error: {
    mode: "flash", colour: RED, sweepHz: 0, cometWidth: 1, floor: 0.12, ampGain: 0,
  },
  event_gap: {
    mode: "flicker", colour: AMBER, sweepHz: 0.4, cometWidth: 0.3, floor: 0.06, ampGain: 0,
  },
  degraded: {
    mode: "flicker", colour: AMBER, sweepHz: 0.25, cometWidth: 0.26, floor: 0.05, ampGain: 0,
  },
};
