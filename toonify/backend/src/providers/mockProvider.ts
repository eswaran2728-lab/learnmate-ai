import type { StylePreset } from "../styles/presets.js";
import type { StyleTransferProvider } from "./styleTransfer.js";
import { filterImage } from "../pipeline/ffmpeg.js";

/**
 * Free local stand-in for the AI model: applies a cartoon-ish FFmpeg filter
 * per frame. Exists so the entire upload -> frames -> stylize -> reassemble
 * pipeline can be exercised end-to-end without an API key or per-frame cost.
 */
export class MockStyleProvider implements StyleTransferProvider {
  readonly name = "mock";

  async stylizeFrame(inputPath: string, outputPath: string, preset: StylePreset): Promise<void> {
    await filterImage(inputPath, outputPath, preset.mockFilter);
  }
}
