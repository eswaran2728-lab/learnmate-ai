import { Router, type Request, type Response } from "express";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { probeVideo } from "../pipeline/ffmpeg.js";
import { createJob, getJob, toPublicJob } from "../jobs/store.js";
import { enqueueJob } from "../jobs/worker.js";
import { STYLE_PRESETS, getPreset } from "../styles/presets.js";

const upload = multer({
  dest: path.join(config.workDir, "uploads"),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024 },
});

export const jobsRouter = Router();

jobsRouter.get("/styles", (_req, res) => {
  res.json({
    styles: STYLE_PRESETS.map(({ id, name, description }) => ({ id, name, description })),
  });
});

/**
 * POST /api/jobs — multipart form: `video` (file) + `styleId` (field).
 * Validates duration server-side (cost guardrail — never trust the client),
 * queues the job, and returns immediately with the job id for polling.
 */
jobsRouter.post("/jobs", upload.single("video"), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "Missing 'video' file field" });
    return;
  }

  const cleanup = () => fs.rm(file.path, { force: true }).catch(() => {});
  try {
    const styleId = String(req.body.styleId ?? "");
    if (!getPreset(styleId)) {
      await cleanup();
      res.status(400).json({
        error: `Unknown styleId "${styleId}". Valid: ${STYLE_PRESETS.map((p) => p.id).join(", ")}`,
      });
      return;
    }

    let info;
    try {
      info = await probeVideo(file.path);
    } catch {
      await cleanup();
      res.status(400).json({ error: "Uploaded file is not a readable video" });
      return;
    }
    if (info.durationSeconds > config.maxVideoSeconds) {
      await cleanup();
      res.status(400).json({
        error: `Video is ${info.durationSeconds.toFixed(1)}s; max allowed is ${config.maxVideoSeconds}s`,
      });
      return;
    }

    const job = createJob(file.path, styleId);
    enqueueJob(job.id);
    res.status(202).json({ job: toPublicJob(job) });
  } catch (err) {
    await cleanup();
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

jobsRouter.get("/jobs/:id", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json({ job: toPublicJob(job) });
});
