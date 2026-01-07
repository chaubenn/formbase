/*
  Tabs layout configuring three primary tabs (Home, About, My Forms).
  - Hides the internal form route group from tab bar
  - Ensures consistent header and footer across screens
  - My Forms tab press always resets to the list screen
*/
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabsLayout() {
  const router = useRouter();
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#3b82f6',
      tabBarInactiveTintColor: '#6b7280',
      // Blue app header
      headerStyle: { backgroundColor: '#3b82f6' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      // Bottom tab styling + extra padding on iOS to clear home indicator
      tabBarStyle: { 
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        paddingTop: 8,
        height: Platform.OS === 'ios' ? 85 : 65,
      },
    }}>
      <Tabs.Screen 
        name="form"
        options={{ href: null, headerShown: false }}
      />
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          // Ionicons used for simple OS-consistent icons
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="about" 
        options={{ 
          title: 'About',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="forms" 
        options={{ 
          title: 'My Forms',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // Always reset to the My Forms list; avoid navigating between form detail screens
            e.preventDefault();
            router.replace('/(tabs)/forms');
          }
        }} 
      />
    </Tabs>
  );
}


