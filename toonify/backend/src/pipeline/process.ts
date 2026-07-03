import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { extractFrames, assembleVideo, probeVideo } from "./ffmpeg.js";
import type { StyleTransferProvider } from "../providers/styleTransfer.js";
import type { VideoStorage } from "../storage/storage.js";
import type { StylePreset } from "../styles/presets.js";

export interface ProcessResult {
  resultUrl: string;
  /** Frames sent through per-frame stylization; 0 on the whole-video fast path. */
  frameCount: number;
}

/**
 * The core Phase 2 pipeline. Two modes, chosen by the provider's abilities:
 *
 * Fast path (local FFmpeg engine): the provider stylizes the whole video in
 * one pass — source frame rate and audio preserved, no flicker possible.
 *
 * Frame path (AI providers): video -> frames (reduced fps, capped width) ->
 * stylize each frame -> reassemble -> upload.
 *
 * KNOWN QUALITY RISK on the frame path (flagged per project brief): frames
 * are stylized independently, so img2img models can produce flicker between
 * frames (temporal inconsistency). If output quality is poor with a real
 * model, evaluate video-native style-transfer models on Replicate before
 * building Phases 4+. The provider abstraction means that swap only touches
 * providers/, not this pipeline or the app.
 */
export async function processVideo(
  jobId: string,
  inputVideo: string,
  preset: StylePreset,
  provider: StyleTransferProvider,
  storage: VideoStorage,
  onProgress: (fraction: number) => void
): Promise<ProcessResult> {
  const jobDir = path.join(config.workDir, jobId);
  const rawDir = path.join(jobDir, "frames-raw");
  const styledDir = path.join(jobDir, "frames-styled");
  await fs.mkdir(styledDir, { recursive: true });

  try {
    const info = await probeVideo(inputVideo);

    if (provider.stylizeVideo) {
      const outputFile = path.join(jobDir, "result.mp4");
      await provider.stylizeVideo(inputVideo, outputFile, preset, info.durationSeconds, onProgress);
      const resultUrl = await storage.saveResult(outputFile, `results/${jobId}.mp4`);
      return { resultUrl, frameCount: 0 };
    }

    const frames = await extractFrames(inputVideo, rawDir, config.processFps, config.maxFrameWidth);

    // Stylize with bounded concurrency — keeps API request rate (and burst
    // spend) under control.
    let done = 0;
    let cursor = 0;
    const workerCount = Math.min(config.frameConcurrency, frames.length);
    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (true) {
          const index = cursor++;
          if (index >= frames.length) return;
          const frame = frames[index];
          await provider.stylizeFrame(frame, path.join(styledDir, path.basename(frame)), preset);
          done++;
          onProgress(done / frames.length);
        }
      })
    );

    const outputFile = path.join(jobDir, "result.mp4");
    await assembleVideo(styledDir, config.processFps, inputVideo, info.hasAudio, outputFile);

    const resultUrl = await storage.saveResult(outputFile, `results/${jobId}.mp4`);
    return { resultUrl, frameCount: frames.length };
  } finally {
    // Frames can be hundreds of PNGs per job; always clean the workspace.
    await fs.rm(jobDir, { recursive: true, force: true }).catch(() => {});
    await fs.rm(inputVideo, { force: true }).catch(() => {});
  }
}
