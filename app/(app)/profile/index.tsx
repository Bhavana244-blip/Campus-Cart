import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, LayoutAnimation, UIManager, Platform, useWindowDimensions } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useRouter } from 'expo-router';
import { LogOut, Settings, Package, Heart, Shield, HelpCircle, Trash2, User } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { Colors } from '../../../constants/colors';
import Avatar from '../../../components/ui/Avatar';
import ListingCard from '../../../components/ui/ListingCard';
import Toast from '../../../components/ui/Toast';

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { appUser, logout } = useAuthStore();
  
  const numColumns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
  const cardWidth = `${100 / numColumns - 2}%`;

  const [myListings, setMyListings] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [toastMsg, setToastMsg] = useState({ visible: false, title: '', message: '', type: 'success' as any });

  useEffect(() => {
    if (appUser?.id) {
      fetchMyListings();
    }
  }, [appUser]);

  const fetchMyListings = async () => {
    setIsLoadingListings(true);
    const { data, error } = await supabase
      .from('listings')
      .select('*, users!inner(full_name)')
      .eq('seller_id', appUser?.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my listings:', error.message);
    } else if (data) {
      setMyListings(data);
    }
    setIsLoadingListings(false);
  };

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setToastMsg({ visible: true, title, message, type });
    setTimeout(() => setToastMsg(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleDeleteListing = async (listingId: string) => {
    Alert.alert(
      'Remove this listing?',
      'Are you sure you want to permanently delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('listings')
              .update({ is_active: false })
              .eq('id', listingId);
              
            if (error) {
              showToast('Error', 'Failed to remove listing', 'error');
            } else {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setMyListings(prev => prev.filter(item => item.id !== listingId));
              showToast('Deleted', 'Listing removed successfully', 'info');
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await logout();
        // Redirection is now handled by RootLayout's useEffect
      } catch (error) {
        console.error('Logout failed:', error);
        showToast('Error', 'Failed to log out', 'error');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out of your account?')) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out of your account?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Log Out', 
            style: 'destructive',
            onPress: performLogout
          }
        ]
      );
    }
  };

  const MenuItem = ({ icon: Icon, label, onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <Icon size={20} color={Colors.primary} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
  
  const MenuInfoItem = ({ icon: Icon, label, value }: any) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <Icon size={20} color={Colors.primary} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Text style={styles.menuValue}>{value}</Text>
    </View>
  );

  if (!appUser) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={{ marginTop: 12, fontFamily: 'Sora_400Regular', color: Colors.muted }}>Loading profile...</Text>
      </View>
    );
  }

  // Calculate active listings dynamically
  const activeCount = myListings.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Section 1 - Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {appUser.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{appUser.full_name}</Text>
          <Text style={styles.userEmail}>{appUser.email}</Text>
          <Text style={styles.userStatus}>{appUser.department} • {appUser.year} • SRM KTR</Text>
        </View>

        {/* Section 2 - Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{appUser.rating || '0.0'}</Text>
            <Text style={styles.statLabel}>Star Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active Listings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{appUser.sold_count || 0}</Text>
            <Text style={styles.statLabel}>Items Sold</Text>
          </View>
        </View>

        {/* Section 3 - My Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Listings</Text>
          {isLoadingListings ? (
            <ActivityIndicator size="small" color={Colors.accent} style={{ margin: 20 }} />
          ) : myListings.length > 0 ? (
            <View style={styles.gridContainer}>
              {myListings.map(item => (
                <View key={item.id} style={[styles.gridItem, { width: cardWidth as any }]}>
                  <ListingCard
                    listing={item}
                    sellerName={appUser.full_name}
                    onPress={() => router.push(`/(app)/home/${item.id}`)}
                  />
                  <TouchableOpacity style={styles.deleteListingBtn} onPress={() => handleDeleteListing(item.id)}>
                    <Trash2 size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyListingsCard}>
              <Text style={styles.emptyListingsText}>No listings yet</Text>
              <TouchableOpacity style={styles.listBtn}>
                <Text style={styles.listBtnText}>List an Item</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Section 4 - Menu List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon={Heart} label="Saved Items" onPress={() => router.push('/(app)/saved')} />
            <MenuInfoItem icon={User} label="Account Email" value={appUser.email} />
            <MenuItem icon={Settings} label="Settings" onPress={() => router.push('/(app)/settings')} />
            <MenuItem icon={Shield} label="Privacy & Safety" onPress={() => router.push('/(app)/privacy')} />
          </View>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={20} color={Colors.danger} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
        
      </ScrollView>

      <Toast 
        visible={toastMsg.visible} 
        title={toastMsg.title} 
        message={toastMsg.message} 
        type={toastMsg.type} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#1A3C6E',
    paddingBottom: 60,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarInitials: {
    color: '#fff',
    fontFamily: 'Sora_700Bold',
    fontSize: 24,
  },
  userName: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  userStatus: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    marginHorizontal: 16,
    marginTop: -35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: Colors.primary,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
    position: 'relative',
  },
  deleteListingBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  emptyListingsCard: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  emptyListingsText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: Colors.muted,
    marginBottom: 16,
  },
  listBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  listBtnText: {
    color: '#fff',
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
  },
  menuGroup: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.tagBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 15,
    color: Colors.primary,
  },
  menuValue: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: Colors.muted,
  },
  logoutSection: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: Colors.danger,
  },
});
