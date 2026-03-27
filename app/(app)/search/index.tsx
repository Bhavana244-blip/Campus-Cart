import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, X, Clock, Smartphone, Book, Shirt, Sofa, Dribbble, PenTool, Tag } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../constants/colors';
import { CATEGORIES } from '../../../constants/categories';
import { Listing } from '../../../types/app.types';
import ListingCard from '../../../components/ui/ListingCard';
import EmptyState from '../../../components/ui/EmptyState';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentSearches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {}
  };

  const saveRecentSearch = async (term: string) => {
    if (!term.trim()) return;
    try {
      let filtered = recentSearches.filter(s => s !== term);
      filtered.unshift(term);
      if (filtered.length > 5) filtered = filtered.slice(0, 5);
      setRecentSearches(filtered);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(filtered));
    } catch (e) {}
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem('recentSearches');
  };

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    const { data, error } = await supabase
      .from('listings')
      .select('*, users!inner(full_name)')
      .eq('is_active', true)
      .eq('is_sold', false)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setResults(data);
    }
    setIsSearching(false);
    saveRecentSearch(searchTerm);
  };

  const handleTextChange = (text: string) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (text.trim() === '') {
      setResults([]);
      setHasSearched(false);
      return;
    }

    searchTimeout.current = setTimeout(() => {
      performSearch(text);
    }, 400); // 400ms debounce
  };

  const executeSearch = (term: string) => {
    setQuery(term);
    performSearch(term);
  };

  const getCategoryIcon = (category: string) => {
    const props = { size: 24, color: Colors.primary };
    switch (category) {
      case 'Electronics': return <Smartphone {...props} />;
      case 'Books': return <Book {...props} />;
      case 'Clothing': return <Shirt {...props} />;
      case 'Furniture': return <Sofa {...props} />;
      case 'Sports': return <Dribbble {...props} />;
      case 'Stationery': return <PenTool {...props} />;
      default: return <Tag {...props} />;
    }
  };

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (hasSearched && results.length === 0) {
      return (
        <EmptyState 
          title="No results found" 
          subtitle={`We couldn't find any items matching "${query}"`} 
        />
      );
    }

    // Default state: Show recent searches and categories
    return (
      <View style={styles.defaultStateContainer}>
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chipsContainer}>
              {recentSearches.map((term, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.chip}
                  onPress={() => executeSearch(term)}
                >
                  <Clock size={14} color={Colors.muted} />
                  <Text style={styles.chipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.filter(c => c !== 'All').map((category, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.categoryTile}
                onPress={() => executeSearch(category)}
              >
                <View style={styles.categoryIconContainer}>
                  {getCategoryIcon(category)}
                </View>
                <Text style={styles.categoryTileText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={20} color={query ? Colors.primary : Colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for anything..."
            value={query}
            onChangeText={handleTextChange}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => performSearch(query)}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleTextChange('')} style={styles.clearBtn}>
              <X size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.listRow}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            sellerName={item.users?.full_name}
            onPress={() => router.push(`/(app)/home/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Sora_400Regular',
    fontSize: 14,
    color: Colors.primary,
    height: '100%',
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  listContainer: {
    paddingBottom: 40,
  },
  listRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  defaultStateContainer: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: Colors.primary,
  },
  clearText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: Colors.accent,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  chipText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
  },
  categoryTile: {
    width: '21%',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryTileText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
    color: Colors.primary,
    textAlign: 'center',
  },
});
