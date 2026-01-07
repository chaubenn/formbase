/*
  Map screen: displays markers for records with a location field.
  - Only shows if a location field exists
  - Callouts render record details including images and location
*/
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, Dimensions, Alert, StyleSheet, Image, ScrollView } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { recordAPI, fieldAPI } from '../../../../lib/api';

export default function MapScreen() {
  const { id } = useLocalSearchParams();
  const formId = Number(id);
  const [records, setRecords] = useState([]);
  const [fields, setFields] = useState([]);
  const [hasLocationField, setHasLocationField] = useState(false);
  const [locationFieldName, setLocationFieldName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const fs = await fieldAPI.getByFormId(formId); // load fields for current form
        const locField = fs?.find(f => f.field_type === 'location');
        setFields(fs || []);
        setHasLocationField(!!locField);
        setLocationFieldName(locField?.name || '');
        
        if (locField) {
          const rs = await recordAPI.getByFormId(formId);
          setRecords(rs || []); // only fetch records if location field exists
        }
      } catch (e) {
        Alert.alert('Error', e.message);
      }
    })();
  }, [formId]);

  if (!hasLocationField) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>📍 No Location Field</Text>
          <Text style={styles.emptyText}>
            This form doesn't have a location field.{'\n'}
            Add a location field to see records on the map.
          </Text>
        </View>
      </View>
    );
  }

  const { width, height } = Dimensions.get('window');
  const initial = { 
    latitude: -27.4975, 
    longitude: 153.0137, 
    latitudeDelta: 0.2, 
    longitudeDelta: 0.2 
  };

  // Extract records with valid location data
  const markerData = records
    .map(r => {
      const loc = r.values?.[locationFieldName];
      if (!loc || typeof loc !== 'object' || !('lat' in loc) || !('lng' in loc)) return null;
      return { ...r, location: loc };
    })
    .filter(Boolean);

  return (
    <View style={styles.container}>
      <MapView 
        style={{ width, height: height - 150 }} 
        initialRegion={initial}
        showsUserLocation
      >
        {markerData.map(r => (
          <Marker 
            key={r.id} 
            coordinate={{ 
              latitude: Number(r.location.lat), 
              longitude: Number(r.location.lng) 
            }}
            pinColor="#3b82f6"
          >
            <Callout style={styles.callout}>
              <ScrollView style={styles.calloutScroll}>
                <Text style={styles.calloutTitle}>Record #{r.id}</Text>
                {fields.map(f => {
                  const val = r.values?.[f.name];
                  if (val === undefined || val === null) return null;
                  
                  return (
                    <View key={f.name} style={styles.calloutField}>
                      <Text style={styles.calloutFieldName}>{f.name}:</Text>
                      {f.field_type === 'image' && typeof val === 'string' ? (
                        <Image source={{ uri: val }} style={styles.calloutImage} />
                      ) : f.field_type === 'location' && typeof val === 'object' ? (
                        <Text style={styles.calloutFieldValue}>
                          {val.lat?.toFixed(6)}, {val.lng?.toFixed(6)}
                        </Text>
                      ) : (
                        <Text style={styles.calloutFieldValue}>{String(val)}</Text>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </Callout>
          </Marker>
        ))}
      </MapView>
      
      <View style={styles.mapInfo}>
        <Text style={styles.mapInfoText}>
          {markerData.length} record{markerData.length !== 1 ? 's' : ''} with location data
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  mapInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mapInfoText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  callout: {
    width: 250,
    padding: 0,
  },
  calloutScroll: {
    maxHeight: 200,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  calloutField: {
    marginBottom: 6,
  },
  calloutFieldName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  calloutFieldValue: {
    fontSize: 13,
    color: '#111827',
    marginTop: 2,
  },
  calloutImage: {
    width: '100%',
    height: 100,
    borderRadius: 4,
    marginTop: 4,
  },
});
