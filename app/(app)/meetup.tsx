import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, MapPin, AlertCircle, Info } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

const CAMPUS_ZONES = [
  { id: 'TECH_PARK', label: 'Tech Park', risk: 'LOW', x: 20, y: 30, color: '#10B981', trades: 45 },
  { id: 'LIBRARY', label: 'University Library', risk: 'LOW', x: 50, y: 25, color: '#10B981', trades: 120 },
  { id: 'MAIN_BLOCK', label: 'Main Block', risk: 'MEDIUM', x: 45, y: 55, color: '#F59E0B', trades: 88 },
  { id: 'CANTEEN', label: 'Canteen Area', risk: 'MEDIUM', x: 75, y: 70, color: '#F59E0B', trades: 62 },
  { id: 'HOSTEL_BLOCK', label: 'Hostel Block', risk: 'HIGH', x: 15, y: 80, color: '#EF4444', trades: 34 },
  { id: 'SPORTS_COMPLEX', label: 'Sports Complex', risk: 'LOW', x: 80, y: 20, color: '#10B981', trades: 21 },
];

export default function MeetupHeatmapScreen() {
  const router = useRouter();
  const [selectedZone, setSelectedZone] = useState<any>(CAMPUS_ZONES[1]);
  const [activeSpots, setActiveSpots] = useState<any[]>([]);

  useEffect(() => {
    fetchActiveSpots();
  }, []);

  const fetchActiveSpots = async () => {
    const { data } = await supabase.from('meetup_spots').select('*');
    if (data) setActiveSpots(data);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meetup Heatmap</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Visual Map Engine */}
        <View style={styles.mapContainer}>
          <View style={styles.campusMap}>
            {/* Structural Elements (Placeholders) */}
            <View style={[styles.campusBuilding, { width: 100, height: 160, left: 10, top: 40 }]} />
            <View style={[styles.campusBuilding, { width: 140, height: 80, left: 120, top: 20 }]} />
            <View style={[styles.campusBuilding, { width: 100, height: 100, left: 240, top: 120 }]} />
            
            {/* Zone Markers */}
            {CAMPUS_ZONES.map(zone => (
              <TouchableOpacity 
                key={zone.id}
                style={[
                  styles.marker, 
                  { left: `${zone.x}%`, top: `${zone.y}%` },
                  selectedZone?.id === zone.id && styles.markerSelected
                ]}
                onPress={() => setSelectedZone(zone)}
              >
                <View style={[styles.markerPulse, { backgroundColor: zone.color + '40' }]} />
                <View style={[styles.markerDot, { backgroundColor: zone.color }]} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.mapOverlay}>
             <Text style={styles.mapHint}>TAP A ZONE TO VIEW STATUS</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoSection}>
           <View style={styles.zoneCard}>
              <View style={styles.zoneHeader}>
                 <View>
                    <Text style={styles.zoneLabel}>{selectedZone?.label}</Text>
                    <View style={styles.riskBadge}>
                       <Shield size={12} color={selectedZone?.color} />
                       <Text style={[styles.riskText, { color: selectedZone?.color }]}>{selectedZone?.risk} RISK ZONE</Text>
                    </View>
                 </View>
                 <View style={styles.statGroup}>
                    <Text style={styles.statValue}>{selectedZone?.trades}+</Text>
                    <Text style={styles.statLabel}>Successful Trades</Text>
                 </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.cardHeader}>Why this zone?</Text>
              <Text style={styles.cardDesc}>
                {selectedZone?.risk === 'LOW' 
                  ? "This area is under CCTV surveillance and has high student footfall throughout the day. Recommended for expensive trades." 
                  : selectedZone?.risk === 'MEDIUM' 
                  ? "Popular spot but can be crowded. Ensure you meet during daylight hours and verify the item thoroughly before paying." 
                  : "Private area with limited surveillance. We strongly advise moving your meetup to the Library or Tech Park lobby instead."}
              </Text>

              <TouchableOpacity style={styles.spotBtn}>
                 <MapPin size={18} color="#fff" />
                 <Text style={styles.spotBtnText}>Request Meetup Here</Text>
              </TouchableOpacity>
           </View>

           {/* Safety Tips */}
           <View style={styles.tipsSection}>
              <View style={styles.tipsHeader}>
                 <AlertCircle size={20} color={Colors.primary} />
                 <Text style={styles.tipsTitle}>Trading Safety Tips</Text>
              </View>
              <View style={styles.tipItem}>
                 <Info size={16} color={Colors.muted} />
                 <Text style={styles.tipText}>Check student IDs before starting the trade.</Text>
              </View>
              <View style={styles.tipItem}>
                 <Info size={16} color={Colors.muted} />
                 <Text style={styles.tipText}>Use the CampusCart vault for payments whenever possible.</Text>
              </View>
           </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    color: Colors.primary,
  },
  mapContainer: {
    height: 350,
    backgroundColor: '#F8F9FE',
    position: 'relative',
  },
  campusMap: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
  },
  campusBuilding: {
    position: 'absolute',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    opacity: 0.5,
  },
  marker: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerSelected: {
    zIndex: 10,
    transform: [{ scale: 1.5 }],
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  mapHint: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    color: Colors.muted,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    letterSpacing: 1,
  },
  infoSection: {
    padding: 20,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    minHeight: 500,
  },
  zoneCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  zoneLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    color: Colors.primary,
    marginBottom: 6,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  statGroup: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: Colors.primary,
  },
  statLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
    color: Colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  cardHeader: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 20,
    marginBottom: 24,
  },
  spotBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  spotBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: '#fff',
  },
  tipsSection: {
    backgroundColor: '#F8F9FE',
    borderRadius: 16,
    padding: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  tipsTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: Colors.primary,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  tipText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.muted,
    flex: 1,
  },
});
