import type { StylePreset } from "../styles/presets.js";
import type { StyleTransferProvider } from "./styleTransfer.js";
import { filterImage, filterVideo } from "../pipeline/ffmpeg.js";

/**
 * The free style engine: cartoon looks built from FFmpeg filter graphs
 * (edge-preserving smoothing + cel-shading color bands + ink outlines —
 * see styles/presets.ts). Runs entirely on this server at zero per-frame
 * cost, which makes it both the default product experience and the way to
 * exercise the full pipeline without an API key.
 *
 * Because the filters are deterministic, it also implements the whole-video
 * fast path: one FFmpeg pass at the source frame rate — faster than
 * frame-by-frame, keeps full motion smoothness, and cannot flicker.
 */
export class LocalStyleProvider implements StyleTransferProvider {
  readonly name = "local";

  async stylizeFrame(inputPath: string, outputPath: string, preset: StylePreset): Promise<void> {
    await filterImage(inputPath, outputPath, preset.localFilter);
  }

  async stylizeVideo(
    inputPath: string,
    outputPath: string,
    preset: StylePreset,
    durationSeconds: number,
    onProgress?: (fraction: number) => void
  ): Promise<void> {
    await filterVideo(inputPath, outputPath, preset.localFilter, durationSeconds, onProgress);
  }
}
