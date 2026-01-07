/*
  Records list + filter builder screen.
  - Lists records with delete/copy actions
  - AND/OR filter builder with numeric/string operator sets
  - Uses dropdowns for field/operator selections
*/
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { recordAPI, fieldAPI } from '../../../../lib/api';
import Dropdown from '../../../components/Dropdown';

const NUM_OPERATORS = [
  { label: 'Equals (=)', key: 'eq' },
  { label: 'Greater than (>)', key: 'gt' },
  { label: 'Less than (<)', key: 'lt' },
  { label: 'Greater or equal (>=)', key: 'gte' },
  { label: 'Less or equal (<=)', key: 'lte' },
];

const STR_OPERATORS = [
  { label: 'Equals', key: 'eq' },
  { label: 'Contains', key: 'ilike' },
  { label: 'Starts with', key: 'like' },
];

export default function RecordsScreen() {
  const { id } = useLocalSearchParams();
  const formId = Number(id);
  const [records, setRecords] = useState([]);
  const [fields, setFields] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [logic, setLogic] = useState('and');

  async function load() {
    try {
      const fs = await fieldAPI.getByFormId(formId);
      setFields(fs || []);
      const rs = await recordAPI.getByFormId(formId);
      setRecords(rs || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  useEffect(() => {
    if (formId) load();
  }, [formId]);

  function addCriterion() {
    // Start each criterion with a default field and eq operator
    setCriteria(prev => ([...prev, { fieldName: fields[0]?.name || '', operator: 'eq', value: '' }]));
  }

  function updateCriterion(index, patch) {
    setCriteria(prev => prev.map((c, i) => i === index ? { ...c, ...patch } : c));
  }

  function removeCriterion(index) {
    setCriteria(prev => prev.filter((_, i) => i !== index));
  }

  async function applyFilter() {
    try {
      // Build PostgREST filter string from user criteria
      const query = buildPostgrestFilter(criteria, logic, fields);
      const rs = await recordAPI.query(formId, query);
      setRecords(rs || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  async function clearFilter() {
    setCriteria([]);
    await load();
  }

  async function copyRecord(rec) {
    await Clipboard.setStringAsync(JSON.stringify(rec, null, 2));
    Alert.alert('Copied', 'Record JSON copied to clipboard');
  }

  async function deleteRecord(recId) {
    Alert.alert('Delete Record', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await recordAPI.delete(recId);
            await load();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Filter Criteria Builder</Text>
          
          <View style={styles.logicToggle}>
            <TouchableOpacity 
              onPress={() => setLogic('and')}
              style={[styles.logicButton, logic === 'and' && styles.logicButtonActive]}
            >
              <Text style={[styles.logicButtonText, logic === 'and' && styles.logicButtonTextActive]}>AND</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setLogic('or')}
              style={[styles.logicButton, logic === 'or' && styles.logicButtonActive]}
            >
              <Text style={[styles.logicButtonText, logic === 'or' && styles.logicButtonTextActive]}>OR</Text>
            </TouchableOpacity>
          </View>

          {criteria.map((c, i) => {
            const field = fields.find(f => f.name === c.fieldName);
            const operators = field?.is_num ? NUM_OPERATORS : STR_OPERATORS;
            return (
              <View key={i} style={styles.criterionCard}>
                <View style={styles.criterionRow}>
                  <View style={styles.criterionField}>
                    <Text style={styles.miniLabel}>Field</Text>
                    <Dropdown 
                      title="Select Field"
                      options={fields.map(f => ({ label: f.name, value: f.name }))}
                      value={c.fieldName}
                      onChange={(v) => updateCriterion(i, { fieldName: v })}
                    />
                  </View>

                  <View style={styles.criterionField}>
                    <Text style={styles.miniLabel}>Operator</Text>
                    <Dropdown 
                      title="Select Operator"
                      options={operators.map(op => ({ label: op.label, value: op.key }))}
                      value={c.operator}
                      onChange={(v) => updateCriterion(i, { operator: v })}
                    />
                  </View>
                </View>

                <Text style={styles.miniLabel}>Value</Text>
                <TextInput
                  placeholder="Enter value"
                  value={String(c.value || '')}
                  onChangeText={(t) => updateCriterion(i, { value: t })}
                  style={styles.input}
                  keyboardType={field?.is_num ? 'numeric' : 'default'}
                />

                <TouchableOpacity onPress={() => removeCriterion(i)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={styles.filterActions}>
            <TouchableOpacity onPress={addCriterion} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>+ Add Criterion</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={applyFilter} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Apply Filter</Text>
            </TouchableOpacity>
            {criteria.length > 0 && (
              <TouchableOpacity onPress={clearFilter} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Records ({records.length})</Text>
          {records.length === 0 ? (
            <Text style={styles.emptyText}>No records found</Text>
          ) : (
            records.map(rec => (
              <View key={rec.id} style={styles.recordCard}>
                <Text style={styles.recordTitle}>Record #{rec.id}</Text>
                {fields.map((f, idx) => {
                  const val = rec.values?.[f.name];
                  if (val === undefined || val === null) return null;
                  const key = `${f.name}-${idx}`; // ensure uniqueness even if duplicate names exist historically
                  return (
                    <View key={key} style={styles.recordField}>
                      <Text style={styles.recordFieldName}>{f.name}:</Text>
                      {f.field_type === 'image' && typeof val === 'string' ? (
                        <Image source={{ uri: val }} style={styles.recordImage} />
                      ) : f.field_type === 'location' && typeof val === 'object' ? (
                        <Text style={styles.recordFieldValue}>
                          📍 {val.lat?.toFixed(6)}, {val.lng?.toFixed(6)}
                        </Text>
                      ) : (
                        <Text style={styles.recordFieldValue}>{String(val)}</Text>
                      )}
                    </View>
                  );
                })}
                <View style={styles.recordActions}>
                  <TouchableOpacity onPress={() => copyRecord(rec)}>
                    <Text style={styles.copyButton}>Copy JSON</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteRecord(rec.id)}>
                    <Text style={styles.deleteButton}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function buildPostgrestFilter(criteria, logic, fields) {
  if (!criteria?.length) return '';
  const parts = [];
  for (const c of criteria) {
    const fld = fields.find(f => f.name === c.fieldName);
    if (!fld) continue;
    const key = `values->>${c.fieldName}`;
    let value = c.value ?? '';
    if (!fld.is_num) {
      // PostgREST pattern matching: wrap or prefix with * for ilike/like
      if (c.operator === 'ilike') value = `*${String(value)}*`;
      if (c.operator === 'like') value = `${String(value)}*`;
    }
    parts.push(`${key}=${c.operator}.${encodeURIComponent(String(value))}`);
  }
  if (logic === 'or' && parts.length > 1) {
    return `or=(${parts.join(',')})`; // group clauses with OR
  }
  return parts.join('&');
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
    marginBottom: 12,
  },
  logicToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  logicButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  logicButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  logicButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  logicButtonTextActive: {
    color: '#ffffff',
  },
  criterionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  criterionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  criterionField: {
    flex: 1,
  },
  miniLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  miniPickerContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    overflow: 'hidden',
  },
  miniPicker: {
    height: 50,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  removeButton: {
    alignSelf: 'flex-end',
  },
  removeButtonText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '500',
  },
  filterActions: {
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 15,
  },
  clearButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  recordCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  recordField: {
    marginBottom: 8,
  },
  recordFieldName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 2,
  },
  recordFieldValue: {
    fontSize: 14,
    color: '#111827',
  },
  recordImage: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginTop: 4,
  },
  recordActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  copyButton: {
    color: '#3b82f6',
    fontWeight: '500',
    fontSize: 14,
  },
  deleteButton: {
    color: '#dc2626',
    fontWeight: '500',
    fontSize: 14,
  },
});
