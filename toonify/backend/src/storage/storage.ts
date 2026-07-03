import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

/**
 * Where finished videos end up. Local disk for development; Supabase Storage
 * (or any S3-alike behind a new driver) in production. Selected via
 * STORAGE_DRIVER env var.
 */
export interface VideoStorage {
  /** Store the file and return a URL the mobile app can stream/download. */
  saveResult(localFile: string, key: string): Promise<string>;
}

class LocalStorage implements VideoStorage {
  async saveResult(localFile: string, key: string): Promise<string> {
    const dest = path.join(config.mediaDir, key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(localFile, dest);
    return `${config.publicBaseUrl}/media/${key}`;
  }
}

class SupabaseStorage implements VideoStorage {
  private client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);

  async saveResult(localFile: string, key: string): Promise<string> {
    const data = await fs.readFile(localFile);
    const { error } = await this.client.storage
      .from(config.supabaseBucket)
      .upload(key, data, { contentType: "video/mp4", upsert: true });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    // Bucket is private; hand the app a signed URL (7 days).
    const { data: signed, error: signError } = await this.client.storage
      .from(config.supabaseBucket)
      .createSignedUrl(key, 60 * 60 * 24 * 7);
    if (signError || !signed) throw new Error(`Supabase sign failed: ${signError?.message}`);
    return signed.signedUrl;
  }
}

export function createStorage(): VideoStorage {
  return config.storageDriver === "supabase" ? new SupabaseStorage() : new LocalStorage();
}
