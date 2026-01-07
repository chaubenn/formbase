/*
  New record screen: renders inputs dynamically based on field definitions.
  - Validates required and numeric fields
  - Includes image picker, location capture, and dropdowns
  - iOS keyboard UX: Done accessory, tap-to-dismiss, keyboard avoidance
*/
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert, Image, StyleSheet, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, InputAccessoryView } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { fieldAPI, recordAPI } from '../../../../lib/api';
import Dropdown from '../../../components/Dropdown';

export default function NewRecordScreen() {
  const { id } = useLocalSearchParams();
  const formId = Number(id);
  const router = useRouter();
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const iosDoneID = 'doneAccessory';

  useEffect(() => {
    (async () => {
      const fs = await fieldAPI.getByFormId(formId);
      setFields(fs || []);
    })();
  }, [formId]);

  function setValue(key, val) {
    // Store per-field value keyed by field name
    setValues(prev => ({ ...prev, [key]: val }));
  }

  async function pickImage(fieldName) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission required', 'Media library permission is required.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setValue(fieldName, result.assets?.[0]?.uri || null);
    }
  }

  async function captureLocation(fieldName) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission required', 'Location permission is required.');
    }
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setValue(fieldName, { lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e) {
      Alert.alert('Error', 'Could not get location: ' + e.message);
    }
  }

  function validate() {
    // Validate required and numeric fields before saving
    for (const f of fields) {
      if (f.required) {
        const v = values[f.name];
        if (v === undefined || v === null || v === '') {
          return `${f.name} is required`;
        }
      }
      if (f.is_num && values[f.name] !== undefined && values[f.name] !== null && values[f.name] !== '') {
        if (isNaN(Number(values[f.name]))) return `${f.name} must be numeric`;
      }
    }
    return null;
  }

  async function save() {
    // Stop early when form invalid
    const err = validate();
    if (err) return Alert.alert('Validation', err);
    
    Keyboard.dismiss();
    try {
      setLoading(true);
      // Convert numeric fields to numbers, skip empty/undefined
      const processedValues = {};
      for (const f of fields) {
        const val = values[f.name];
        if (val !== undefined && val !== null && val !== '') {
          if (f.is_num) {
            const num = Number(val);
            if (!isNaN(num)) {
              processedValues[f.name] = num;
            }
          } else {
            processedValues[f.name] = val;
          }
        }
      }
      await recordAPI.create({ form_id: formId, values: processedValues });
      Alert.alert('Success', 'Record saved!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>New Record</Text>
          <Text style={styles.subtitle}>Fill in all required fields</Text>
        </View>

        {fields.map(f => (
          <View key={f.id} style={styles.card}>
            <Text style={styles.label}>
              {f.name} {f.required && <Text style={styles.required}>*</Text>}
            </Text>
            {f.field_type === 'text' && (
              <TextInput 
                value={values[f.name] || ''} 
                onChangeText={(t) => setValue(f.name, f.is_num ? (t === '' ? '' : t) : t)}
                keyboardType={f.is_num ? 'numeric' : 'default'}
                style={styles.input}
                placeholder={f.is_num ? 'Enter a number' : 'Enter text'}
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={Keyboard.dismiss}
              />
            )}
            {f.field_type === 'multiline' && (
              <TextInput 
                value={values[f.name] || ''} 
                onChangeText={(t) => setValue(f.name, t)}
                multiline 
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
                placeholder="Enter text"
                inputAccessoryViewID={Platform.OS === 'ios' ? iosDoneID : undefined}
              />
            )}
            {f.field_type === 'dropdown' && Array.isArray(f.options?.values) && (
              <View style={{ marginTop: 4 }}>
                <Dropdown
                  title={`Select ${f.name}`}
                  options={f.options.values.map(v => ({ label: String(v), value: String(v) }))}
                  value={values[f.name] || ''}
                  onChange={(v) => setValue(f.name, v)}
                  placeholder={`Choose ${f.name}`}
                />
              </View>
            )}
            {f.field_type === 'image' && (
              <View>
                <TouchableOpacity onPress={() => pickImage(f.name)} style={styles.button}>
                  <Text style={styles.buttonText}>Pick Image</Text>
                </TouchableOpacity>
                {values[f.name] && (
                  <Image source={{ uri: values[f.name] }} style={styles.image} />
                )}
              </View>
            )}
            {f.field_type === 'location' && (
              <View>
                <TouchableOpacity onPress={() => captureLocation(f.name)} style={styles.button}>
                  <Text style={styles.buttonText}>Capture Location</Text>
                </TouchableOpacity>
                {values[f.name] && (
                  <View style={styles.locationDisplay}>
                    <Text style={styles.locationText}>📍 Lat: {values[f.name].lat?.toFixed(6)}</Text>
                    <Text style={styles.locationText}>📍 Lng: {values[f.name].lng?.toFixed(6)}</Text>
                  </View>
                )}
              </View>
            )}
            {f.is_num && <Text style={styles.hint}>Numeric field</Text>}
          </View>
        ))}

            <TouchableOpacity onPress={save} style={styles.primaryButton} disabled={loading}>
              <Text style={styles.primaryButtonText}>
                {loading ? 'Saving...' : 'Save Record'}
              </Text>
            </TouchableOpacity>
          </View>
          {Platform.OS === 'ios' && (
            <InputAccessoryView nativeID={iosDoneID}>
              <View style={styles.accessory}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={Keyboard.dismiss} style={styles.accessoryBtn}>
                  <Text style={styles.accessoryBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </InputAccessoryView>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#dc2626',
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingBottom: 12,
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  locationDisplay: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 2,
  },
  hint: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  accessory: {
    backgroundColor: '#f3f4f6',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accessoryBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  accessoryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
