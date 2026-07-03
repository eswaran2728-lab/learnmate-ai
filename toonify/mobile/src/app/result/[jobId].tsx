import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { fetchJob } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

export default function ResultScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "share" | null>(null);
  // Result is downloaded once and reused for both save and share.
  const localFile = useRef<File | null>(null);

  useEffect(() => {
    fetchJob(jobId)
      .then((job) => {
        if (job.status !== "done" || !job.resultUrl) throw new Error("Job is not finished yet");
        setResultUrl(job.resultUrl);
      })
      .catch((err: Error) => setError(err.message));
  }, [jobId]);

  const player = useVideoPlayer(resultUrl, (p) => {
    p.loop = true;
    p.play();
  });

  async function download(): Promise<File> {
    if (localFile.current) return localFile.current;
    const dest = new File(Paths.cache, `toonify-${jobId}.mp4`);
    if (dest.exists) dest.delete();
    const file = await File.downloadFileAsync(resultUrl!, dest);
    localFile.current = file;
    return file;
  }

  async function saveToLibrary() {
    setBusy("save");
    try {
      // Lazy import: the class-based media-library API only exists on native,
      // and a top-level import breaks web/static rendering.
      const MediaLibrary = await import("expo-media-library");
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (!perm.granted) throw new Error("Photos permission denied");
      const file = await download();
      await MediaLibrary.Asset.create(file.uri);
      Alert.alert("Saved!", "Your toon is in your camera roll.");
    } catch (err) {
      Alert.alert("Save failed", err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    setBusy("share");
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available here");
      const file = await download();
      await Sharing.shareAsync(file.uri, { mimeType: "video/mp4" });
    } catch (err) {
      Alert.alert("Share failed", err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.error}>{error}</Text>
      </View>
    );
  }

  if (!resultUrl) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <VideoView player={player} style={s.video} contentFit="contain" nativeControls />

      <View style={s.actions}>
        <Pressable style={s.action} onPress={saveToLibrary} disabled={busy !== null}>
          {busy === "save" ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={s.actionText}>💾 Save</Text>
          )}
        </Pressable>
        <Pressable style={s.action} onPress={share} disabled={busy !== null}>
          {busy === "share" ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={s.actionText}>📤 Share</Text>
          )}
        </Pressable>
      </View>

      <Pressable style={s.again} onPress={() => router.replace("/upload")}>
        <Text style={s.againText}>Make another ✨</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  video: { flex: 1, borderRadius: radius.card, backgroundColor: "#000" },
  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  action: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.button,
    paddingVertical: 16,
    alignItems: "center",
  },
  actionText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  again: {
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  againText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  error: { color: colors.danger, textAlign: "center", fontSize: 16 },
});
