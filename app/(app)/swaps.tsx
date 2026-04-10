import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRightLeft, Clock, CheckCircle2, XCircle } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Colors } from '../../constants/colors';

export default function SwapOffersScreen() {
  const router = useRouter();
  const { appUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'RECEIVED' | 'SENT'>('RECEIVED');
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, [activeTab, appUser]);

  const fetchOffers = async () => {
    if (!appUser) return;
    setIsLoading(true);
    
    let query = supabase
      .from('swap_offers')
      .select('*, requester:users!requester_id(*), receiver:users!receiver_id(*), target:listings!target_listing_id(*), offered:listings!offered_listing_id(*)');

    if (activeTab === 'RECEIVED') {
      query = query.eq('receiver_id', appUser.id);
    } else {
      query = query.eq('requester_id', appUser.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (data) setOffers(data);
    setIsLoading(false);
  };

  const handleUpdateStatus = async (offerId: string, status: string) => {
    const { error } = await supabase
      .from('swap_offers')
      .update({ status })
      .eq('id', offerId);

    if (!error) {
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status } : o));
    }
  };

  const renderOffer = ({ item }: { item: any }) => {
    const isReceived = activeTab === 'RECEIVED';
    const statusColor = item.status === 'ACCEPTED' ? Colors.success : item.status === 'REJECTED' ? Colors.danger : Colors.muted;

    return (
      <View style={styles.offerCard}>
        <View style={styles.offerHeader}>
          <View style={styles.statusBadge}>
            {item.status === 'PENDING' && <Clock size={12} color={Colors.muted} />}
            {item.status === 'ACCEPTED' && <CheckCircle2 size={12} color={Colors.success} />}
            {item.status === 'REJECTED' && <XCircle size={12} color={Colors.danger} />}
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
          <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>

        <View style={styles.swapVisual}>
          <View style={styles.itemBox}>
            <Image source={{ uri: item.target?.images[0] }} style={styles.itemImage} />
            <Text style={styles.itemLabel} numberOfLines={1}>{item.target?.title}</Text>
            <Text style={styles.itemOwner}>{isReceived ? 'Your Item' : `${item.receiver?.full_name}'s`}</Text>
          </View>
          
          <ArrowRightLeft size={24} color={Colors.primary} />

          <View style={styles.itemBox}>
            <Image source={{ uri: item.offered?.images[0] }} style={styles.itemImage} />
            <Text style={styles.itemLabel} numberOfLines={1}>{item.offered?.title}</Text>
            <Text style={styles.itemOwner}>{!isReceived ? 'Your Item' : `${item.requester?.full_name}'s`}</Text>
          </View>
        </View>

        {item.message && (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>"{item.message}"</Text>
          </View>
        )}

        {isReceived && item.status === 'PENDING' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.rejectBtn]} 
              onPress={() => handleUpdateStatus(item.id, 'REJECTED')}
            >
              <Text style={styles.rejectBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.acceptBtn]} 
              onPress={() => handleUpdateStatus(item.id, 'ACCEPTED')}
            >
              <Text style={styles.acceptBtnText}>Accept Swap</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barter & Swaps</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'RECEIVED' && styles.tabActive]}
          onPress={() => setActiveTab('RECEIVED')}
        >
          <Text style={[styles.tabText, activeTab === 'RECEIVED' && styles.tabTextActive]}>Received</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'SENT' && styles.tabActive]}
          onPress={() => setActiveTab('SENT')}
        >
          <Text style={[styles.tabText, activeTab === 'SENT' && styles.tabTextActive]}>Sent</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item.id}
          renderItem={renderOffer}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ArrowRightLeft size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>No Swap Offers</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'RECEIVED' 
                  ? "You haven't received any swap requests yet." 
                  : "You haven't sent any swap offers yet."}
              </Text>
            </View>
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
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    color: Colors.primary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: Colors.muted,
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  dateText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
  swapVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  itemBox: {
    flex: 1,
    alignItems: 'center',
  },
  itemImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  itemLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: Colors.primary,
    textAlign: 'center',
  },
  itemOwner: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  messageBox: {
    backgroundColor: '#F8F9FE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  messageText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
    color: Colors.muted,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rejectBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: Colors.muted,
  },
  acceptBtn: {
    backgroundColor: Colors.primary,
  },
  acceptBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    color: Colors.primary,
    marginTop: 24,
  },
  emptySubtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
