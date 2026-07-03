import { getJob, updateJob } from "./store.js";
import { processVideo } from "../pipeline/process.js";
import { createStyleProvider } from "../providers/styleTransfer.js";
import { createStorage } from "../storage/storage.js";
import { getPreset } from "../styles/presets.js";

/**
 * Phase 2: minimal in-process FIFO queue so video processing never blocks an
 * API request. One job at a time keeps FFmpeg/CPU and API spend predictable.
 * Phase 3 swaps this for BullMQ + Redis without changing the enqueue call
 * site or the pipeline.
 */
const queue: string[] = [];
let running = false;

const provider = createStyleProvider();
const storage = createStorage();

export function enqueueJob(jobId: string): void {
  queue.push(jobId);
  void drain();
}

async function drain(): Promise<void> {
  if (running) return;
  running = true;
  try {
    let jobId: string | undefined;
    while ((jobId = queue.shift()) !== undefined) {
      await runJob(jobId);
    }
  } finally {
    running = false;
  }
}

async function runJob(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) return;
  updateJob(jobId, { status: "processing", progress: 0 });
  console.log(`[job ${jobId}] processing (style=${job.styleId}, provider=${provider.name})`);
  try {
    const preset = getPreset(job.styleId);
    if (!preset) throw new Error(`Unknown style preset "${job.styleId}"`);

    const { resultUrl, frameCount } = await processVideo(
      jobId,
      job.inputPath,
      preset,
      provider,
      storage,
      (fraction) => updateJob(jobId, { progress: fraction })
    );

    updateJob(jobId, { status: "done", progress: 1, resultUrl });
    const mode = frameCount > 0 ? `${frameCount} frames` : "whole-video pass";
    console.log(`[job ${jobId}] done (${mode}) -> ${resultUrl}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    updateJob(jobId, { status: "failed", error: message });
    console.error(`[job ${jobId}] failed: ${message}`);
  }
}
