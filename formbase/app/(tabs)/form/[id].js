/*
  Form detail screen: shows a single form summary, fields list, and quick actions.
  - Inline "+ Add Field" modal to add fields (with duplicate name checks)
  - Buttons to Records and Map screens
*/
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, StyleSheet, Modal, TextInput, Switch, Keyboard } from 'react-native';
import { fieldAPI, formAPI } from '../../../lib/api';
import Dropdown from '../../components/Dropdown';

export default function FormDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const formId = Number(id);
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newRequired, setNewRequired] = useState(false);
  const [newIsNum, setNewIsNum] = useState(false);
  const [newDropdownOptions, setNewDropdownOptions] = useState('');

  async function load() {
    try {
      const f = await formAPI.getById(formId);
      setForm(f);
      const fs = await fieldAPI.getByFormId(formId);
      setFields(fs || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  useEffect(() => {
    if (formId) load();
  }, [formId]);

  async function addField() {
    if (!newFieldName) return Alert.alert('Validation', 'Field name is required');
    const trimmed = newFieldName.trim();
    if (!trimmed) return Alert.alert('Validation', 'Field name is required');
    // Prevent duplicate field names (case-insensitive) on this form
    if (fields.some(f => (f.name || '').toLowerCase() === trimmed.toLowerCase())) {
      return Alert.alert('Validation', 'A field with this name already exists. Please choose a different name.');
    }
    let options = null;
    if (newFieldType === 'dropdown') {
      const values = newDropdownOptions.split(',').map(v => v.trim()).filter(Boolean);
      options = { values };
    }
    Keyboard.dismiss();
    try {
      await fieldAPI.create({
        form_id: formId,
        name: trimmed,
        field_type: newFieldType,
        options,
        required: newRequired,
        is_num: newIsNum,
        order_index: (fields?.length || 0) + 1,
      });
      setShowAddField(false);
      setNewFieldName('');
      setNewFieldType('text');
      setNewRequired(false);
      setNewIsNum(false);
      setNewDropdownOptions('');
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {form && (
          <View style={styles.card}>
            <Text style={styles.title}>{form.name}</Text>
            <Text style={styles.description}>{form.description}</Text>
          </View>
        )}

        <View style={styles.actionsCard}>
          <TouchableOpacity 
            onPress={() => router.push(`/(tabs)/form/${formId}/records`)}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Records</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push(`/(tabs)/form/${formId}/map`)}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Map</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Fields ({fields.length})</Text>
            <TouchableOpacity onPress={() => setShowAddField(true)}>
              <Text style={styles.link}>+ Add Field</Text>
            </TouchableOpacity>
          </View>
          {fields.length === 0 ? (
            <Text style={styles.emptyText}>No fields yet. Tap "+ Add Field".</Text>
          ) : (
            fields.map((fld) => (
              <View key={fld.id} style={styles.fieldItem}>
                <View style={styles.fieldHeaderRow}>
                  <Text style={styles.fieldName}>{fld.name}</Text>
                  <Text style={styles.fieldTypeBadge}>{fld.field_type}</Text>
                </View>
                <View style={styles.fieldTags}>
                  {fld.required && <Text style={styles.tagRequired}>Required</Text>}
                  {fld.is_num && <Text style={styles.tagNumeric}>Numeric</Text>}
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity 
          onPress={() => router.push(`/(tabs)/form/${formId}/new-record`)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Add Record</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={showAddField} transparent animationType="fade" onRequestClose={() => setShowAddField(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowAddField(false)} style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Field</Text>
            <Text style={styles.label}>Field Name *</Text>
            <TextInput
              placeholder="e.g. Email Address"
              placeholderTextColor="#9ca3af"
              value={newFieldName}
              onChangeText={setNewFieldName}
              style={[styles.input, styles.inputSlot, { borderColor: newFieldName ? '#d1d5db' : '#ef4444' }]}
            />
            <View style={{ height: 8 }} />
            <Text style={styles.label}>Field Type</Text>
            <Dropdown
              title="Select Field Type"
              options={FIELD_TYPES}
              value={newFieldType}
              onChange={(v) => {
                setNewFieldType(v);
                if (v === 'dropdown' || v === 'location' || v === 'image') {
                  setNewIsNum(false);
                }
              }}
            />
            {newFieldType === 'dropdown' && (
              <>
                <Text style={styles.label}>Dropdown Options (comma separated)</Text>
                <TextInput
                  placeholder="e.g. Option 1, Option 2, Option 3"
                  value={newDropdownOptions}
                  onChangeText={setNewDropdownOptions}
                  style={styles.input}
                />
              </>
            )}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Required field</Text>
              <Switch value={newRequired} onValueChange={setNewRequired} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Numeric field</Text>
              <Switch 
                value={(newFieldType === 'dropdown' || newFieldType === 'location' || newFieldType === 'image') ? false : newIsNum} 
                onValueChange={setNewIsNum}
                disabled={newFieldType === 'dropdown' || newFieldType === 'location' || newFieldType === 'image'}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setShowAddField(false)} style={[styles.actionButton, { flex: 1 }]}>
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addField} style={[styles.primaryButton, { flex: 1 }]}>
                <Text style={styles.primaryButtonText}>Add Field</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const FIELD_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Multiline', value: 'multiline' },
  { label: 'Dropdown', value: 'dropdown' },
  { label: 'Location', value: 'location' },
  { label: 'Image', value: 'image' },
];

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
    marginBottom: 12,
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
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  link: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
  fieldItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  fieldTypeBadge: {
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fieldTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
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
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 15,
    color: '#374151',
  },
  inputSlot: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
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
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
