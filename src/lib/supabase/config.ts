// Publishable Supabase credentials (safe to expose — data access is
// enforced by Row Level Security). Env vars take precedence so another
// Supabase project can be used without a code change.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://yrlzwsblfbhlbvycrvrh.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybHp3c2JsZmJobGJ2eWNydnJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzMxNjEsImV4cCI6MjA5Nzc0OTE2MX0.2NuyW-M67pW0fKKMTM53oS5nIlbwknMa2HKPY5hQ0YA';
