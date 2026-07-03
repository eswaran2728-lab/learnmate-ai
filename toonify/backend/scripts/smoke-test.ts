/**
 * End-to-end smoke test for the Phase 2 pipeline. Run with the server up:
 *
 *   npm run dev          # terminal 1
 *   npm run smoke        # terminal 2
 *
 * 1. Generates a 4s test video (moving pattern + tone) with FFmpeg
 * 2. POSTs it to /api/jobs with a style preset
 * 3. Polls /api/jobs/:id until done/failed
 * 4. Downloads the result and verifies it's a real video via ffprobe
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { FFMPEG, probeVideo } from "../src/pipeline/ffmpeg.js";

const execFileAsync = promisify(execFile);
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:4000";
const STYLE = process.env.SMOKE_STYLE ?? "anime";

async function main() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "toonify-smoke-"));
  const input = path.join(tmp, "input.mp4");

  console.log("1) Generating 4s test video…");
  await execFileAsync(FFMPEG, [
    "-y",
    "-f", "lavfi", "-i", "testsrc2=duration=4:size=640x360:rate=30",
    "-f", "lavfi", "-i", "sine=frequency=440:duration=4",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest",
    input,
  ]);

  console.log("2) Checking /health…");
  const health = await (await fetch(`${BASE}/health`)).json();
  console.log("   ", JSON.stringify(health));

  console.log(`3) Uploading video (style=${STYLE})…`);
  const form = new FormData();
  const bytes = await fs.readFile(input);
  form.append("video", new Blob([bytes], { type: "video/mp4" }), "input.mp4");
  form.append("styleId", STYLE);
  const createRes = await fetch(`${BASE}/api/jobs`, { method: "POST", body: form });
  const createBody = (await createRes.json()) as { job?: { id: string }; error?: string };
  if (!createRes.ok || !createBody.job) throw new Error(`Job create failed: ${createBody.error}`);
  const jobId = createBody.job.id;
  console.log(`   job ${jobId} queued`);

  console.log("4) Polling job status…");
  const deadline = Date.now() + 5 * 60 * 1000;
  let job: { status: string; progress: number; resultUrl: string | null; error: string | null };
  while (true) {
    if (Date.now() > deadline) throw new Error("Timed out waiting for job");
    const res = await fetch(`${BASE}/api/jobs/${jobId}`);
    job = ((await res.json()) as { job: typeof job }).job;
    process.stdout.write(`   status=${job.status} progress=${(job.progress * 100).toFixed(0)}%   \r`);
    if (job.status === "done" || job.status === "failed") break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log();
  if (job.status === "failed") throw new Error(`Job failed: ${job.error}`);
  if (!job.resultUrl) throw new Error("Job done but no resultUrl");
  console.log(`   result: ${job.resultUrl}`);

  console.log("5) Downloading + verifying result…");
  const out = path.join(tmp, "result.mp4");
  const res = await fetch(job.resultUrl);
  if (!res.ok) throw new Error(`Result download failed (${res.status})`);
  await fs.writeFile(out, Buffer.from(await res.arrayBuffer()));
  const info = await probeVideo(out);
  console.log(
    `   result video: ${info.durationSeconds.toFixed(1)}s ${info.width}x${info.height} audio=${info.hasAudio}`
  );
  if (info.durationSeconds < 3 || info.width === 0) throw new Error("Result video looks broken");

  console.log(`\nSMOKE TEST PASSED ✔  (artifacts in ${tmp})`);
}

main().catch((err) => {
  console.error(`\nSMOKE TEST FAILED ✘  ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
