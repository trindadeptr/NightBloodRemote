import type { KittUniforms } from "./kittDirector";
import { KITT_COLUMN_ROWS } from "./kittDirector";

/**
 * Draws the interior three-column voice modulator to a 2D canvas. The LED array does
 * not need WebGL, and 2D context loss handling is simpler than GL's.
 */
export class KittRenderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
  }

  render(uniforms: KittUniforms, width: number, height: number, _ready: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    const { segments, colour } = uniforms;
    const count = segments.length;
    const barWidth = width * 0.34;
    const displayHeight = Math.min(height * 0.58, width * 0.68);
    const rowPitch = displayHeight / KITT_COLUMN_ROWS;
    const barHeight = rowPitch * 0.68;
    const left = (width - barWidth) / 2;
    const top = (height - displayHeight) / 2;
    const gap = barWidth * 0.18;
    const segmentWidth = (barWidth - gap * 2) / 3;

    const [r, g, b] = colour;
    const r255 = Math.round(clamp01(r) * 255);
    const g255 = Math.round(clamp01(g) * 255);
    const b255 = Math.round(clamp01(b) * 255);

    for (let i = 0; i < count; i++) {
      const level = clamp01(segments[i]);
      const column = Math.floor(i / KITT_COLUMN_ROWS);
      const row = i % KITT_COLUMN_ROWS;
      // The centre column reaches higher/lower than the two outer stacks.
      if (column !== 1 && (row === 0 || row === KITT_COLUMN_ROWS - 1)) continue;
      const x = left + column * (segmentWidth + gap);
      const y = top + row * rowPitch;
      ctx.shadowBlur = 0;
      // Dim housing behind every cell so the bar reads even fully unlit.
      ctx.fillStyle = "rgba(75,8,3,0.22)";
      ctx.fillRect(x, y, segmentWidth, barHeight);
      if (level <= 0.01) continue;
      const alpha = level;
      ctx.shadowColor = `rgba(${r255},${g255},${b255},${Math.min(1, level)})`;
      ctx.shadowBlur = barHeight * (0.6 + level * 1.4);
      const glass = ctx.createLinearGradient(0, y, 0, y + barHeight);
      glass.addColorStop(0, `rgba(${r255},${g255},${b255},${alpha * 0.45})`);
      glass.addColorStop(0.45, `rgba(${r255},${g255},${b255},${alpha})`);
      glass.addColorStop(1, `rgba(${r255},${g255},${b255},${alpha * 0.4})`);
      ctx.fillStyle = glass;
      ctx.fillRect(x, y, segmentWidth, barHeight);
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
