import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, Bell, ShoppingCart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import EmptyState from '../../components/ui/EmptyState';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsScreen() {
  const router = useRouter();
  const { appUser } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (appUser) {
      fetchNotifications();
    }
  }, [appUser]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', appUser?.id)
      .order('created_at', { ascending: false });
    
    if (data) setNotifications(data);
    setIsLoading(false);
  };

  const handleNotificationClick = async (notification: any) => {
    if (notification.type === 'buy_interest' && notification.data) {
      const { listing_id, buyer_id } = notification.data;
      if (!listing_id || !buyer_id || !appUser) return;

      try {
        // Check if conversation exists
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .eq('listing_id', listing_id)
          .eq('buyer_id', buyer_id)
          .eq('seller_id', appUser.id)
          .single();

        if (existing?.id) {
          router.push(`/(app)/chats/${existing.id}`);
        } else {
          // Create new conversation
          const { data: newConv, error } = await supabase
            .from('conversations')
            .insert({
              listing_id,
              buyer_id,
              seller_id: appUser.id
            })
            .select('id')
            .single();
            
          if (error) throw error;
          
          if (newConv?.id) {
            router.push(`/(app)/chats/${newConv.id}`);
          }
        }
      } catch (err: any) {
        Alert.alert('Error', 'Could not open chat. ' + err.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {isLoading ? (
        <View style={[styles.content, { alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.content}>
            <EmptyState title="No notifications" subtitle="You're all caught up!" icon={<Bell size={48} color={Colors.muted} />} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {notifications.map((notif) => (
            <TouchableOpacity 
              key={notif.id} 
              style={[styles.notificationCard, !notif.is_read && styles.unreadCard]}
              onPress={() => handleNotificationClick(notif)}
            >
              <View style={styles.iconContainer}>
                <ShoppingCart size={20} color={Colors.primary} />
              </View>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>{notif.title}</Text>
                <Text style={styles.notificationBody}>{notif.body}</Text>
                <Text style={styles.notificationTime}>{formatDistanceToNow(new Date(notif.created_at))} ago</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  backButton: { padding: 8, marginLeft: -8, width: 40 },
  title: { fontFamily: 'Sora_700Bold', fontSize: 18, color: Colors.primary },
  content: { flex: 1, justifyContent: 'center', paddingVertical: 100 },
  listContainer: { padding: 16 },
  notificationCard: { flexDirection: 'row', padding: 16, backgroundColor: Colors.card, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  unreadCard: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.tagBackground, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  notificationInfo: { flex: 1 },
  notificationTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 16, color: Colors.primary, marginBottom: 4 },
  notificationBody: { fontFamily: 'Sora_400Regular', fontSize: 14, color: Colors.muted, marginBottom: 8 },
  notificationTime: { fontFamily: 'Sora_400Regular', fontSize: 12, color: Colors.muted },
});
