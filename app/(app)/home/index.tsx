import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView, LayoutAnimation, UIManager, Platform, Alert, useWindowDimensions, Animated } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useRouter } from 'expo-router';
import { Bell, Search } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { useListingsStore } from '../../../stores/listingsStore';
import { Colors } from '../../../constants/colors';
import { CATEGORIES } from '../../../constants/categories';
import Avatar from '../../../components/ui/Avatar';
import CategoryChip from '../../../components/ui/CategoryChip';
import ListingCard from '../../../components/ui/ListingCard';
import BundleCard from '../../../components/ui/BundleCard';
import SemesterPicker from '../../../components/ui/SemesterPicker';
import ListingCardSkeleton from '../../../components/ui/ListingCardSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Logo from '../../../components/ui/Logo';
import { Sparkles } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { appUser } = useAuthStore();
  const { listings, isLoading, setListings, setLoading, wishlistedIds, setWishlistedIds } = useListingsStore();
  
  const tabAnim = useRef(new Animated.Value(0)).current;
  
  const numColumns = width >= 1200 ? 5 : width >= 992 ? 4 : width >= 768 ? 3 : 2;
  const [activeTab, setActiveTab] = useState<'Items' | 'Bundles'>('Items');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [juniorPriority, setJuniorPriority] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bundles, setBundles] = useState<any[]>([]);

  const fetchListings = async () => {
    setLoading(true);
    
    if (activeTab === 'Bundles') {
      const { data: bData, error: bError } = await supabase
        .from('bundles')
        .select('*, users!inner(full_name)')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });
        
      if (bData) setBundles(bData as any);
      setLoading(false);
      return;
    }

    let query = supabase
      .from('listings')
      .select('*, users!inner(full_name)')
      .eq('is_active', true)
      .eq('is_sold', false);

    if (activeCategory !== 'All') {
      query = query.eq('category', activeCategory);
    }

    if (selectedSemester) {
      query = query.eq('semester', selectedSemester);
    }

    if (juniorPriority && appUser?.year) {
      // Junior Priority: Show items from older students (Year > current)
      const currentYear = parseInt(appUser.year);
      if (!isNaN(currentYear)) {
          query = query.gt('users.year', currentYear.toString());
      }
    }

    query = query.order('created_at', { ascending: false }).limit(20);

    const { data, error } = await query;
    if (error) {
      console.error('Home feed fetch error:', error.message);
      // Fallback: if semester col is missing, retry without it
      if (error.message.includes('column listings.semester does not exist')) {
        console.warn('DB MIGRATION NEEDED: Please run 20260403_phase2_upgrade.sql in Supabase SQL editor.');
        const fallbackQuery = supabase
          .from('listings')
          .select('*, users!inner(full_name)')
          .eq('is_active', true)
          .eq('is_sold', false)
          .order('created_at', { ascending: false })
          .limit(20);
        
        const { data: fData, error: fError } = await fallbackQuery;
        if (fData) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setListings(fData as any);
        }
      }
    }
    if (data) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setListings(data as any);
    }
    setLoading(false);
  };

  const fetchWishlistAndNotifs = async () => {
    if (!appUser?.id) return;
    
    // Wishlist
    const { data: wlData } = await supabase
      .from('wishlist')
      .select('listing_id')
      .eq('user_id', appUser.id);
    
    if (wlData) setWishlistedIds(wlData.map(w => w.listing_id));

    // Notifications
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', appUser.id)
      .eq('is_read', false);
      
    setUnreadCount(count || 0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchListings(), fetchWishlistAndNotifs()]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (appUser?.id) {
      fetchListings();
      fetchWishlistAndNotifs();
    }
    
    // Animate Tab Slider
    Animated.spring(tabAnim, {
      toValue: activeTab === 'Items' ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, [activeCategory, activeTab, selectedSemester, juniorPriority, appUser]);

  const toggleWishlist = async (listingId: string) => {
    if (!appUser) return;
    
    const isWishlisted = wishlistedIds.includes(listingId);
    
    if (isWishlisted) {
      setWishlistedIds(wishlistedIds.filter(id => id !== listingId));
      await supabase.from('wishlist').delete().match({ user_id: appUser.id, listing_id: listingId });
    } else {
      setWishlistedIds([...wishlistedIds, listingId]);
      await supabase.from('wishlist').insert({ user_id: appUser.id, listing_id: listingId });
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    const proceed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to delete this listing?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Delete Listing',
            'Are you sure you want to delete this listing?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });

    if (proceed) {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);
        
      if (!error) {
        if (Platform.OS !== 'web') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setListings(listings.filter((item: any) => item.id !== listingId));
      } else {
        if (Platform.OS === 'web') alert('Failed to delete listing.');
        else Alert.alert('Error', 'Failed to delete listing.');
      }
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Logo size={22} />
          <Text style={styles.greeting}>Hey {appUser?.full_name?.split(' ')[0]}! Find what you need. 🚀</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.bellButton} onPress={() => router.push('/(app)/notifications')}>
            <Bell size={24} color={Colors.primary} />
            {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>}
          </TouchableOpacity>
          <Avatar name={appUser?.full_name || 'U'} url={appUser?.avatar_url} size={42} />
        </View>
      </View>

      {/* Extraordinary Search Bar */}
      <TouchableOpacity style={styles.heroSearch} onPress={() => router.push('/(app)/search')}>
        <Search size={22} color={Colors.primary} strokeWidth={2.5} />
        <Text style={styles.heroSearchText}>Search anything on SRM campus...</Text>
      </TouchableOpacity>
      
      <View style={styles.tabBar}>
        <Animated.View style={[styles.tabSlider, { 
          width: '50%',
          transform: [{ 
            translateX: tabAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, (width - 40) / 2] 
            }) 
          }] 
        }]} />
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => setActiveTab('Items')}
        >
          <Text style={[styles.tabText, activeTab === 'Items' && styles.tabTextActive]}>Items</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => setActiveTab('Bundles')}
        >
          <Text style={[styles.tabText, activeTab === 'Bundles' && styles.tabTextActive]}>Bundles</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterHeader}>
        <View>
          <Text style={styles.sectionTitle}>{activeTab === 'Items' ? 'Campus Essentials' : 'Big Bundles 🔥'}</Text>
          <Text style={styles.sectionSubtitle}>{activeTab === 'Items' ? 'Curated items from your peers' : 'Save more with student packs'}</Text>
        </View>
        {activeTab === 'Items' && (
          <TouchableOpacity 
            style={[styles.boostToggle, juniorPriority && styles.boostToggleActive]}
            onPress={() => setJuniorPriority(!juniorPriority)}
          >
            <Sparkles size={14} color={juniorPriority ? '#fff' : Colors.primary} />
            <Text style={[styles.boostToggleText, juniorPriority && styles.boostToggleTextActive]}>Junior Boost</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {activeTab === 'Items' ? (
        <>
          <FlatList
            horizontal
            data={['All', ...CATEGORIES]}
            keyExtractor={(item) => `cat_${item}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
            renderItem={({ item }) => (
              <CategoryChip 
                label={item} 
                isSelected={activeCategory === item} 
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setActiveCategory(item);
                }} 
              />
            )}
          />
          <View style={styles.semesterSection}>
             <Text style={styles.sectionTitleSmall}>Filter by Semester</Text>
             <SemesterPicker 
               selectedSemester={selectedSemester} 
               onSelect={setSelectedSemester} 
             />
          </View>
        </>
      ) : (
        <View style={{ marginBottom: 16 }} />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.responsiveWrapper}>
        <FlatList
          key={numColumns}
          data={isLoading && !refreshing ? Array(6).fill({}) : (activeTab === 'Items' ? listings : bundles)}
          keyExtractor={(item, index) => item.id || index.toString()}
          numColumns={numColumns}
          columnWrapperStyle={styles.listRow}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={!isLoading ? (
            <EmptyState 
              title="No listings found" 
              subtitle={`There are no items in this filter yet.`} 
            />
          ) : null}
          renderItem={({ item, index }) => {
            if (isLoading && !refreshing) return <ListingCardSkeleton />;
            
            if (activeTab === 'Bundles') {
              return (
                <BundleCard 
                  bundle={item} 
                  onPress={() => router.push(`/(app)/home/bundle/${item.id}`)} 
                />
              );
            }

            const entranceAnim = new Animated.Value(0);
            Animated.timing(entranceAnim, {
              toValue: 1,
              duration: 400,
              delay: index * 100,
              useNativeDriver: true
            }).start();

            return (
              <Animated.View style={{ flex: 1, maxWidth: `${100 / numColumns}%`, opacity: entranceAnim, transform: [{ translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                <ListingCard
                  listing={item}
                  sellerName={item.users?.full_name}
                  onPress={() => router.push(`/(app)/home/${item.id}`)}
                  isWishlisted={wishlistedIds.includes(item.id)}
                  onWishlistToggle={() => toggleWishlist(item.id)}
                  isOwnListing={appUser?.id === item.seller_id}
                  onDelete={() => handleDeleteListing(item.id)}
                />
              </Animated.View>
            );
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContainer: {
    paddingBottom: 100,
    width: '100%',
  },
  responsiveWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
    backgroundColor: Colors.background,
  },
  listRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  greeting: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: Colors.muted,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bellButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.danger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Sora_700Bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    gap: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#EDE9FE',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: '#6D6E9C',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabSlider: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    zIndex: -1,
  },
  heroSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: 24,
    gap: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  heroSearchText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 15,
    color: Colors.muted,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  boostToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FAF5FF',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  boostToggleActive: {
    backgroundColor: Colors.primary,
  },
  boostToggleText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: Colors.primary,
  },
  boostToggleTextActive: {
    color: '#fff',
  },
  semesterSection: {
    marginTop: 0,
  },
  sectionTitleSmall: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: Colors.text,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  searchText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: Colors.muted,
  },
  promoBanner: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  categoriesContainer: {
    paddingBottom: 16,
  },
});
