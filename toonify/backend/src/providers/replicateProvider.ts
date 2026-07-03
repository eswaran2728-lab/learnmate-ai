import fs from "node:fs/promises";
import Replicate from "replicate";
import type { StylePreset } from "../styles/presets.js";
import type { StyleTransferProvider } from "./styleTransfer.js";

const FRAME_RETRIES = 2;

/**
 * Runs each frame through an img2img model hosted on Replicate.
 *
 * The model is configurable via REPLICATE_MODEL so it can be swapped without
 * code changes. The default input shape ({ image, prompt }) matches most
 * img2img/style-transfer models; per-preset extraInput covers model-specific
 * knobs (strength, guidance, etc.).
 */
export class ReplicateStyleProvider implements StyleTransferProvider {
  readonly name = "replicate";
  private client: Replicate;

  constructor(apiToken: string, private model: string) {
    this.client = new Replicate({ auth: apiToken });
  }

  async stylizeFrame(inputPath: string, outputPath: string, preset: StylePreset): Promise<void> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= FRAME_RETRIES; attempt++) {
      try {
        const result = await this.runOnce(inputPath, preset);
        await fs.writeFile(outputPath, result);
        return;
      } catch (err) {
        lastError = err;
        if (attempt < FRAME_RETRIES) {
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        }
      }
    }
    throw new Error(`Replicate failed for frame ${inputPath}: ${String(lastError)}`);
  }

  private async runOnce(inputPath: string, preset: StylePreset): Promise<Buffer> {
    const image = await fs.readFile(inputPath);
    const dataUri = `data:image/png;base64,${image.toString("base64")}`;

    const output = await this.client.run(this.model as `${string}/${string}`, {
      input: {
        image: dataUri,
        prompt: preset.prompt,
        ...preset.extraInput,
      },
    });

    return this.outputToBuffer(output);
  }

  /**
   * Replicate models return a URL string, an array of URLs, or (SDK v1) a
   * FileOutput object — normalize all of them to the image bytes.
   */
  private async outputToBuffer(output: unknown): Promise<Buffer> {
    const first = Array.isArray(output) ? output[0] : output;
    if (!first) throw new Error("Replicate returned empty output");

    // SDK v1 FileOutput exposes blob(); URL strings and url() objects get fetched.
    if (typeof first === "object" && "blob" in (first as object)) {
      const blob = await (first as { blob(): Promise<Blob> }).blob();
      return Buffer.from(await blob.arrayBuffer());
    }
    const url =
      typeof first === "string"
        ? first
        : typeof first === "object" && "url" in (first as object)
          ? String((first as { url(): URL }).url())
          : null;
    if (!url) throw new Error(`Unrecognized Replicate output shape: ${typeof first}`);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download Replicate output (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
}
