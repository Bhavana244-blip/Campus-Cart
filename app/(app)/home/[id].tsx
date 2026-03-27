import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, MapPin, Tag, Star, Clock } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../constants/colors';
import { useAuthStore } from '../../../stores/authStore';
import { useListingsStore } from '../../../stores/listingsStore';
import Avatar from '../../../components/ui/Avatar';
import Toast from '../../../components/ui/Toast';
import { formatDistanceToNow } from 'date-fns';

const { width } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { appUser } = useAuthStore();
  const { wishlistedIds, setWishlistedIds } = useListingsStore();
  
  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*, users(*)')
      .eq('id', id)
      .single();
      
    if (data) {
      setListing(data);
      // Increment view count (fire and forget)
      supabase.rpc('increment_view_count', { listing_id: id }).then();
    }
    setIsLoading(false);
  };

  const toggleWishlistLocally = async (listingId: string) => {
    if (!appUser) return;
    
    const isWishlisted = wishlistedIds.includes(listingId);
    
    if (isWishlisted) {
      setWishlistedIds(wishlistedIds.filter(idx => idx !== listingId));
      await supabase.from('wishlist').delete().match({ user_id: appUser.id, listing_id: listingId });
    } else {
      setWishlistedIds([...wishlistedIds, listingId]);
      await supabase.from('wishlist').insert({ user_id: appUser.id, listing_id: listingId });
    }
  };

  const handleInterested = async () => {
    if (!appUser || !listing) return;
    
    await supabase.from('notifications').insert({
      user_id: listing.seller_id,
      type: 'buy_interest',
      title: 'Someone is interested!',
      body: `${appUser.full_name} wants to buy "${listing.title}"`,
      data: { listing_id: listing.id, buyer_id: appUser.id }
    });
    
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleChat = async () => {
    if (!appUser || !listing) {
      Alert.alert('Error', 'Please log in to chat.');
      return;
    }
    
    setIsChatLoading(true);
    
    try {
      // Step 1: Check if conversation exists
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('buyer_id', appUser.id)
        .eq('seller_id', listing.seller_id)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
        
      // Step 2: If conversation exists → use its ID to navigate
      if (existing?.id) {
        router.push(`/(app)/chats/${existing.id}`);
      } else {
        // Step 3: If no conversation exists → INSERT new row
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            listing_id: listing.id,
            buyer_id: appUser.id,
            seller_id: listing.seller_id
          })
          .select('id')
          .single();
          
        if (createError) throw createError;
          
        // Step 4: Navigate to /chats/{id} using the returned UUID
        if (newConv?.id) {
          router.push(`/(app)/chats/${newConv.id}`);
        }
      }
    } catch (error: any) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', error.message || 'Could not start conversation');
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Listing not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isWishlisted = wishlistedIds.includes(listing.id);
  const isOwner = appUser?.id === listing.seller_id;
  
  const conditionColors = {
    'Like New': Colors.success,
    'Good': Colors.info,
    'Fair': '#F59E0B',
    'Poor': Colors.danger,
  };

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon} onPress={() => toggleWishlistLocally(listing.id)}>
          <Heart size={24} color={isWishlisted ? Colors.danger : Colors.primary} fill={isWishlisted ? Colors.danger : 'transparent'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Images Component */}
        {listing.images && listing.images.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageCarousel}>
            {listing.images.map((img: string, i: number) => (
              <Image key={i} source={{ uri: img }} style={styles.image} />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.imageCarousel, styles.center, { backgroundColor: Colors.tagBackground }]}>
            <Tag size={64} color={Colors.primary} opacity={0.5} />
          </View>
        )}
        
        {listing.is_sold && (
          <View style={styles.soldBanner}>
            <Text style={styles.soldBannerText}>THIS ITEM HAS BEEN SOLD</Text>
          </View>
        )}

        <View style={[styles.detailsContainer, listing.is_sold && styles.detailsContainerSold]}>
          <View style={styles.tagRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{listing.category}</Text>
            </View>
            <View style={[styles.conditionBadge, { backgroundColor: conditionColors[listing.condition as keyof typeof conditionColors] || Colors.primary }]}>
              <Text style={styles.conditionText}>{listing.condition}</Text>
            </View>
          </View>

          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>₹ {listing.price.toLocaleString('en-IN')}</Text>

          <View style={styles.locationRow}>
            <MapPin size={16} color={Colors.muted} />
            <Text style={styles.locationText}>{listing.location}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.sellerCard}>
            <Avatar url={listing.users.avatar_url} name={listing.users.full_name} size={48} />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{listing.users.full_name}</Text>
              <View style={styles.sellerStatsRow}>
                <View style={styles.statItem}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.statText}>{listing.users.rating || 'New'}</Text>
                </View>
                <Text style={styles.dot}>•</Text>
                <View style={styles.statItem}>
                  <Clock size={14} color={Colors.muted} />
                  <Text style={styles.statText}>Posted {formatDistanceToNow(new Date(listing.created_at))} ago</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {!listing.is_sold && (
        <View style={styles.bottomBar}>
          {isOwner ? (
            <TouchableOpacity 
              style={[styles.buyBtn, { backgroundColor: Colors.success }]} 
              onPress={async () => {
                Alert.alert('Mark as Sold', 'Are you sure you want to mark this item as sold?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Mark Sold', onPress: async () => {
                      const { error } = await supabase.from('listings').update({ is_sold: true }).eq('id', listing.id);
                      if (!error) {
                        setListing({ ...listing, is_sold: true });
                        Alert.alert('Success', 'Item marked as sold!');
                      }
                  }}
                ]);
              }}
            >
              <Text style={styles.buyBtnText}>Mark as Sold (Accepted)</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.chatBtn} onPress={handleChat} disabled={isChatLoading}>
                {isChatLoading ? <ActivityIndicator size="small" color={Colors.tagText} /> : <Text style={styles.chatBtnText}>Chat with Seller</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.buyBtn} onPress={handleInterested}>
                <Text style={styles.buyBtnText}>I'm Interested</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <Toast visible={toastVisible} title="Seller Notified!" message="The seller has been notified of your interest." type="success" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageCarousel: {
    width: width,
    height: width,
  },
  image: {
    width: width,
    height: width,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  detailsContainerSold: {
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  soldBanner: {
    backgroundColor: Colors.danger,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldBannerText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: '#fff',
    letterSpacing: 2,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: Colors.tagBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: Colors.tagText,
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  conditionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    color: '#fff',
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: 22,
    color: Colors.primary,
    marginBottom: 8,
  },
  price: {
    fontFamily: 'Sora_700Bold',
    fontSize: 28,
    color: Colors.accent,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  locationText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: Colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  sectionTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: Colors.primary,
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Sora_400Regular',
    fontSize: 15,
    color: Colors.muted,
    lineHeight: 24,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 16,
  },
  sellerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  sellerName: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 4,
  },
  sellerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
  dot: {
    color: Colors.border,
    fontSize: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  chatBtn: {
    flex: 1,
    backgroundColor: Colors.tagBackground,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  chatBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: Colors.tagText,
  },
  buyBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyBtnText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  errorText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 18,
    color: Colors.muted,
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontFamily: 'Sora_600SemiBold',
  },
});
