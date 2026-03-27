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
    fetchConversationData();
    markAsRead();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`messages:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, (payload) => {
        setMessages(prev => [payload.new, ...prev]);
        markAsRead(); // Mark new incoming message as read
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [id]);

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
          // Increment the other user's unread count
          // Wait, we don't know the exact current unread count robustly since it might have changed.
          // In standard logic, just doing `seller_unread_count: conversation.seller_unread_count + 1` is ok for client-side state,
          // but calling an RPC is safer. For now, we update it and fetch will rectify it soon.
          // Because Supabase JS doesn't have an increment operation for updates out of the box without RPC, 
          // we'll fetch the latest conversation data strictly or just rely on local state tracking.
          
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
            
          // Update local conversation state to reflect new unread counts so subsequent messages in same render keep going up if needed
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
            <ArrowLeft size={24} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerProfile}>
            <Avatar name={otherUser?.full_name || 'U'} url={otherUser?.avatar_url} size={40} />
            <View style={styles.headerText}>
              <Text style={styles.headerName}>{otherUser?.full_name || 'Loading...'}</Text>
              <Text style={styles.headerStatus}>SRM KTR Student</Text>
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
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
            <ArrowUp size={20} color="#fff" />
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  headerName: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: Colors.primary,
  },
  headerStatus: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
  messageList: {
    padding: 16,
  },
  messageBubbleContainer: {
    marginBottom: 24,
    maxWidth: '80%',
  },
  messageMeRow: {
    alignSelf: 'flex-end',
  },
  messageOtherRow: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubbleMe: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
  },
  messageText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextOther: {
    color: Colors.primary,
  },
  messageTime: {
    fontFamily: 'Sora_400Regular',
    fontSize: 10,
    color: Colors.muted,
    marginTop: 6,
  },
  messageTimeMe: {
    alignSelf: 'flex-end',
  },
  messageTimeOther: {
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 40,
    maxHeight: 120,
    fontFamily: 'Sora_400Regular',
    fontSize: 15,
    color: Colors.primary,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
