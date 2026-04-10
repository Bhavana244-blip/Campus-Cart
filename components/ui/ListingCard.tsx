import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView, LayoutChangeEvent } from 'react-native';
import { Heart, Trash2, Smartphone, Book, Shirt, Sofa, Dribbble, PenTool, Tag } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { formatDistanceToNow } from 'date-fns';
import PressableScale from './PressableScale';

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  images: string[];
  created_at: string;
  is_active: boolean;
  is_sold: boolean;
  semester?: number;
  is_swap_enabled?: boolean;
  swap_wants?: string;
  users?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ListingCardProps {
  listing: Listing;
  sellerName?: string;
  onPress: () => void;
  onWishlistToggle?: () => void;
  isWishlisted?: boolean;
  isOwnListing?: boolean;
  onDelete?: () => void;
}

export default function ListingCard({
  listing,
  sellerName,
  onPress,
  onWishlistToggle,
  isWishlisted,
  isOwnListing,
  onDelete,
}: ListingCardProps) {
  const [cardWidth, setCardWidth] = useState<number>(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== cardWidth) {
      setCardWidth(width);
    }
  };

  const getCategoryIcon = () => {
    const props = { size: 24, color: Colors.primary };
    switch (listing.category) {
      case 'Electronics': return <Smartphone {...props} />;
      case 'Books': return <Book {...props} />;
      case 'Clothing': return <Shirt {...props} />;
      case 'Furniture': return <Sofa {...props} />;
      case 'Sports': return <Dribbble {...props} />;
      case 'Stationery': return <PenTool {...props} />;
      default: return <Tag {...props} />;
    }
  };

  const conditionColors = {
    'Like New': Colors.success,
    'Good': '#3B82F6',
    'Fair': '#F59E0B',
    'Poor': Colors.danger,
  };

  return (
    <PressableScale style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer} onLayout={onLayout}>
        {listing.images && listing.images.length > 0 ? (
          <>
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              style={styles.imageScroll}
              snapToInterval={cardWidth}
              decelerationRate="fast"
              onTouchStart={(e) => {
                if (Platform.OS === 'web') e.stopPropagation();
              }}
            >
              {listing.images.map((img, idx) => (
                <Image 
                  key={idx} 
                  source={{ uri: img }} 
                  style={[styles.image, { width: cardWidth || '100%' }]} 
                />
              ))}
            </ScrollView>
            
            {/* Slide Indicators */}
            {listing.images.length > 1 && (
              <View style={styles.paginationDots}>
                {listing.images.map((_, i) => (
                  <View key={i} style={styles.dot} />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            {getCategoryIcon()}
          </View>
        )}
        
        <View style={styles.actionsContainer}>
          {isOwnListing ? (
            <PressableScale 
              style={styles.actionButton} 
              onPress={(e) => {
                if (Platform.OS === 'web') {
                  e.stopPropagation();
                  e.preventDefault();
                }
                onDelete?.();
              }}
            >
              <Trash2 size={18} color={Colors.danger} />
            </PressableScale>
          ) : (
            <PressableScale 
              style={styles.actionButton} 
              onPress={(e) => {
                if (Platform.OS === 'web') {
                  e.stopPropagation();
                  e.preventDefault();
                }
                onWishlistToggle?.();
              }}
            >
              <Heart size={18} color={isWishlisted ? Colors.danger : Colors.primary} fill={isWishlisted ? Colors.danger : 'transparent'} />
            </PressableScale>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.categoryRow}>
          <Text style={styles.category} numberOfLines={1}>{listing.category}</Text>
          <View style={[styles.conditionChip, { backgroundColor: conditionColors[listing.condition as keyof typeof conditionColors] || Colors.primary }]}>
            <Text style={styles.conditionText}>{listing.condition}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        
        <View style={styles.priceRow}>
           <Text style={styles.price}>₹{listing.price.toLocaleString('en-IN')}</Text>
           {listing.is_swap_enabled && (
             <View style={styles.swapBadge}>
                <Text style={styles.swapText}>SWAP</Text>
             </View>
           )}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText} numberOfLines={1}>{sellerName || 'Anonymous'}</Text>
          <Text style={styles.footerText}> • </Text>
          <Text style={styles.footerText}>{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 0, 
    elevation: 4,
    margin: 6,
    maxWidth: 400,
    minWidth: 160,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.1,
    backgroundColor: '#F5F3FF',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageScroll: {
    flex: 1,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
  },
  actionsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  conditionText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Sora_700Bold',
    textTransform: 'uppercase',
  },
  content: {
    padding: 14,
    backgroundColor: '#fff',
  },
  category: {
    fontSize: 10,
    fontFamily: 'Sora_700Bold',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Sora_600SemiBold',
    color: Colors.text,
    marginBottom: 10,
    lineHeight: 22,
    height: 44,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontFamily: 'Sora_700Bold',
    color: Colors.primary,
  },
  swapBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#166534',
  },
  swapText: {
    fontSize: 9,
    fontFamily: 'Sora_800ExtraBold',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 10,
    fontFamily: 'Sora_400Regular',
    color: Colors.muted,
  },
});
