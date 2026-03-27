import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { Colors } from '../../../constants/colors';
import Avatar from '../../../components/ui/Avatar';
import EmptyState from '../../../components/ui/EmptyState';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react-native';

export default function ChatsListScreen() {
  const router = useRouter();
  const { appUser } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (appUser) {
      fetchConversations();
      
      const channel = supabase
        .channel('conversations-updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `buyer_id=eq.${appUser.id}`,
        }, fetchConversations)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `seller_id=eq.${appUser.id}`,
        }, fetchConversations)
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [appUser]);

  const fetchConversations = async () => {
    if (!appUser) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, buyer:users!buyer_id(*), seller:users!seller_id(*)')
        .or(`buyer_id.eq.${appUser.id},seller_id.eq.${appUser.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error.message);
        return;
      }

      if (data) {
        setConversations(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isBuyer = appUser?.id === item.buyer_id;
    const otherUser = isBuyer ? item.seller : item.buyer;
    const unreadCount = isBuyer ? item.buyer_unread_count : item.seller_unread_count;

    return (
      <TouchableOpacity 
        style={styles.conversationItem} 
        onPress={() => router.push(`/(app)/chats/${item.id}`)}
      >
        <Avatar name={otherUser?.full_name || 'User'} url={otherUser?.avatar_url} size={50} />
        
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.name} numberOfLines={1}>{otherUser?.full_name}</Text>
            {item.last_message_at && (
              <Text style={styles.time}>{formatDistanceToNow(new Date(item.last_message_at), { addSuffix: true })}</Text>
            )}
          </View>
          
          <View style={styles.messageRow}>
            <Text style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageUnread]} numberOfLines={1}>
              {item.last_message || 'Start a conversation'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <EmptyState 
              title="No messages yet" 
              subtitle="When you contact a seller or someone contacts you, the chat will appear here." 
              icon={<MessageCircle size={48} color={Colors.muted} />}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: 24,
    color: Colors.primary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 16,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: Colors.primary,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: Colors.muted,
    flex: 1,
    marginRight: 16,
  },
  lastMessageUnread: {
    fontFamily: 'Sora_600SemiBold',
    color: Colors.primary,
  },
  unreadBadge: {
    backgroundColor: Colors.accent,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Sora_700Bold',
  },
});
