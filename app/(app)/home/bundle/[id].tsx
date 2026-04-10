import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, Heart, Package, ShoppingBag, ShieldCheck } from 'lucide-react-native';
import { supabase } from '../../../../lib/supabase';
import { Colors } from '../../../../constants/colors';
import Avatar from '../../../../components/ui/Avatar';

const { width } = Dimensions.get('window');

export default function BundleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [bundle, setBundle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBundle();
  }, [id]);

  const fetchBundle = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('bundles')
      .select('*, users(*), bundle_items(*, listings(*))')
      .eq('id', id)
      .single();

    if (data) setBundle(data);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!bundle) {
    return (
      <View style={styles.center}>
        <Text>Bundle not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Image Header */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: bundle.images[0] }} style={styles.image} />
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
              <ArrowLeft size={20} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton}>
                <Share2 size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Heart size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <View style={styles.bundleBadge}>
              <Package size={14} color="#fff" />
              <Text style={styles.bundleBadgeText}>COMBO BUNDLE</Text>
            </View>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>SAVE ₹{bundle.savings}</Text>
            </View>
          </View>

          <Text style={styles.title}>{bundle.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{bundle.bundle_price}</Text>
            <Text style={styles.originalPrice}>₹{bundle.bundle_price + bundle.savings}</Text>
          </View>

          <Text style={styles.description}>{bundle.description}</Text>

          {/* Seller Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            <TouchableOpacity style={styles.sellerCard}>
              <Avatar name={bundle.users?.full_name} url={bundle.users?.avatar_url} size={48} />
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{bundle.users?.full_name}</Text>
                <Text style={styles.sellerDetails}>{bundle.users?.department} • Year {bundle.users?.year}</Text>
              </View>
              <ShieldCheck size={20} color={Colors.success} />
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items in this Bundle</Text>
            {bundle.bundle_items?.map((item: any) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.itemRow}
                onPress={() => router.push(`/(app)/home/${item.listings.id}`)}
              >
                <Image source={{ uri: item.listings.images[0] }} style={styles.itemThumb} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.listings.title}</Text>
                  <Text style={styles.itemPrice}>Individual: ₹{item.listings.price}</Text>
                </View>
                <ShoppingBag size={18} color={Colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.chatBtn}>
          <Text style={styles.chatBtnText}>Chat with Seller</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.buyBtn, { backgroundColor: Colors.primary }]}>
          <Text style={styles.buyBtnText}>Reserve Bundle</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: width,
    height: width * 0.9,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerActions: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
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
  content: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  bundleBadge: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  bundleBadgeText: {
    color: '#fff',
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
  },
  savingsBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    color: '#166534',
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: 24,
    color: Colors.primary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 16,
  },
  price: {
    fontFamily: 'Sora_700Bold',
    fontSize: 28,
    color: Colors.accent,
  },
  originalPrice: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: Colors.muted,
    textDecorationLine: 'line-through',
  },
  description: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 22,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 16,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF0F7',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: Colors.primary,
  },
  sellerDetails: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 14,
    color: Colors.primary,
  },
  itemPrice: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
  },
  chatBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: Colors.primary,
  },
  buyBtn: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: '#fff',
  },
});
