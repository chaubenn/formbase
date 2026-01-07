/*
  Nested stack for Form routes.
  - Keeps "My Forms" header across sub-screens
  - Disables back navigation on form root to avoid switching forms via back
*/
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';

export default function FormStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#3b82f6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' }, // bold title matching app brand
        headerTitle: 'My Forms',                  // keep a consistent title across sub-screens
        headerBackTitle: 'My Forms',              // iOS back chip label
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          headerBackTitle: 'My Forms',
          headerBackVisible: false,   // hide back on root form
          headerLeft: () => null,     // no back button on root form
          gestureEnabled: false,      // disable iOS swipe back on root
        }}
      />
      {/* Sub-screens inherit consistent header with back arrow */}
      <Stack.Screen name="[id]/fields"  options={{ headerBackTitle: 'My Forms' }} />
      <Stack.Screen name="[id]/new-record" options={{ headerBackTitle: 'My Forms' }} />
      <Stack.Screen name="[id]/records" options={{ headerBackTitle: 'My Forms' }} />
      <Stack.Screen name="[id]/map"     options={{ headerBackTitle: 'My Forms' }} />
    </Stack>
  );
}


