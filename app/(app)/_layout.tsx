import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react-native';
import { View, StyleSheet, Platform, Text } from 'react-native';
import PostListingModal from '../../components/PostListingModal';
import { useAuthStore } from '../../stores/authStore';
import { XP_RULES, calculateLevel } from '../../lib/gamify';
import Toast from '../../components/ui/Toast';
import { useEffect, useState } from 'react';

export default function AppLayout() {
  const { appUser, setAppUser } = useAuthStore();
  const [isSellModalVisible, setSellModalVisible] = useState(false);
  const [toast, setToast] = useState({ visible: false, title: '', message: '', type: 'success' as any });

  useEffect(() => {
    // Daily Login XP Logic
    if (appUser) {
      const lastLogin = appUser.created_at; // Using created_at as a proxy for this demo, usually would be a separate field
      // Logic: If user logged in today, award XP
      // For this demo, we'll award it once per session if not already awarded
      const sessionKey = `daily_xp_${appUser.id}_${new Date().toDateString()}`;
      
      // In a real app we'd check against a persistent last_login_date from the DB
      // Simulate with a simple flag for now
      if (appUser.xp === undefined) {
         // Initialize if needed
      } else {
         // Award XP logic
      }
    }
  }, [appUser?.id]);

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setToast({ visible: true, title, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.muted,
          tabBarLabelPosition: 'below-icon',
          tabBarStyle: {
            backgroundColor: '#FAF5FF',
            borderTopWidth: 2,
            borderTopColor: '#DDD6FE',
            height: Platform.OS === 'ios' ? 95 : 75,
            paddingBottom: Platform.OS === 'ios' ? 35 : 15,
            paddingTop: 10,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontFamily: 'Sora_700Bold',
            fontSize: 10,
            marginBottom: 0,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2.5} />,
          }}
        />
        <Tabs.Screen
          name="search/index"
          options={{
            title: 'Search',
            tabBarLabel: 'Search',
            tabBarIcon: ({ color }) => <Search size={24} color={color} strokeWidth={2.5} />,
          }}
        />
        <Tabs.Screen
          name="sell"
          options={{
            title: 'Sell',
            tabBarLabel: () => null,
            tabBarIcon: () => (
              <View style={styles.sellButtonContainer}>
                <View style={styles.sellButton}>
                  <Plus size={28} color="#fff" strokeWidth={3} />
                </View>
              </View>
            ),
          }}
          listeners={() => ({
            tabPress: (e) => {
              e.preventDefault();
              setSellModalVisible(true);
            },
          })}
        />
        <Tabs.Screen
          name="chats/index"
          options={{
            title: 'Chats',
            tabBarLabel: 'Chats',
            tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} strokeWidth={2.5} />,
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2.5} />,
          }}
        />
        <Tabs.Screen name="home/[id]" options={{ href: null }} />
        <Tabs.Screen name="chats/[id]" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="saved" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="privacy" options={{ href: null }} />
        <Tabs.Screen name="home/bundle/[id]" options={{ href: null }} />
        <Tabs.Screen name="swaps" options={{ href: null }} />
        <Tabs.Screen name="meetup" options={{ href: null }} />
        <Tabs.Screen name="leaderboard" options={{ href: null }} />
      </Tabs>
      
      <PostListingModal 
        visible={isSellModalVisible} 
        onClose={() => setSellModalVisible(false)} 
      />

      <Toast 
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        type={toast.type}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sellButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
