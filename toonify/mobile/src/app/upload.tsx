import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { createJob, fetchStyles, type StyleInfo } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

// Mirrors the server-side MAX_VIDEO_SECONDS guardrail (the server re-checks).
const MAX_SECONDS = 30;

export default function UploadScreen() {
  const router = useRouter();
  const [styles_, setStyles] = useState<StyleInfo[]>([]);
  const [stylesError, setStylesError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchStyles()
      .then((list) => {
        setStyles(list);
        setSelectedStyle((cur) => cur ?? list[0]?.id ?? null);
      })
      .catch((err: Error) =>
        setStylesError(`Could not reach the Toonify server: ${err.message}`)
      );
  }, []);

  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["videos"],
    videoMaxDuration: MAX_SECONDS,
    allowsEditing: true, // lets the user trim to the cap on iOS
    quality: 1,
  };

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    if (!result.canceled) handlePicked(result.assets[0]);
  }

  async function recordVideo() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync(pickerOptions);
    if (!result.canceled) handlePicked(result.assets[0]);
  }

  function handlePicked(asset: ImagePicker.ImagePickerAsset) {
    const seconds = (asset.duration ?? 0) / 1000;
    if (seconds > MAX_SECONDS + 1) {
      Alert.alert("Too long", `Videos can be at most ${MAX_SECONDS} seconds. Please trim it first.`);
      return;
    }
    setVideo(asset);
  }

  async function submit() {
    if (!video || !selectedStyle) return;
    setUploading(true);
    try {
      const job = await createJob(video.uri, selectedStyle);
      router.replace(`/processing/${job.id}`);
    } catch (err) {
      Alert.alert("Upload failed", err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.sectionTitle}>1. Pick a video (max {MAX_SECONDS}s)</Text>
      <View style={s.row}>
        <Pressable style={s.pickButton} onPress={pickFromLibrary}>
          <Text style={s.pickButtonText}>📁 Library</Text>
        </Pressable>
        <Pressable style={s.pickButton} onPress={recordVideo}>
          <Text style={s.pickButtonText}>🎥 Record</Text>
        </Pressable>
      </View>
      {video && (
        <Text style={s.videoInfo}>
          Selected: {((video.duration ?? 0) / 1000).toFixed(1)}s clip ✓
        </Text>
      )}

      <Text style={s.sectionTitle}>2. Pick a style</Text>
      {stylesError && <Text style={s.error}>{stylesError}</Text>}
      <View style={s.styleGrid}>
        {styles_.map((style) => {
          const active = style.id === selectedStyle;
          return (
            <Pressable
              key={style.id}
              style={[s.styleChip, active && s.styleChipActive]}
              onPress={() => setSelectedStyle(style.id)}
            >
              <Text style={[s.styleName, active && s.styleNameActive]}>{style.name}</Text>
              <Text style={s.styleDescription}>{style.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[s.submit, (!video || !selectedStyle || uploading) && s.submitDisabled]}
        disabled={!video || !selectedStyle || uploading}
        onPress={submit}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.submitText}>Toonify it ✨</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
  },
  row: { flexDirection: "row", gap: 12 },
  pickButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: 20,
    alignItems: "center",
  },
  pickButtonText: { color: colors.text, fontSize: 16, fontWeight: "600" },
  videoInfo: { color: colors.success, marginTop: 10, fontSize: 14 },
  error: { color: colors.danger, marginBottom: 8 },
  styleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  styleChip: {
    width: "48%",
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.chip,
    padding: 14,
  },
  styleChipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  styleName: { color: colors.text, fontSize: 15, fontWeight: "700", marginBottom: 4 },
  styleNameActive: { color: colors.accent },
  styleDescription: { color: colors.textDim, fontSize: 12, lineHeight: 16 },
  submit: {
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 32,
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
