import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, LayoutAnimation, UIManager, Platform, useWindowDimensions, Animated } from 'react-native';

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
import PressableScale from '../../../components/ui/PressableScale';
import { formatDistanceToNow } from 'date-fns';
import { Award, Zap, Trophy, Camera } from 'lucide-react-native';
import { getRankInfo, getXPProgress, XP_PER_LEVEL } from '../../../lib/gamify';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useState, useEffect, useRef } from 'react';

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { appUser, setAppUser, logout } = useAuthStore();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const barAnim = useRef(new Animated.Value(0)).current;
  
  const numColumns = width >= 1200 ? 5 : width >= 992 ? 4 : width >= 768 ? 3 : 2;

  const [myListings, setMyListings] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [userStats, setUserStats] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState({ visible: false, title: '', message: '', type: 'success' as any });

  useEffect(() => {
    if (appUser?.id) {
      fetchMyListings();
      fetchUserStats();
      
      // Animate XP Bar
      Animated.timing(barAnim, {
        toValue: getXPProgress(appUser.xp || 0),
        duration: 1200,
        useNativeDriver: false,
      }).start();
    }
  }, [appUser]);

  const fetchUserStats = async () => {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', appUser?.id)
      .single();
    
    if (data) {
      setUserStats(data);
    } else {
      setUserStats({ level: 1, xp: 45, badges: ['Newbie', 'First Sale'] });
    }
  };

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
    const proceed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to permanently delete this item?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Remove this listing?',
            'Are you sure you want to permanently delete this item?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Remove', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });

    if (proceed) {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);
        
      if (error) {
        showToast('Error', 'Failed to remove listing', 'error');
      } else {
        if (Platform.OS !== 'web') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMyListings(prev => prev.filter(item => item.id !== listingId));
        showToast('Deleted', 'Listing removed successfully', 'info');
      }
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await logout();
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
  
  const handleUpdateAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission needed', 'Gallery access is required to update your photo.', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets[0]) return;

      setIsUploadingAvatar(true);
      const uri = result.assets[0].uri;
      
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const response = await fetch(manipResult.uri);
      const blob = await response.blob();
      
      const fileName = `${appUser?.id}_${Date.now()}.jpg`;
      const path = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { 
          contentType: 'image/jpeg',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', appUser?.id);

      if (updateError) throw updateError;

      if (appUser) {
        setAppUser({ ...appUser, avatar_url: publicUrl });
      }

      showToast('Profile Updated', 'Your profile picture has been changed', 'success');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      showToast('Error', error.message || 'Failed to update photo', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const MenuItem = ({ icon: Icon, label, onPress }: any) => (
    <PressableScale onPress={onPress}>
      <View style={styles.menuItem}>
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIconContainer}>
            <Icon size={20} color={Colors.primary} />
          </View>
          <Text style={styles.menuLabel}>{label}</Text>
        </View>
      </View>
    </PressableScale>
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

  const activeCount = myListings.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.responsiveWrapper}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <PressableScale 
              style={styles.avatarWrapper} 
              onPress={handleUpdateAvatar}
              disabled={isUploadingAvatar}
            >
              <Avatar 
                name={appUser.full_name} 
                url={appUser.avatar_url} 
                size={110} 
                level={appUser.level || 1} 
              />
              <View style={styles.editAvatarBtn}>
                 {isUploadingAvatar ? <ActivityIndicator size="small" color="#fff" /> : <Camera size={18} color="#fff" />}
              </View>
            </PressableScale>
            <Text style={styles.userName}>{appUser.full_name}</Text>
            <View style={styles.studentInfoBadge}>
               <Text style={styles.studentInfoText}>{appUser.year} • {appUser.department}</Text>
            </View>
            
            <View style={styles.regContainer}>
               <Text style={styles.regLabel}>Registration Number</Text>
               <Text style={styles.regValue}>{appUser.registration_number || 'Not Linked'}</Text>
            </View>
          </View>

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

          <View style={styles.section}>
             <View style={styles.sectionHeaderRow}>
               <Text style={styles.sectionTitle}>Achievements</Text>
               <TouchableOpacity>
                  <Text style={styles.seeAllText}>View All</Text>
               </TouchableOpacity>
             </View>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
                {(userStats?.badges || ['Trader', 'Early Adopter']).map((badge: string, idx: number) => {
                  const badgePop = new Animated.Value(0);
                  Animated.spring(badgePop, {
                    toValue: 1,
                    delay: idx * 150,
                    useNativeDriver: true,
                    friction: 7,
                    tension: 40,
                  }).start();

                  return (
                    <PressableScale key={idx} style={styles.badgeVaultItem}>
                      <Animated.View style={{ transform: [{ scale: badgePop }], opacity: badgePop }}>
                        <View style={styles.badgeIconWrapper}>
                          <Award size={24} color={Colors.accent} />
                        </View>
                        <Text style={styles.badgeVaultLabel}>{badge}</Text>
                      </Animated.View>
                    </PressableScale>
                  );
                })}
                <View style={styles.badgeVaultItemLocked}>
                   <View style={[styles.badgeIconWrapper, { backgroundColor: '#F3F4F6' }]}>
                      <Shield size={24} color="#9CA3AF" />
                   </View>
                   <Text style={[styles.badgeVaultLabel, { color: '#9CA3AF' }]}>Locked</Text>
                </View>
             </ScrollView>
          </View>

          {/* Section 3 - My Listings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Listings</Text>
            {isLoadingListings ? (
              <ActivityIndicator size="small" color={Colors.accent} style={{ margin: 20 }} />
            ) : myListings.length > 0 ? (
              <View style={styles.gridContainer}>
                {myListings.map(item => (
                  <View key={item.id} style={[styles.gridItem, { maxWidth: `${100 / numColumns}%` }]}>
                    <ListingCard
                      listing={item}
                      sellerName={appUser.full_name}
                      isOwnListing={true}
                      onDelete={() => handleDeleteListing(item.id)}
                      onPress={() => router.push(`/(app)/home/${item.id}`)}
                    />

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
      </View>

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
    width: '100%',
  },
  responsiveWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.primary,
    paddingBottom: 60,
  },
  avatarWrapper: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    position: 'relative',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.accent,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  userName: {
    fontFamily: 'Sora_700Bold',
    fontSize: 22,
    color: '#fff',
    marginBottom: 6,
  },
  studentInfoBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  studentInfoText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: '#fff',
    letterSpacing: 0.5,
  },
  regContainer: {
    width: '85%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  regLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  regValue: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: '#fff',
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
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: Colors.accent,
  },
  badgeScroll: {
    paddingRight: 20,
    gap: 16,
  },
  badgeVaultItem: {
    alignItems: 'center',
    width: 80,
  },
  badgeVaultItemLocked: {
    alignItems: 'center',
    width: 80,
    opacity: 0.6,
  },
  badgeIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  badgeVaultLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: Colors.primary,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
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
