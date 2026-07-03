import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/lib/theme";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🎬✨</Text>
      <Text style={styles.title}>Toonify</Text>
      <Text style={styles.subtitle}>
        Turn any short video into a cartoon. Pick a clip, pick a style, and watch it transform.
      </Text>

      <Link href="/upload" asChild>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Create a Toon</Text>
        </Pressable>
      </Link>

      <Link href="/profile" asChild>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Account</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 40, fontWeight: "800", color: colors.text, marginBottom: 12 },
  subtitle: {
    fontSize: 16,
    color: colors.textDim,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 14,
  },
  primaryButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  secondaryButton: {
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.button,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  secondaryButtonText: { color: colors.textDim, fontSize: 16, fontWeight: "600" },
});
