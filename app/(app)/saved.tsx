import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView, LayoutAnimation, UIManager, Platform, useWindowDimensions } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useListingsStore } from '../../stores/listingsStore';
import { Colors } from '../../constants/colors';
import ListingCard from '../../components/ui/ListingCard';
import ListingCardSkeleton from '../../components/ui/ListingCardSkeleton';
import EmptyState from '../../components/ui/EmptyState';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SavedScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { appUser } = useAuthStore();
  const { wishlistedIds, setWishlistedIds } = useListingsStore();
  
  const numColumns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedListings = async () => {
    if (!appUser) return;
    setIsLoading(true);
    
    // Fetch wishlist join, embedding the listing and its seller name
    const { data, error } = await supabase
      .from('wishlist')
      .select('listing_id, listings(*, users!inner(full_name))')
      .eq('user_id', appUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Saved feed fetch error:', error.message);
    }
    
    if (data) {
      // Extract the valid listings
      const extractedListings = data
        .map(item => item.listings)
        .filter(listing => listing !== null);
      
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSavedListings(extractedListings);
    }
    setIsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSavedListings();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSavedListings();
  }, [appUser]);

  const toggleWishlist = async (listingId: string) => {
    if (!appUser) return;
    
    const isWishlisted = wishlistedIds.includes(listingId);
    
    if (isWishlisted) {
      // Instantly remove from local store and this screen
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setWishlistedIds(wishlistedIds.filter(id => id !== listingId));
      setSavedListings(prev => prev.filter(item => item.id !== listingId));
      await supabase.from('wishlist').delete().match({ user_id: appUser.id, listing_id: listingId });
    } else {
      // Shouldn't happen on this screen since they shouldn't see unhearted items, but just in case
      setWishlistedIds([...wishlistedIds, listingId]);
      await supabase.from('wishlist').insert({ user_id: appUser.id, listing_id: listingId });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Items</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        key={numColumns}
        data={isLoading && !refreshing ? Array(6).fill({}) : savedListings}
        keyExtractor={(item, index) => item.id || index.toString()}
        numColumns={numColumns}
        columnWrapperStyle={styles.listRow}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={!isLoading ? (
          <EmptyState 
            title="No saved items yet" 
            subtitle="Items you heart will magically appear here." 
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
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderColor: Colors.border,
    backgroundColor: Colors.card
  },
  backButton: { 
    padding: 8, 
    marginLeft: -8, 
    width: 40 
  },
  title: { 
    fontFamily: 'Sora_700Bold', 
    fontSize: 18, 
    color: Colors.primary 
  },
  listContainer: {
    paddingBottom: 100,
    paddingTop: 16,
  },
  listRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});
