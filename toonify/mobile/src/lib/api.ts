import Constants from "expo-constants";

/**
 * Backend base URL. Set EXPO_PUBLIC_API_URL for real devices / production.
 * In development we fall back to the machine running the Expo dev server
 * (works for simulators and LAN devices without any config).
 */
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.10:8081"
  const host = hostUri?.split(":")[0];
  return host ? `http://${host}:4000` : "http://localhost:4000";
}

export const API_URL = resolveApiUrl();

export interface StyleInfo {
  id: string;
  name: string;
  description: string;
}

export interface JobInfo {
  id: string;
  status: "queued" | "processing" | "done" | "failed";
  styleId: string;
  progress: number;
  resultUrl: string | null;
  error: string | null;
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

export async function fetchStyles(): Promise<StyleInfo[]> {
  const res = await fetch(`${API_URL}/api/styles`);
  return (await parseJson<{ styles: StyleInfo[] }>(res)).styles;
}

export async function createJob(videoUri: string, styleId: string): Promise<JobInfo> {
  const form = new FormData();
  // React Native FormData file part: { uri, name, type }
  form.append("video", { uri: videoUri, name: "upload.mp4", type: "video/mp4" } as unknown as Blob);
  form.append("styleId", styleId);
  const res = await fetch(`${API_URL}/api/jobs`, { method: "POST", body: form });
  return (await parseJson<{ job: JobInfo }>(res)).job;
}

export async function fetchJob(id: string): Promise<JobInfo> {
  const res = await fetch(`${API_URL}/api/jobs/${id}`);
  return (await parseJson<{ job: JobInfo }>(res)).job;
}
