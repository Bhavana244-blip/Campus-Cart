import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ListingCardSkeleton() {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.imageSkeleton, { opacity }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.lineBadge, { opacity }]} />
        <Animated.View style={[styles.lineTitle, { opacity }]} />
        <Animated.View style={[styles.lineTitleShort, { opacity }]} />
        <Animated.View style={[styles.linePrice, { opacity }]} />
        <Animated.View style={[styles.lineFooter, { opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 400,
    minWidth: 160,
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    margin: 6,
  },
  imageSkeleton: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.border,
  },
  content: {
    padding: 12,
  },
  lineBadge: {
    width: 60,
    height: 12,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  lineTitle: {
    width: '100%',
    height: 14,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginBottom: 6,
  },
  lineTitleShort: {
    width: '60%',
    height: 14,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  linePrice: {
    width: 80,
    height: 18,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  lineFooter: {
    width: 100,
    height: 10,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
});
