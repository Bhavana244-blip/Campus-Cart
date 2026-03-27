import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Heart, Trash2, Smartphone, Book, Shirt, Sofa, Dribbble, PenTool, Tag } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Listing } from '../../types/app.types';
import { formatDistanceToNow } from 'date-fns';

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
    'Good': Colors.info,
    'Fair': '#F59E0B',
    'Poor': Colors.danger,
  };

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.imageContainer}>
        {listing.images && listing.images.length > 0 ? (
          <Image source={{ uri: listing.images[0] }} style={styles.image} />
        ) : (
          <View style={styles.placeholderContainer}>
            {getCategoryIcon()}
          </View>
        )}
        
        <View style={styles.actionsContainer}>
          {isOwnListing ? (
            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.7} 
              onPress={(e) => {
                if (Platform.OS === 'web') {
                  e.stopPropagation();
                  e.preventDefault();
                }
                onDelete?.();
              }}
            >
              <Trash2 size={16} color={Colors.danger} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.actionButton} 
              activeOpacity={0.7} 
              onPress={(e) => {
                if (Platform.OS === 'web') {
                  e.stopPropagation();
                  e.preventDefault();
                }
                onWishlistToggle?.();
              }}
            >
              <Heart size={16} color={isWishlisted ? Colors.danger : Colors.muted} fill={isWishlisted ? Colors.danger : 'transparent'} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.conditionBadge, { backgroundColor: conditionColors[listing.condition as keyof typeof conditionColors] || Colors.primary }]}>
          <Text style={styles.conditionText}>{listing.condition}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.category} numberOfLines={1}>{listing.category}</Text>
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>
        <Text style={styles.price}>₹ {listing.price.toLocaleString('en-IN')}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.footerText} numberOfLines={1}>{sellerName || 'Anonymous'}</Text>
          <Text style={styles.footerText}> • </Text>
          <Text style={styles.footerText}>{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.tagBackground,
  },
  actionsContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  conditionBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  conditionText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Sora_600SemiBold',
  },
  content: {
    padding: 12,
  },
  category: {
    fontSize: 10,
    fontFamily: 'Sora_600SemiBold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Sora_600SemiBold',
    color: Colors.primary,
    marginBottom: 8,
    lineHeight: 20,
    height: 40,
  },
  price: {
    fontSize: 16,
    fontFamily: 'Sora_700Bold',
    color: Colors.accent,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontFamily: 'Sora_400Regular',
    color: Colors.muted,
  },
});
