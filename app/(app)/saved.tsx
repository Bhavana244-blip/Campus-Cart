import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import EmptyState from '../../components/ui/EmptyState';

export default function WishlistScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Items</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <EmptyState title="Coming Soon" subtitle="Wishlisting feature will be here" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: Colors.border },
  backButton: { padding: 8, marginLeft: -8, width: 40 },
  title: { fontFamily: 'Sora_700Bold', fontSize: 18, color: Colors.primary },
  content: { flex: 1, justifyContent: 'center' },
});
