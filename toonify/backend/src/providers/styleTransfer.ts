import type { StylePreset } from "../styles/presets.js";
import { config } from "../config.js";
import { MockStyleProvider } from "./mockProvider.js";
import { ReplicateStyleProvider } from "./replicateProvider.js";

/**
 * Single abstraction point for the AI style-transfer backend. Everything else
 * in the pipeline only knows "a frame file goes in, a stylized frame file
 * comes out", so the provider (Replicate model, another API, a local model)
 * can be swapped via the STYLE_PROVIDER env var without touching the app or
 * the rest of the backend.
 */
export interface StyleTransferProvider {
  readonly name: string;
  /** Stylize one frame. Reads inputPath, writes the result to outputPath (png). */
  stylizeFrame(inputPath: string, outputPath: string, preset: StylePreset): Promise<void>;
}

export function createStyleProvider(): StyleTransferProvider {
  switch (config.styleProvider) {
    case "replicate":
      return new ReplicateStyleProvider(config.replicateApiToken, config.replicateModel);
    case "mock":
      return new MockStyleProvider();
    default:
      throw new Error(`Unknown STYLE_PROVIDER "${config.styleProvider}"`);
  }
}
