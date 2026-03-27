import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { useFonts, Sora_400Regular, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';

export default function RootLayout() {
  const { session, isLoading, setSession, setUser, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  const fetchAppUser = async (authUserId: string) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('auth_user_id', authUserId).maybeSingle();
      if (error) {
        console.error('Error fetching app user:', error.message);
      } else if (data) {
        useAuthStore.getState().setAppUser(data);
      } else {
        // No profile found, set appUser to null but don't error
        console.warn('No app user profile found forauth ID:', authUserId);
        useAuthStore.getState().setAppUser(null);
      }
    } catch (e) {
      console.error('Unexpected error fetching app user:', e);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) fetchAppUser(session.user.id);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        fetchAppUser(session.user.id);
      } else {
        useAuthStore.getState().setAppUser(null);
      }
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      router.replace('/(auth)/splash');
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace('/(app)/home');
    }
  }, [session, segments, isLoading]);

  if (!fontsLoaded) {
    return null; /* Or an empty View */
  }

  return <Slot />;
}
