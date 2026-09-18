import { startFaceRenderLoop } from "./renderLoop";
import { useEffect, useRef } from "react";

import { readyFlashEnvelope, type FaceCanvasProps } from "./FaceCanvas";
import { KittDirector } from "./kittDirector";
import { KittRenderer } from "./kittRenderer";

/**
 * The complete live KITT surface: an interior voice modulator instead of a face.
 * Consumes the same three truthful inputs as NightBlood and Marshmallow —
 * resolved canonical state, authorised output amplitude and the
 * reduced-motion flag. `liveWatched` is accepted for prop-shape parity with
 * the other two skins but unused: a dashboard-mounted bar has nothing to
 * look toward.
 */
export function KittCanvas({
  resolved,
  authorisedAmplitude,
  liveAmplitude,
  readyFlashStartedAtMs = null,
  reducedMotion = false,
  className,
}: FaceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputs = useRef({
    state: resolved.state,
    amplitude: authorisedAmplitude,
    liveAmplitude,
    readyFlashStartedAtMs,
    reducedMotion,
  });

  inputs.current = {
    state: resolved.state,
    amplitude: authorisedAmplitude,
    liveAmplitude,
    readyFlashStartedAtMs,
    reducedMotion,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const director = new KittDirector();
    let renderer: KittRenderer;
    try {
      renderer = new KittRenderer(canvas);
    } catch (error) {
      console.error("[kitt] 2D canvas unavailable:", error);
      return;
    }

    const startedAt = performance.now();
    const stopRendering = startFaceRenderLoop(canvas, () => ({
      state: inputs.current.state,
      level: inputs.current.liveAmplitude?.() ?? inputs.current.amplitude,
      ready: inputs.current.readyFlashStartedAtMs != null
        && performance.now() - inputs.current.readyFlashStartedAtMs < 2_700,
    }), (nowMs, width, height) => {
      const now = (nowMs - startedAt) / 1_000;
      const current = inputs.current;
      const level = current.liveAmplitude ? current.liveAmplitude() : current.amplitude;
      director.setReducedMotion(current.reducedMotion);
      director.setState(current.state, now);
      const uniforms = director.frame(now, level);
      const ready = current.readyFlashStartedAtMs == null
        ? 0
        : readyFlashEnvelope(performance.now() - current.readyFlashStartedAtMs);
      renderer.render(uniforms, width, height, ready);
    });
    return () => {
      stopRendering();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block", background: "#000" }}
      aria-label={`KITT voice bar: ${resolved.state}`}
      role="img"
    />
  );
}
