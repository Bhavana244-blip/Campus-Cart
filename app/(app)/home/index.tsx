import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView, LayoutAnimation, UIManager, Platform, Alert, useWindowDimensions } from 'react-native';

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
import ListingCardSkeleton from '../../../components/ui/ListingCardSkeleton';
import EmptyState from '../../../components/ui/EmptyState';
import Logo from '../../../components/ui/Logo';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { appUser } = useAuthStore();
  const { listings, isLoading, setListings, setLoading, wishlistedIds, setWishlistedIds } = useListingsStore();
  
  const numColumns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
  const [activeCategory, setActiveCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('*, users!inner(full_name)')
      .eq('is_active', true)
      .eq('is_sold', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (activeCategory !== 'All') {
      query = query.eq('category', activeCategory);
    }

    // We no longer filter out the user's own listings
    // so that you can see your own posts on the timeline for testing
    // if (appUser?.id) {
    //   query = query.neq('seller_id', appUser.id);
    // }

    const { data, error } = await query;
    if (error) {
      console.error('Home feed fetch error:', error.message);
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
  }, [activeCategory, appUser]);

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
          <Logo size={20} />
          <Text style={styles.greeting}>Good morning, {appUser?.full_name?.split(' ')[0]}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.bellButton} onPress={() => router.push('/(app)/notifications')}>
            <Bell size={24} color={Colors.primary} />
            {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>}
          </TouchableOpacity>
          <Avatar name={appUser?.full_name || 'U'} url={appUser?.avatar_url} size={40} />
        </View>
      </View>
      
      <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(app)/search')}>
        <Search size={20} color={Colors.muted} />
        <Text style={styles.searchText}>Search items, categories...</Text>
      </TouchableOpacity>
      
      <View style={styles.promoBanner}>
        <View style={styles.promoContent}>
          <Text style={styles.promoTitle}>Have something to sell?</Text>
          <Text style={styles.promoSubtitle}>List it for free to campus students</Text>
        </View>
      </View>
      
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
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
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        key={numColumns}
        data={isLoading && !refreshing ? Array(6).fill({}) : listings}
        keyExtractor={(item, index) => item.id || index.toString()}
        numColumns={numColumns}
        columnWrapperStyle={styles.listRow}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? (
          <EmptyState 
            title="No listings found" 
            subtitle={`There are no items in ${activeCategory} yet.`} 
          />
        ) : null}
        renderItem={({ item, index }) => {
          if (isLoading && !refreshing) return <ListingCardSkeleton />;
          return (
            <ListingCard
              listing={item}
              sellerName={item.users?.full_name}
              onPress={() => router.push(`/(app)/home/${item.id}`)}
              isWishlisted={wishlistedIds.includes(item.id)}
              onWishlistToggle={() => toggleWishlist(item.id)}
              isOwnListing={appUser?.id === item.seller_id}
              onDelete={() => handleDeleteListing(item.id)}
            />
          );
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      />
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
