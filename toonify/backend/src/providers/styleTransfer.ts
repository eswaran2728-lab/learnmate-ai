import type { StylePreset } from "../styles/presets.js";
import { config } from "../config.js";
import { LocalStyleProvider } from "./localProvider.js";
import { ReplicateStyleProvider } from "./replicateProvider.js";

/**
 * Single abstraction point for the style-transfer backend. Everything else
 * in the pipeline only knows "a frame goes in, a stylized frame comes out",
 * so the provider (local FFmpeg engine, Replicate model, another API) can be
 * swapped via the STYLE_PROVIDER env var without touching the app or the
 * rest of the backend.
 */
export interface StyleTransferProvider {
  readonly name: string;
  /** Stylize one frame. Reads inputPath, writes the result to outputPath (png). */
  stylizeFrame(inputPath: string, outputPath: string, preset: StylePreset): Promise<void>;
  /**
   * Optional fast path: stylize the entire video in one pass, preserving the
   * source frame rate and audio. When present, the pipeline skips frame
   * extraction/reassembly entirely. Providers that can only work per-image
   * (like img2img APIs) simply don't implement it.
   */
  stylizeVideo?(
    inputPath: string,
    outputPath: string,
    preset: StylePreset,
    durationSeconds: number,
    onProgress?: (fraction: number) => void
  ): Promise<void>;
}

export function createStyleProvider(): StyleTransferProvider {
  switch (config.styleProvider) {
    case "replicate":
      return new ReplicateStyleProvider(config.replicateApiToken, config.replicateModel);
    case "local":
      return new LocalStyleProvider();
    default:
      throw new Error(`Unknown STYLE_PROVIDER "${config.styleProvider}"`);
  }
}
