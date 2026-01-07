/*
  About screen: describes the FormBase app and intent.
  - Static content; no API calls
*/
import { ScrollView, View, Text, StyleSheet } from 'react-native';

export default function AboutScreen() {
  return (
    // Simple static screen; using ScrollView for consistency
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>About FormBase</Text>
          <Text style={styles.text}>
            FormBase is a prototype mobile app that lets users create flexible data-collection forms on the fly.
            {'\n\n'}
            Each form can include a mix of field types — text, multiline text, dropdowns, image/camera, and location with options for marking fields as required or numeric.
            {'\n\n'}
            Once a form with fields is created, users can save records, define custom filters, and visualize location results on a map.
          </Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
});


