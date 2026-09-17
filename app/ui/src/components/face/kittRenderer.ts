import type { KittUniforms } from "./kittDirector";

/**
 * Draws the scanning light bar to a plain 2D canvas. A flat LED array does
 * not need WebGL, and 2D context loss handling is simpler than GL's.
 */
export class KittRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
  }

  render(uniforms: KittUniforms, width: number, height: number, ready: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    const { segments, colour } = uniforms;
    const count = segments.length;
    const barWidth = width * 0.86;
    const barHeight = Math.min(height * 0.16, width * 0.10);
    const left = (width - barWidth) / 2;
    const top = (height - barHeight) / 2;
    const gap = barWidth * 0.012;
    const segmentWidth = (barWidth - gap * (count - 1)) / count;

    // The ready flash briefly overrides the state colour with green,
    // exactly like the other two skins' arrival cue.
    const readyColour: readonly [number, number, number] = [0.1, 1.0, 0.25];
    const r = colour[0] + (readyColour[0] - colour[0]) * ready;
    const g = colour[1] + (readyColour[1] - colour[1]) * ready;
    const b = colour[2] + (readyColour[2] - colour[2]) * ready;
    const r255 = Math.round(clamp01(r) * 255);
    const g255 = Math.round(clamp01(g) * 255);
    const b255 = Math.round(clamp01(b) * 255);

    for (let i = 0; i < count; i++) {
      const level = clamp01(segments[i]);
      const x = left + i * (segmentWidth + gap);
      // Dim housing behind every cell so the bar reads even fully unlit.
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      ctx.fillRect(x, top, segmentWidth, barHeight);
      if (level <= 0.01) continue;
      const alpha = 0.18 + level * 0.82;
      ctx.shadowColor = `rgba(${r255},${g255},${b255},${Math.min(1, level)})`;
      ctx.shadowBlur = 6 + level * 14;
      ctx.fillStyle = `rgba(${r255},${g255},${b255},${alpha})`;
      ctx.fillRect(x, top, segmentWidth, barHeight);
    }
    ctx.shadowBlur = 0;
  }

  dispose(): void {
    // No GL resources to release; kept for interface parity with the other renderers.
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
