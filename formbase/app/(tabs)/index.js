/*
  Home screen: landing card and feature overview.
  - Provides an entry point and a CTA to navigate to My Forms
*/
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  
  return (
    // ScrollView keeps the layout safe on small screens
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Intro card */}
        <View style={styles.card}>
          <Text style={styles.title}>FormBase</Text>
          <Text style={styles.subtitle}>
            A lightweight, mobile-first data collection system.
          </Text>
          
          {/* CTA navigates straight to the Forms tab */}
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/forms')}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              Get Started →
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Feature summary */}
        <View style={styles.card}>
          <Text style={styles.featuresTitle}>Features</Text>
          <Text style={styles.feature}>• Create custom forms</Text>
          <Text style={styles.feature}>• Multiple field types (text, dropdown, location, images)</Text>
          <Text style={styles.feature}>• Save and filter records</Text>
          <Text style={styles.feature}>• Map visualization</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  feature: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 22,
  },
});


