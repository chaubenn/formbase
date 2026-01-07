/*
  My Forms screen: list/add/delete forms and navigate to form detail.
  - Enforces required fields (name, description)
  - Keyboard dismiss on Add; defensive error alerts
*/
import { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet, Keyboard } from 'react-native';
import { formAPI } from '../../lib/api';
import { useRouter } from 'expo-router';

export default function FormsScreen() {
  const router = useRouter();
  const [forms, setForms] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadForms() {
    // Fetch all forms; keep a spinner visible while loading
    setLoading(true);
    try {
      const data = await formAPI.getAll();
      setForms(data || []);
    } catch (e) {
      // Surface API errors in a friendly way
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadForms();
  }, []);

  async function addForm() {
    // Basic client-side validation before POST
    if (!name || !description) {
      Alert.alert('Validation', 'Name and Description are required.');
      return;
    }
    Keyboard.dismiss(); // Hide the keyboard so users see the list update
    try {
      await formAPI.create({ name, description });
      setName('');
      setDescription('');
      await loadForms();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  async function deleteForm(id) {
    // Confirm delete and only then call the API
    Alert.alert('Delete Form', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await formAPI.delete(id);
            await loadForms();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formSection}>
        <Text style={styles.formTitle}>Create New Form</Text>
        <TextInput 
          placeholder="Form Name" 
          value={name} 
          onChangeText={setName} 
          style={styles.input}
        />
        <TextInput 
          placeholder="Description" 
          value={description} 
          onChangeText={setDescription} 
          style={[styles.input, styles.textArea]}
          multiline
        />
        <TouchableOpacity 
          onPress={addForm}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Add Form</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadForms}
        data={forms}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No forms yet. Create one above!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => router.push(`/(tabs)/form/${item.id}`)}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => router.push(`/(tabs)/form/${item.id}`)}>
                <Text style={styles.openButton}>Open →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteForm(item.id)}>
                <Text style={styles.deleteButton}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  formSection: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
  },
  openButton: {
    color: '#3b82f6',
    fontWeight: '500',
    fontSize: 15,
  },
  deleteButton: {
    color: '#ef4444',
    fontWeight: '500',
    fontSize: 15,
  },
});
