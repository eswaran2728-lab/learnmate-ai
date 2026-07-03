import express from "express";
import cors from "cors";
import fs from "node:fs";
import { config, assertProviderConfig } from "./config.js";
import { jobsRouter } from "./routes/jobs.js";

assertProviderConfig();
fs.mkdirSync(config.workDir, { recursive: true });
fs.mkdirSync(config.mediaDir, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    styleProvider: config.styleProvider,
    storageDriver: config.storageDriver,
    limits: {
      maxVideoSeconds: config.maxVideoSeconds,
      processFps: config.processFps,
      maxFrameWidth: config.maxFrameWidth,
    },
  });
});

app.use("/api", jobsRouter);

// Local storage driver serves finished videos directly; with Supabase
// storage the app gets signed URLs instead and this path is unused.
app.use("/media", express.static(config.mediaDir));

app.listen(config.port, () => {
  console.log(`Toonify backend listening on :${config.port}`);
  console.log(`  style provider: ${config.styleProvider}`);
  console.log(`  storage driver: ${config.storageDriver}`);
});
