import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

/**
 * Binary resolution order: explicit env var -> bundled ffmpeg-static (optional
 * dep; its postinstall download can fail behind restrictive proxies) ->
 * system binary on PATH.
 */
function resolveBinary(
  envVar: string,
  loadStatic: () => string | null | undefined,
  fallback: string
): string {
  const fromEnv = process.env[envVar];
  if (fromEnv) return fromEnv;
  try {
    const p = loadStatic();
    if (p && fsSync.existsSync(p)) return p;
  } catch {
    // optional dependency not installed — fall through to system binary
  }
  return fallback;
}

export const FFMPEG = resolveBinary(
  "FFMPEG_PATH",
  () => require("ffmpeg-static") as string | null,
  "ffmpeg"
);
export const FFPROBE = resolveBinary(
  "FFPROBE_PATH",
  () => (require("ffprobe-static") as { path: string }).path,
  "ffprobe"
);

export interface VideoInfo {
  durationSeconds: number;
  width: number;
  height: number;
  hasAudio: boolean;
}

export async function probeVideo(file: string): Promise<VideoInfo> {
  const { stdout } = await execFileAsync(FFPROBE, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-show_entries", "stream=codec_type,width,height",
    "-of", "json",
    file,
  ]);
  const data = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: Array<{ codec_type?: string; width?: number; height?: number }>;
  };
  const video = data.streams?.find((s) => s.codec_type === "video");
  if (!video) throw new Error("File has no video stream");
  return {
    durationSeconds: Number.parseFloat(data.format?.duration ?? "0"),
    width: video.width ?? 0,
    height: video.height ?? 0,
    hasAudio: data.streams?.some((s) => s.codec_type === "audio") ?? false,
  };
}

/**
 * Extract frames at a reduced fps and capped width (cost control: fewer,
 * smaller frames = fewer/cheaper style-transfer API calls).
 * Returns the sorted list of frame file paths.
 */
export async function extractFrames(
  input: string,
  outDir: string,
  fps: number,
  maxWidth: number
): Promise<string[]> {
  await fs.mkdir(outDir, { recursive: true });
  await execFileAsync(FFMPEG, [
    "-y",
    "-i", input,
    "-vf", `fps=${fps},scale=w=min(iw\\,${maxWidth}):h=-2`,
    path.join(outDir, "frame-%05d.png"),
  ]);
  const files = (await fs.readdir(outDir))
    .filter((f) => f.startsWith("frame-") && f.endsWith(".png"))
    .sort()
    .map((f) => path.join(outDir, f));
  if (files.length === 0) throw new Error("Frame extraction produced no frames");
  return files;
}

/**
 * Reassemble stylized frames into an mp4 at the same fps they were extracted
 * at, muxing the original audio back in when present.
 */
export async function assembleVideo(
  framesDir: string,
  fps: number,
  originalVideo: string,
  hasAudio: boolean,
  output: string
): Promise<void> {
  await fs.mkdir(path.dirname(output), { recursive: true });
  const args = ["-y", "-framerate", String(fps), "-i", path.join(framesDir, "frame-%05d.png")];
  if (hasAudio) {
    args.push("-i", originalVideo, "-map", "0:v:0", "-map", "1:a:0", "-c:a", "aac", "-shortest");
  }
  args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", output);
  await execFileAsync(FFMPEG, args, { maxBuffer: 32 * 1024 * 1024 });
}

/** Run an arbitrary ffmpeg filter on a single image (used by the mock provider). */
export async function filterImage(input: string, output: string, filter: string): Promise<void> {
  await execFileAsync(FFMPEG, ["-y", "-i", input, "-vf", filter, "-frames:v", "1", output]);
}
