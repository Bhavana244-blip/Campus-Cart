import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';
import PostListingModal from '../../components/PostListingModal';

export default function AppLayout() {
  const [isSellModalVisible, setSellModalVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.muted,
          tabBarStyle: {
            backgroundColor: Colors.card,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            height: Platform.OS === 'ios' ? 88 : 64,
            paddingBottom: Platform.OS === 'ios' ? 28 : 10,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontFamily: 'Sora_600SemiBold',
            fontSize: 10,
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
      </Tabs>
      
      <PostListingModal 
        visible={isSellModalVisible} 
        onClose={() => setSellModalVisible(false)} 
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
