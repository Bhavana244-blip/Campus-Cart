import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Colors } from '../../constants/colors';
import { ChevronRight, Percent, Package, Sparkles } from 'lucide-react-native';

interface BundleCardProps {
  bundle: any;
  onPress: () => void;
}

export default function BundleCard({ bundle, onPress }: BundleCardProps) {
  const savingsPercent = Math.round((bundle.savings / (bundle.bundle_price + bundle.savings)) * 100);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: bundle.images[0] }}
          style={styles.image}
        />
        <View style={styles.savingsBadge}>
          <Percent size={12} color="#fff" strokeWidth={3} />
          <Text style={styles.savingsText}>{savingsPercent}% OFF</Text>
        </View>
        
        <View style={styles.featuredTag}>
           <Sparkles size={10} color="#fff" />
           <Text style={styles.featuredText}>STUDENT PICK</Text>
        </View>

        <View style={styles.itemsCount}>
          <Package size={12} color={Colors.primary} strokeWidth={2.5} />
          <Text style={styles.itemsCountText}>{bundle.item_count || 0} ITEMS</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{bundle.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{bundle.description}</Text>
        
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>₹{bundle.bundle_price}</Text>
            <Text style={styles.originalPrice}>₹{bundle.bundle_price + bundle.savings}</Text>
          </View>
          <View style={styles.actionButton}>
            <ChevronRight size={22} color="#fff" strokeWidth={3} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '48%',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 4,
    margin: 4,
  },
  imageContainer: {
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF5FF',
  },
  savingsBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#166534',
    gap: 4,
    zIndex: 10,
  },
  savingsText: {
    color: '#fff',
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
  },
  featuredTag: {
    position: 'absolute',
    top: 14,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'Sora_700Bold',
    letterSpacing: 0.5,
  },
  itemsCount: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: 6,
  },
  itemsCountText: {
    color: Colors.primary,
    fontFamily: 'Sora_700Bold',
    fontSize: 9,
  },
  content: {
    padding: 14,
    backgroundColor: '#fff',
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
    color: Colors.text,
    marginBottom: 6,
  },
  description: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginBottom: 14,
    lineHeight: 16,
    height: 32,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  price: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    color: Colors.primary,
  },
  originalPrice: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: Colors.muted,
    textDecorationLine: 'line-through',
    marginTop: -2,
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
