import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { colors, radius } from "@/lib/theme";

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <View style={s.center}>
        <Text style={s.devTitle}>Dev mode</Text>
        <Text style={s.devText}>
          Supabase isn't configured yet. Set EXPO_PUBLIC_SUPABASE_URL and
          EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env to enable accounts. The rest of the app
          works without it.
        </Text>
      </View>
    );
  }

  async function withBusy(fn: () => Promise<{ error: { message: string } | null }>, label: string) {
    setBusy(true);
    try {
      const { error } = await fn();
      if (error) Alert.alert(`${label} failed`, error.message);
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return (
      <View style={s.center}>
        <Text style={s.emoji}>👤</Text>
        <Text style={s.signedInAs}>Signed in as</Text>
        <Text style={s.email}>{session.user.email}</Text>
        <Pressable
          style={s.secondaryButton}
          onPress={() => withBusy(() => supabase!.auth.signOut(), "Sign out")}
        >
          <Text style={s.secondaryButtonText}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.form}>
      <Text style={s.formTitle}>Sign in or create an account</Text>
      <TextInput
        style={s.input}
        placeholder="Email"
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={s.input}
        placeholder="Password"
        placeholderTextColor={colors.textDim}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable
        style={[s.primaryButton, busy && s.disabled]}
        disabled={busy}
        onPress={() =>
          withBusy(() => supabase!.auth.signInWithPassword({ email, password }), "Sign in")
        }
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryButtonText}>Sign in</Text>}
      </Pressable>
      <Pressable
        style={[s.secondaryButton, busy && s.disabled]}
        disabled={busy}
        onPress={() => withBusy(() => supabase!.auth.signUp({ email, password }), "Sign up")}
      >
        <Text style={s.secondaryButtonText}>Create account</Text>
      </Pressable>
      <Text style={s.note}>Google & Apple sign-in land in a later phase.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  devTitle: { color: colors.text, fontSize: 22, fontWeight: "800", marginBottom: 12 },
  devText: { color: colors.textDim, textAlign: "center", lineHeight: 22 },
  emoji: { fontSize: 48, marginBottom: 12 },
  signedInAs: { color: colors.textDim, fontSize: 14 },
  email: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 32 },
  form: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 40 },
  formTitle: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 24 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.chip,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: { color: colors.textDim, fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  note: { color: colors.textDim, fontSize: 12, textAlign: "center", marginTop: 20 },
});
