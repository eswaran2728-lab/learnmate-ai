import { nanoid } from "nanoid";

export type JobStatus = "queued" | "processing" | "done" | "failed";

export interface Job {
  id: string;
  status: JobStatus;
  styleId: string;
  /** 0..1, frame-level progress while processing. */
  progress: number;
  inputPath: string;
  resultUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Phase 2: in-memory job store (single process, lost on restart — fine for
 * the feasibility proof). Phase 3 replaces this with Supabase Postgres rows
 * + BullMQ; the schema in toonify/supabase/schema.sql already mirrors this
 * shape so the swap is mechanical.
 */
const jobs = new Map<string, Job>();

export function createJob(inputPath: string, styleId: string): Job {
  const now = new Date().toISOString();
  const job: Job = {
    id: nanoid(12),
    status: "queued",
    styleId,
    progress: 0,
    inputPath,
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, patch: Partial<Job>): Job {
  const job = jobs.get(id);
  if (!job) throw new Error(`Job ${id} not found`);
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  return job;
}

/** Public view of a job — never leaks server file paths. */
export function toPublicJob(job: Job) {
  return {
    id: job.id,
    status: job.status,
    styleId: job.styleId,
    progress: job.progress,
    resultUrl: job.resultUrl ?? null,
    error: job.error ?? null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}
