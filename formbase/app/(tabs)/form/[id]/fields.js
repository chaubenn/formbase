/*
  Fields manager screen: add fields to a form and show existing field definitions.
  - Supports text/multiline/dropdown/location/image
  - Enforces no duplicate names and numeric toggle rules
*/
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert, Switch, StyleSheet, Keyboard } from 'react-native';
import { fieldAPI } from '../../../../lib/api';
import Dropdown from '../../../components/Dropdown';

const FIELD_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Multiline', value: 'multiline' },
  { label: 'Dropdown', value: 'dropdown' },
  { label: 'Location', value: 'location' },
  { label: 'Image', value: 'image' },
];

export default function FieldsScreen() {
  const { id } = useLocalSearchParams();
  const formId = Number(id);
  const [fields, setFields] = useState([]);
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [required, setRequired] = useState(false);
  const [isNum, setIsNum] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    // Load and cache the field definitions for this form
    setLoading(true);
    try {
      const fs = await fieldAPI.getByFormId(formId);
      setFields(fs || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (formId) load();
  }, [formId]);

  async function addField() {
    // Validate field name presence
    if (!name) return Alert.alert('Validation', 'Field name is required');

    const trimmed = name.trim();
    if (!trimmed) return Alert.alert('Validation', 'Field name is required');
    // Prevent duplicate field names (case-insensitive), keeps records stable
    if (fields.some(f => (f.name || '').toLowerCase() === trimmed.toLowerCase())) {
      return Alert.alert('Validation', 'A field with this name already exists. Please choose a different name.');
    }

    let options = null;
    if (fieldType === 'dropdown') {
      const values = dropdownOptions
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
      options = { values };
    }

    Keyboard.dismiss();
    try {
      await fieldAPI.create({
        form_id: formId,
        name: trimmed,
        field_type: fieldType,
        options,
        required,
        is_num: (fieldType === 'text' || fieldType === 'multiline') ? isNum : false,
        order_index: (fields?.length || 0) + 1,
      });
      setName('');
      setFieldType('text');
      setRequired(false);
      setIsNum(false);
      setDropdownOptions('');
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add New Field</Text>
          
          <Text style={styles.label}>Field Name *</Text>
          <TextInput 
            placeholder="e.g. Email Address" 
            value={name} 
            onChangeText={setName} 
            style={styles.input}
          />
          
          <Text style={styles.label}>Field Type</Text>
          <Dropdown 
            title="Select Field Type"
            options={FIELD_TYPES}
            value={fieldType}
            onChange={(v) => {
              setFieldType(v);
              if (v === 'dropdown' || v === 'location' || v === 'image') {
                setIsNum(false);
              }
            }}
          />

          {fieldType === 'dropdown' && (
            <>
              <Text style={styles.label}>Dropdown Options (comma separated)</Text>
              <TextInput
                placeholder="e.g. Option 1, Option 2, Option 3"
                value={dropdownOptions}
                onChangeText={setDropdownOptions}
                style={styles.input}
              />
            </>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Required field</Text>
            <Switch 
              value={required} 
              onValueChange={setRequired}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={required ? '#3b82f6' : '#f3f4f6'}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Numeric field</Text>
            <Switch 
              value={(fieldType === 'dropdown' || fieldType === 'location' || fieldType === 'image') ? false : isNum} 
              onValueChange={setIsNum}
              disabled={fieldType === 'dropdown' || fieldType === 'location' || fieldType === 'image'}
              trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
              thumbColor={isNum ? '#3b82f6' : '#f3f4f6'}
            />
          </View>

          <TouchableOpacity onPress={addField} style={styles.button}>
            <Text style={styles.buttonText}>Add Field</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Current Fields ({fields.length})</Text>
          {fields.length === 0 ? (
            <Text style={styles.emptyText}>No fields yet</Text>
          ) : (
            fields.map(f => (
              <View key={f.id} style={styles.fieldItem}>
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldName}>{f.name}</Text>
                  <Text style={styles.fieldType}>{f.field_type}</Text>
                </View>
                <View style={styles.fieldTags}>
                  {f.required && <Text style={styles.tagRequired}>Required</Text>}
                  {f.is_num && <Text style={styles.tagNumeric}>Numeric</Text>}
                  <Text style={styles.tagOrder}>Order: {f.order_index}</Text>
                </View>
              </View>
            ))
          )}
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
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  pickerItem: {
    fontSize: 16,
    height: 50,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  switchLabel: {
    fontSize: 15,
    color: '#374151',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  fieldItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  fieldType: {
    fontSize: 13,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fieldTags: {
    flexDirection: 'row',
    gap: 6,
  },
  tagRequired: {
    fontSize: 11,
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
  },
  tagNumeric: {
    fontSize: 11,
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
  },
  tagOrder: {
    fontSize: 11,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
