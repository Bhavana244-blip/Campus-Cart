import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../stores/authStore';
import { Colors } from '../../constants/colors';
import Logo from '../../components/ui/Logo';

export default function SplashScreen() {
  const router = useRouter();
  const { session, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(async () => {
      if (session) {
        router.replace('/(app)/home');
      } else {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        if (hasSeenOnboarding === 'true') {
          router.replace('/(auth)/login');
        } else {
          router.replace('/(auth)/onboarding');
        }
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [session, isLoading, router]);

  return (
    <View style={styles.container}>
      <Logo size={64} light={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
