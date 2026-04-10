import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowUp } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { Colors } from '../../../constants/colors';
import Avatar from '../../../components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { appUser } = useAuthStore();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);

  useEffect(() => {
    if (appUser?.id) {
      fetchConversationData();
      markAsRead();

      // Subscribe to new messages via Supabase Realtime
      const messageChannel = supabase
        .channel(`messages:${id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        }, (payload) => {
          setMessages(prev => [payload.new, ...prev]);
          markAsRead();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(messageChannel);
      };
    }
  }, [id, appUser]);

  const fetchConversationData = async () => {
    const { data: convData } = await supabase
      .from('conversations')
      .select('*, buyer:users!buyer_id(*), seller:users!seller_id(*)')
      .eq('id', id)
      .single();

    if (convData) {
      setConversation(convData);
      const other = appUser?.id === convData.buyer_id ? convData.seller : convData.buyer;
      setOtherUser(other);
    }

    const { data: msgData } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: false });

    if (msgData) {
      setMessages(msgData);
    }
  };

  const markAsRead = async () => {
    if (!appUser) return;

    // We do two things: update 'is_read' on messages, and reset unread_count on conversation
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', id)
      .neq('sender_id', appUser.id)
      .eq('is_read', false);

    if (conversation) {
      const isBuyer = appUser.id === conversation.buyer_id;
      const updateData = isBuyer ? { buyer_unread_count: 0 } : { seller_unread_count: 0 };
      
      await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', id);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !appUser || isSending) return;
    
    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText(''); // optimistic clear
    
    const tempId = Math.random().toString();
    const optimisticMsg = {
      id: tempId,
      conversation_id: id,
      sender_id: appUser.id,
      content: textToSend,
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    // Add optimistically so UI feels instantly fast
    setMessages(prev => [optimisticMsg, ...prev]);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          sender_id: appUser.id,
          content: textToSend,
        });

      if (error) {
        // If it failed, remove the optimistic message
        setMessages(prev => prev.filter(m => m.id !== tempId));
        throw error;
      }
      
      if (conversation) {
        const isBuyer = appUser.id === conversation.buyer_id;
        
        try {
          await supabase
            .from('conversations')
            .update({
              last_message: textToSend,
              last_message_at: new Date().toISOString(),
              ...(isBuyer 
                ? { seller_unread_count: (conversation.seller_unread_count || 0) + 1 } 
                : { buyer_unread_count: (conversation.buyer_unread_count || 0) + 1 })
            })
            .eq('id', id);
            
          setConversation((prev: any) => ({
             ...prev,
             ...(isBuyer 
                ? { seller_unread_count: (prev.seller_unread_count || 0) + 1 } 
                : { buyer_unread_count: (prev.buyer_unread_count || 0) + 1 })
          }));
        } catch (updateErr) {
          console.error("Failed to update conversation:", updateErr);
        }
      }
      
    } catch (e) {
      setInputText(textToSend); // revert on failure
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === appUser?.id;

    return (
      <View style={[styles.messageBubbleContainer, isMe ? styles.messageMeRow : styles.messageOtherRow]}>
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.content}
          </Text>
        </View>
        <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeOther]}>
          {formatDistanceToNow(new Date(item.created_at))} ago
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(app)/chats')}>
            <ArrowLeft size={24} color={Colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.headerProfile}>
            <Avatar name={otherUser?.full_name || 'U'} url={otherUser?.avatar_url} size={44} />
            <View style={styles.headerText}>
              <Text style={styles.headerName}>{otherUser?.full_name || 'Loading...'}</Text>
              <Text style={styles.headerStatus}>SRM KTR Student • Online</Text>
            </View>
          </View>
        </View>

        {/* Message List */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Area */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Start a campus deal..."
              placeholderTextColor="#9EA0C1"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]} 
              onPress={sendMessage}
              disabled={!inputText.trim() || isSending}
            >
              <ArrowUp size={22} color="#fff" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 3,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#DDD6FE',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 14,
  },
  headerName: {
    fontFamily: 'Sora_700Bold',
    fontSize: 17,
    color: '#1E1B4B',
  },
  headerStatus: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: '#22C55E', // Green for online
  },
  messageList: {
    padding: 20,
    paddingBottom: 40,
  },
  messageBubbleContainer: {
    marginBottom: 20,
    maxWidth: '85%',
  },
  messageMeRow: {
    alignSelf: 'flex-end',
  },
  messageOtherRow: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  messageBubbleMe: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
    borderWidth: 2,
    borderColor: '#6D28D9',
  },
  messageBubbleOther: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#DDD6FE',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 20,
  },
  messageText: {
    fontFamily: 'Sora_500Medium',
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#1E1B4B',
  },
  messageTime: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
    color: '#9EA0C1',
    marginTop: 8,
  },
  messageTimeMe: {
    alignSelf: 'flex-end',
  },
  messageTimeOther: {
    alignSelf: 'flex-start',
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 3,
    borderTopColor: '#F3F4F6',
    paddingBottom: Platform.OS === 'ios' ? 95 : 75, // Lift above TabBar
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#FAF5FF',
    borderWidth: 2,
    borderColor: '#DDD6FE',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 48,
    maxHeight: 120,
    fontFamily: 'Sora_400Regular',
    fontSize: 15,
    color: '#1E1B4B',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.accent, // Transaction Green
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
});
