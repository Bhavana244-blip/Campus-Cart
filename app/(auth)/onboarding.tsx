import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingCart, Tag, Zap } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to CampusCart',
    subtitle: 'The exclusive SRM KTR peer-to-peer marketplace.',
    icon: <ShoppingCart size={80} color={Colors.accent} />,
  },
  {
    id: '2',
    title: 'Find Great Deals',
    subtitle: 'Browse and buy items from your classmates.',
    icon: <Tag size={80} color={Colors.accent} />,
  },
  {
    id: '3',
    title: 'Sell in Seconds',
    subtitle: 'List your items instantly for free.',
    icon: <Zap size={80} color={Colors.accent} />,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(auth)/signup/step1');
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.slide}>
        <View style={styles.iconContainer}>
          {slides[currentIndex].icon}
        </View>
        <Text style={styles.title}>{slides[currentIndex].title}</Text>
        <Text style={styles.subtitle}>{slides[currentIndex].subtitle}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : null,
              ]}
            />
          ))}
        </View>

        {currentIndex === slides.length - 1 ? (
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={() => { AsyncStorage.setItem('hasSeenOnboarding', 'true'); router.replace('/(auth)/signup/step1'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => { AsyncStorage.setItem('hasSeenOnboarding', 'true'); router.replace('/(auth)/login'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>I already have an account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.navigation}>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: 24,
    color: Colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 16,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    paddingBottom: 48,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: Colors.accent,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: Colors.muted,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  nextButtonText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  buttonGroup: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: Colors.primary,
  },
});
