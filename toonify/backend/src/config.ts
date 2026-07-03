import "dotenv/config";
import path from "node:path";

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) throw new Error(`Env var ${name} must be an integer, got "${raw}"`);
  return n;
}

export const config = {
  port: int("PORT", 4000),

  // Where uploads and intermediate frames live while a job is running.
  workDir: process.env.WORK_DIR ?? path.resolve("data/work"),
  // Where finished videos live when using the local storage driver.
  mediaDir: process.env.MEDIA_DIR ?? path.resolve("data/media"),

  // "local" is the free FFmpeg-based cartoon engine (the default product
  // experience); "replicate" calls a hosted AI model and costs money per
  // frame. Never default to the paid one. "mock" is a legacy alias for local.
  styleProvider: ((process.env.STYLE_PROVIDER ?? "local") === "mock"
    ? "local"
    : (process.env.STYLE_PROVIDER ?? "local")) as "local" | "replicate",
  replicateApiToken: process.env.REPLICATE_API_TOKEN ?? "",
  // Full model ref, e.g. "owner/model" or "owner/model:versionhash".
  replicateModel: process.env.REPLICATE_MODEL ?? "",

  storageDriver: (process.env.STORAGE_DRIVER ?? "local") as "local" | "supabase",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "toonify-videos",

  // Cost guardrails. Every frame is a paid API call on Replicate, so we cap
  // duration, downsample the frame rate, and downscale resolution by default.
  maxVideoSeconds: int("MAX_VIDEO_SECONDS", 30),
  maxUploadMb: int("MAX_UPLOAD_MB", 100),
  processFps: int("PROCESS_FPS", 12),
  maxFrameWidth: int("MAX_FRAME_WIDTH", 720),
  frameConcurrency: int("FRAME_CONCURRENCY", 2),

  // Public base URL of this server, used to build absolute media URLs.
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? `http://localhost:${int("PORT", 4000)}`,
};

export function assertProviderConfig(): void {
  if (config.styleProvider === "replicate") {
    if (!config.replicateApiToken) throw new Error("STYLE_PROVIDER=replicate requires REPLICATE_API_TOKEN");
    if (!config.replicateModel) throw new Error("STYLE_PROVIDER=replicate requires REPLICATE_MODEL");
  }
  if (config.storageDriver === "supabase") {
    if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
      throw new Error("STORAGE_DRIVER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }
  }
}
