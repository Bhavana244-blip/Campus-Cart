import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Dimensions, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trophy, Zap, Crown } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import Avatar from '../../components/ui/Avatar';
import { getRankInfo } from '../../lib/gamify';
import PressableScale from '../../components/ui/PressableScale';

const { width } = Dimensions.get('window');

export default function LeaderboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'KTR' | 'DEPT'>('KTR');
  const [rankings, setRankings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const podiumAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchRankings();
  }, [activeTab]);

  const fetchRankings = async () => {
    setIsLoading(true);
    // In a real app, we'd join with users. For now, fetch from users table directly
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('xp', { ascending: false })
      .limit(20);

    if (data) {
      setRankings(data);
    } else {
      // Mock data if table isn't updated yet
      setRankings([
        { id: '1', full_name: 'Priya Sharma', xp: 2450, level: 21, department: 'CSE' },
        { id: '2', full_name: 'Rahul Verma', xp: 1890, level: 16, department: 'ECE' },
        { id: '3', full_name: 'Ananya Iyer', xp: 1420, level: 12, department: 'MECH' },
        { id: '4', full_name: 'Vikram Singh', xp: 980, level: 8, department: 'CIVIL' },
        { id: '5', full_name: 'Sneha Reddy', xp: 450, level: 3, department: 'IT' },
      ]);
    }
    setIsLoading(false);
    
    // Animate Podiums
    Animated.spring(podiumAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 45,
      delay: 300,
    }).start();
  };

  const renderRankItem = ({ item, index }: { item: any, index: number }) => {
    const rank = getRankInfo(item.level || 1);
    
    return (
      <PressableScale style={styles.rankRow} onPress={() => router.push(`/(app)/profile`)}>
        <View style={styles.rankNumberContainer}>
           <Text style={styles.rankNumber}>{index + 1}</Text>
        </View>

        <Avatar name={item.full_name} url={item.avatar_url} size={48} level={item.level || 1} />
        
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{item.full_name}</Text>
          <View style={styles.badgeRow}>
             <Text style={[styles.userSub, { color: rank.color }]}>{rank.title}</Text>
             <Text style={styles.dot}>•</Text>
             <Text style={styles.userSub}>{item.department || 'Student'}</Text>
          </View>
        </View>

        <View style={styles.xpInfo}>
          <Text style={styles.xpValue}>{item.xp || 0}</Text>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
      </PressableScale>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dynamic Background Header */}
      <View style={styles.headerBackground}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Campus Legends</Text>
          <TouchableOpacity style={styles.infoBtn}>
            <Zap size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Podium Section */}
        {!isLoading && rankings.length >= 3 && (
          <View style={styles.podium}>
            {/* 2nd Place */}
            <Animated.View style={[styles.podiumItem, { 
              marginTop: 30, 
              opacity: podiumAnim, 
              transform: [{ translateY: podiumAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] 
            }]}>
              <Avatar name={rankings[1].full_name} url={rankings[1].avatar_url} size={64} level={rankings[1].level} />
              <View style={[styles.podiumBadge, { backgroundColor: '#94A3B8' }]}>
                <Text style={styles.podiumRankText}>2</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{rankings[1].full_name.split(' ')[0]}</Text>
              <Text style={styles.podiumXP}>{rankings[1].xp} XP</Text>
            </Animated.View>

            {/* 1st Place */}
            <Animated.View style={[styles.podiumItem, { 
              opacity: podiumAnim, 
              transform: [{ translateY: podiumAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }] 
            }]}>
              <View style={styles.crownContainer}>
                <Crown size={28} color="#FBBF24" fill="#FBBF24" />
              </View>
              <Avatar name={rankings[0].full_name} url={rankings[0].avatar_url} size={90} level={rankings[0].level} />
              <View style={[styles.podiumBadge, { backgroundColor: '#FBBF24', width: 32, height: 32, borderRadius: 16 }]}>
                <Text style={[styles.podiumRankText, { fontSize: 14 }]}>1</Text>
              </View>
              <Text style={[styles.podiumName, { fontSize: 17, marginTop: 10 }]} numberOfLines={1}>{rankings[0].full_name.split(' ')[0]}</Text>
              <Text style={[styles.podiumXP, { color: '#FBBF24' }]}>{rankings[0].xp} XP</Text>
            </Animated.View>

            {/* 3rd Place */}
            <Animated.View style={[styles.podiumItem, { 
              marginTop: 45, 
              opacity: podiumAnim, 
              transform: [{ translateY: podiumAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] 
            }]}>
              <Avatar name={rankings[2].full_name} url={rankings[2].avatar_url} size={64} level={rankings[2].level} />
              <View style={[styles.podiumBadge, { backgroundColor: '#B45309' }]}>
                <Text style={styles.podiumRankText}>3</Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{rankings[2].full_name.split(' ')[0]}</Text>
              <Text style={styles.podiumXP}>{rankings[2].xp} XP</Text>
            </Animated.View>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'KTR' && styles.tabActive]}
            onPress={() => setActiveTab('KTR')}
          >
            <Text style={[styles.tabText, activeTab === 'KTR' && styles.tabTextActive]}>Global KTR</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'DEPT' && styles.tabActive]}
            onPress={() => setActiveTab('DEPT')}
          >
            <Text style={[styles.tabText, activeTab === 'DEPT' && styles.tabTextActive]}>My Dept</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={rankings.slice(3)}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => renderRankItem({ item, index: index + 3 })}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBackground: {
    backgroundColor: Colors.primary,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    color: '#fff',
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  podiumItem: {
    alignItems: 'center',
    width: width / 3.4,
  },
  crownContainer: {
    marginBottom: -5,
    zIndex: 10,
  },
  podiumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -15,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 20,
  },
  podiumRankText: {
    color: '#fff',
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 11,
  },
  podiumName: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: '#fff',
    marginTop: 12,
  },
  podiumXP: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#fff',
    borderColor: Colors.primary,
  },
  tabText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: '#94A3B8',
  },
  tabTextActive: {
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rankNumberContainer: {
    width: 36,
  },
  rankNumber: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 16,
    color: '#CBD5E1',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: '#1E1B4B',
    marginBottom: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    color: '#CBD5E1',
    fontSize: 10,
  },
  userSub: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: '#64748B',
  },
  xpInfo: {
    alignItems: 'flex-end',
  },
  xpValue: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 18,
    color: Colors.accent, // Transaction Green
  },
  xpLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
    color: '#94A3B8',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
