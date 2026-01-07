/*
  Root app layout for expo-router.
  - Wraps the app in SafeAreaProvider and StatusBar
  - Registers the top-level (tabs) route group
*/
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* Global status bar style for the whole app */}
      <StatusBar style="dark" />
      {/* Register the tabs route group; individual screens are defined under app/(tabs) */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}


