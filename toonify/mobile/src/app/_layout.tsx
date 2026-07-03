import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Toonify" }} />
        <Stack.Screen name="upload" options={{ title: "New Toon" }} />
        <Stack.Screen
          name="processing/[jobId]"
          options={{ title: "Working…", headerBackVisible: false, gestureEnabled: false }}
        />
        <Stack.Screen name="result/[jobId]" options={{ title: "Your Toon" }} />
        <Stack.Screen name="profile" options={{ title: "Account" }} />
      </Stack>
    </>
  );
}
