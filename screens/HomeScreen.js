import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getBooks } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';

const SORT_OPTIONS = [
  { label: 'Title (A–Z)', value: 'title' },
  { label: 'Title (Z–A)', value: '-title' },
  { label: 'Author (A–Z)', value: 'author' },
  { label: 'Author (Z–A)', value: '-author' },
  { label: 'Newest first', value: '-createdAt' },
  { label: 'Oldest first', value: 'createdAt' },
];

export default function HomeScreen({ navigation }) {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('title');
  const [pendingSort, setPendingSort] = useState('title');
  const [showSortModal, setShowSortModal] = useState(false);
  const [error, setError] = useState(null);

  const fetchBooks = useCallback(async () => {
    try {
      setError(null);
      const params = { sort };
      if (search) params.title = search;
      const data = await getBooks(params);
      setBooks(Array.isArray(data) ? data : (data.docs || []));
    } catch (err) {
      setError('Could not load books. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, sort]);

  useEffect(() => {
    setLoading(true);
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => !token ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={{ marginRight: 16 }}
        >
          <Text style={{ color: '#454545', fontWeight: '600', fontSize: 14 }}>Login</Text>
        </TouchableOpacity>
      ) : null,
    });
  }, [token, navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooks();
  };

  const openSort = () => {
    setPendingSort(sort);
    setShowSortModal(true);
  };

  const applySort = () => {
    setSort(pendingSort);
    setShowSortModal(false);
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Sort';

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#454545" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Search bar + sort icon */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title..."
          placeholderTextColor="#bbb"
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={() => setSearch(searchInput)}
          returnKeyType="search"
        />
        {searchInput.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchInput(''); setSearch(''); }} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#bbb" />
          </TouchableOpacity>
        )}
        <View style={styles.divider} />
        <TouchableOpacity onPress={openSort} style={styles.sortBtn}>
          <Ionicons name="options-outline" size={20} color="#454545" />
        </TouchableOpacity>
      </View>

      {/* Active sort label */}
      <View style={styles.activeSortRow}>
        <Text style={styles.activeSortText}>
          Sorted by: <Text style={styles.activeSortValue}>{currentSortLabel}</Text>
        </Text>
      </View>

      {/* Error state */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchBooks}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Book list */}
      <FlatList
        data={books}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => navigation.navigate('BookDetail', { bookId: item._id })}
            navigation={navigation}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#454545" />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No books found</Text>
          </View>
        }
        contentContainerStyle={books.length === 0 && styles.emptyContainer}
      />

      {/* Sort bottom sheet modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        />
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.bottomSheetHandle} />
          <Text style={styles.bottomSheetTitle}>Sort by</Text>

          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={styles.sortOption}
              onPress={() => setPendingSort(opt.value)}
            >
              <Text style={[
                styles.sortOptionText,
                pendingSort === opt.value && styles.sortOptionTextActive
              ]}>
                {opt.label}
              </Text>
              {pendingSort === opt.value && (
                <Ionicons name="checkmark" size={20} color="#454545" />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.applyButton} onPress={applySort}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#F6EDDD', paddingLeft: 12, height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#454545' },
  clearBtn: { paddingHorizontal: 8 },
  divider: { width: 1, height: 24, backgroundColor: '#F6EDDD', marginHorizontal: 4 },
  sortBtn: { paddingHorizontal: 12, height: 48, justifyContent: 'center' },
  activeSortRow: { paddingHorizontal: 16, marginBottom: 8 },
  activeSortText: { fontSize: 12, color: '#888' },
  activeSortValue: { color: '#454545', fontWeight: '600' },
  errorBox: { margin: 16, padding: 16, backgroundColor: '#fff0f0', borderRadius: 8, alignItems: 'center' },
  errorText: { color: '#c0392b', marginBottom: 8 },
  retryText: { color: '#454545', fontWeight: 'bold' },
  emptyText: { color: '#888', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  bottomSheet: {
    backgroundColor: '#FFFDF5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSheetHandle: {
    width: 40, height: 4, backgroundColor: '#F6EDDD',
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20,
  },
  bottomSheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#454545', marginBottom: 16 },
  sortOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F6EDDD',
  },
  sortOptionText: { fontSize: 15, color: '#888' },
  sortOptionTextActive: { color: '#454545', fontWeight: '600' },
  applyButton: {
    backgroundColor: '#454545', borderRadius: 8, padding: 16,
    alignItems: 'center', marginTop: 20,
  },
  applyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});