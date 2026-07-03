import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fetchJob, type JobInfo } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

const POLL_MS = 2000;

const STATUS_COPY: Record<JobInfo["status"], string> = {
  queued: "Waiting in line…",
  processing: "Drawing your toon…",
  done: "Done!",
  failed: "Something went wrong",
};

export default function ProcessingScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const next = await fetchJob(jobId);
        if (stopped.current) return;
        setJob(next);
        setError(null);
        if (next.status === "done") {
          router.replace(`/result/${jobId}`);
          return;
        }
        if (next.status === "failed") return; // show error state, stop polling
      } catch (err) {
        if (!stopped.current) setError(err instanceof Error ? err.message : String(err));
      }
      timer = setTimeout(poll, POLL_MS);
    }

    void poll();
    return () => {
      stopped.current = true;
      clearTimeout(timer);
    };
  }, [jobId, router]);

  const failed = job?.status === "failed";
  const progress = job?.progress ?? 0;

  return (
    <View style={s.container}>
      <Text style={s.emoji}>{failed ? "😵" : "🎨"}</Text>
      <Text style={s.status}>{job ? STATUS_COPY[job.status] : "Connecting…"}</Text>

      {!failed && (
        <>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={s.percent}>{Math.round(progress * 100)}%</Text>
          <Text style={s.hint}>
            Each frame is re-drawn by the AI — this takes a minute or two.
          </Text>
        </>
      )}

      {failed && (
        <>
          <Text style={s.error}>{job?.error ?? "Unknown error"}</Text>
          <Pressable style={s.retry} onPress={() => router.replace("/upload")}>
            <Text style={s.retryText}>Try again</Text>
          </Pressable>
        </>
      )}

      {error && !failed && <Text style={s.error}>Connection issue: {error} (retrying…)</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  status: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: 28 },
  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 5 },
  percent: { color: colors.textDim, marginTop: 10, fontSize: 15 },
  hint: { color: colors.textDim, marginTop: 24, textAlign: "center", fontSize: 13, lineHeight: 19 },
  error: { color: colors.danger, marginTop: 16, textAlign: "center" },
  retry: {
    marginTop: 24,
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
