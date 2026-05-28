import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Animated, Modal,
  TextInput, ScrollView
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import {
  getReadingLogs, deleteReadingLog, updateReadingLog,
  getShelves, deleteShelf, createShelf, updateShelf
} from '../services/api';

const STATUS_OPTIONS = ['want-to-read', 'reading', 'completed'];

const statusConfig = {
  'want-to-read': { label: 'Want to Read', bg: '#fff3cd', text: '#856404', icon: '📌' },
  'reading': { label: 'Currently Reading', bg: '#cce5ff', text: '#004085', icon: '📖' },
  'completed': { label: 'Completed', bg: '#d4edda', text: '#155724', icon: '✅' },
};

function SwipeableLogItem({ item, onDelete, onEdit, onPress }) {
  const swipeableRef = useRef(null);

  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0], outputRange: [1, 0.5], extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => { swipeableRef.current?.close(); onDelete(item); }}
      >
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.deleteActionText}>Remove</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const sc = statusConfig[item.status] || { bg: '#F6EDDD', text: '#454545', label: item.status };

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} rightThreshold={40} friction={2}>
      <TouchableOpacity style={styles.logCard} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.logCardContent}>
          <Text style={styles.logTitle} numberOfLines={1}>{item.book?.title || 'Unknown Book'}</Text>
          <Text style={styles.logAuthor} numberOfLines={1}>{item.book?.author || ''}</Text>
          <View style={styles.logMeta}>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusBadgeText, { color: sc.text }]}>{sc.label}</Text>
            </View>
            {item.rating ? <Text>{('⭐').repeat(item.rating)}</Text> : null}
            {item.progress ? <Text style={styles.progress}>{item.progress} pages</Text> : null}
          </View>
          {item.review ? <Text style={styles.reviewText} numberOfLines={1}>{item.review}</Text> : null}
        </View>
        <TouchableOpacity style={styles.editLogBtn} onPress={() => onEdit(item)}>
          <Ionicons name="pencil-outline" size={16} color="#454545" />
          <Text style={styles.editLogText}>Edit</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Swipeable>
  );
}

function SwipeableShelfItem({ item, onEdit, onDelete, onPress }) {
  const swipeableRef = useRef(null);

  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0], outputRange: [1, 0.5], extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => { swipeableRef.current?.close(); onDelete(item); }}
      >
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.deleteActionText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} rightThreshold={40} friction={2}>
      <TouchableOpacity style={styles.shelfCard} onPress={() => onPress(item)} activeOpacity={0.7}>
        <View style={styles.shelfInfo}>
          <Ionicons name="albums-outline" size={22} color="#454545" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.shelfName}>{item.name}</Text>
            <Text style={styles.shelfCount}>
              {item.books?.length || 0} book{item.books?.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.editLogBtn} onPress={() => onEdit(item)}>
            <Ionicons name="pencil-outline" size={16} color="#454545" />
            <Text style={styles.editLogText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

export default function MyBooksScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('logs');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [logs, setLogs] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit log modal state
  const [editingLog, setEditingLog] = useState(null);
  const [editStatus, setEditStatus] = useState('want-to-read');
  const [editProgress, setEditProgress] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editReview, setEditReview] = useState('');
  const [savingLog, setSavingLog] = useState(false);

  // Shelf modal state
  const [showShelfModal, setShowShelfModal] = useState(false);
  const [editingShelf, setEditingShelf] = useState(null);
  const [shelfName, setShelfName] = useState('');
  const [savingShelf, setSavingShelf] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await getReadingLogs({});
      setLogs(Array.isArray(data) ? data : (data.docs || []));
    } catch (err) { setLogs([]); }
  }, []);

  const fetchShelves = useCallback(async () => {
    try {
      const data = await getShelves();
      setShelves(Array.isArray(data) ? data : (data.docs || []));
    } catch (err) { setShelves([]); }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchLogs(), fetchShelves()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchLogs, fetchShelves]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchAll);
    return unsub;
  }, [navigation, fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const countByStatus = (status) => logs.filter(l => l.status === status).length;

  const handleDeleteLog = (log) => {
    Alert.alert('Remove Log', `Remove "${log.book?.title || 'this book'}" from your reading log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try { await deleteReadingLog(log._id); fetchLogs(); }
          catch (err) { Alert.alert('Error', err.message); }
        }
      }
    ]);
  };

  const handleEditLog = (log) => {
    setEditingLog(log);
    setEditStatus(log.status);
    setEditProgress(String(log.progress || ''));
    setEditRating(log.rating || 0);
    setEditReview(log.review || '');
  };

  const handleSaveLog = async () => {
    setSavingLog(true);
    try {
      await updateReadingLog(editingLog._id, {
        book: editingLog.book?._id || editingLog.book,
        status: editStatus,
        progress: editStatus === 'reading' && editProgress ? Number(editProgress) : undefined,
        rating: editStatus === 'completed' && editRating ? editRating : undefined,
        review: editStatus === 'completed' && editReview ? editReview : undefined,
      });
      setEditingLog(null);
      fetchLogs();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally { setSavingLog(false); }
  };

  const handleRemoveLogFromModal = () => {
    Alert.alert('Remove Log', `Remove "${editingLog?.book?.title}" from your reading log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await deleteReadingLog(editingLog._id);
            setEditingLog(null);
            fetchLogs();
          } catch (err) { Alert.alert('Error', err.message); }
        }
      }
    ]);
  };

  const openCreateShelf = () => {
    setEditingShelf(null);
    setShelfName('');
    setShowShelfModal(true);
  };

  const openEditShelf = (shelf) => {
    setEditingShelf(shelf);
    setShelfName(shelf.name);
    setShowShelfModal(true);
  };

  const handleSaveShelf = async () => {
    if (!shelfName.trim()) { Alert.alert('Error', 'Please enter a shelf name'); return; }
    setSavingShelf(true);
    try {
      if (editingShelf) {
        await updateShelf(editingShelf._id, { name: shelfName.trim() });
      } else {
        await createShelf({ name: shelfName.trim(), isPublic: false });
      }
      setShowShelfModal(false);
      setShelfName('');
      setEditingShelf(null);
      fetchShelves();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally { setSavingShelf(false); }
  };

  const handleDeleteShelf = (shelf) => {
    Alert.alert('Delete Shelf', `Delete "${shelf.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteShelf(shelf._id); fetchShelves(); }
          catch (err) { Alert.alert('Error', err.message); }
        }
      }
    ]);
  };

  const handleShelfPress = (shelf) => {
    setSelectedShelf(shelf);
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#454545" /></View>;

  return (
    <View style={styles.container}>
      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'logs' && styles.tabActive]} onPress={() => setActiveTab('logs')}>
          <Text style={[styles.tabText, activeTab === 'logs' && styles.tabTextActive]}>📖 Reading Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'shelves' && styles.tabActive]} onPress={() => setActiveTab('shelves')}>
          <Text style={[styles.tabText, activeTab === 'shelves' && styles.tabTextActive]}>📚 My Shelves</Text>
        </TouchableOpacity>
      </View>

      {/* ── Reading Logs tab ── */}
      {activeTab === 'logs' && (
        <View style={{ flex: 1 }}>
          {/* Status cards layer */}
          {!selectedStatus && (
            <ScrollView
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#454545" />}
              contentContainerStyle={{ paddingTop: 12 }}
            >
              <TouchableOpacity style={styles.statusCard} onPress={() => setSelectedStatus('all')}>
                <View style={styles.statusCardLeft}>
                  <Text style={styles.statusCardIcon}>📚</Text>
                  <Text style={styles.statusCardLabel}>All Books</Text>
                </View>
                <View style={styles.statusCardRight}>
                  <Text style={styles.statusCardCount}>{logs.length}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#bbb" />
                </View>
              </TouchableOpacity>

              {STATUS_OPTIONS.map(status => (
                <TouchableOpacity key={status} style={styles.statusCard} onPress={() => setSelectedStatus(status)}>
                  <View style={styles.statusCardLeft}>
                    <Text style={styles.statusCardIcon}>{statusConfig[status].icon}</Text>
                    <Text style={styles.statusCardLabel}>{statusConfig[status].label}</Text>
                  </View>
                  <View style={styles.statusCardRight}>
                    <View style={[styles.countBadge, { backgroundColor: statusConfig[status].bg }]}>
                      <Text style={[styles.countBadgeText, { color: statusConfig[status].text }]}>
                        {countByStatus(status)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#bbb" />
                  </View>
                </TouchableOpacity>
              ))}

              {logs.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No reading logs yet</Text>
                  <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('HomeTab')}>
                    <Text style={styles.browseButtonText}>Browse Books</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}

          {/* Book list layer */}
          {selectedStatus && (
            <View style={{ flex: 1 }}>
              <TouchableOpacity style={styles.backRow} onPress={() => setSelectedStatus(null)}>
                <Ionicons name="arrow-back" size={18} color="#454545" />
                <Text style={styles.backText}>
                  {selectedStatus === 'all' ? 'All Books' : statusConfig[selectedStatus]?.label}
                </Text>
              </TouchableOpacity>
              <View style={[styles.hintRow, { marginBottom: 8 }]}>
                <Text style={styles.hintText}>Swipe left to quickly remove</Text>
              </View>
              <FlatList
                data={selectedStatus === 'all' ? logs : logs.filter(l => l.status === selectedStatus)}
                keyExtractor={item => item._id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#454545" />}
                renderItem={({ item }) => (
                  <SwipeableLogItem
                    item={item}
                    onDelete={handleDeleteLog}
                    onEdit={handleEditLog}
                    onPress={() => navigation.navigate('BookDetail', { bookId: item.book?._id || item.book })}
                  />
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No books here yet</Text>
                  </View>
                }
              />
            </View>
          )}
        </View>
      )}

      {/* ── Shelves tab ── */}
      {activeTab === 'shelves' && (
        <View style={{ flex: 1 }}>
          {/* Shelf list */}
          {!selectedShelf && (
            <View style={{ flex: 1 }}>
              {shelves.length > 0 && (
                <View style={styles.hintRow}>
                  <Text style={styles.hintText}>Swipe left to delete a shelf</Text>
                </View>
              )}
              <FlatList
                data={shelves}
                keyExtractor={item => item._id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#454545" />}
                contentContainerStyle={shelves.length === 0 ? styles.emptyContainer : { paddingTop: 8 }}
                renderItem={({ item }) => (
                  <SwipeableShelfItem
                    item={item}
                    onEdit={openEditShelf}
                    onDelete={handleDeleteShelf}
                    onPress={handleShelfPress}
                  />
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No shelves yet</Text>
                    <Text style={styles.emptySubText}>Create a shelf to organise your books</Text>
                  </View>
                }
              />
              <TouchableOpacity style={styles.fab} onPress={openCreateShelf}>
                <Ionicons name="add" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Shelf book list */}
          {selectedShelf && (
            <View style={{ flex: 1 }}>
              <TouchableOpacity style={[styles.backRow, { marginBottom: 12 }]} onPress={() => setSelectedShelf(null)}>
                <Ionicons name="arrow-back" size={18} color="#454545" />
                <Text style={styles.backText}>{selectedShelf.name}</Text>
              </TouchableOpacity>
              <FlatList
                data={selectedShelf.books || []}
                keyExtractor={item => item._id || item}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#454545" />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.logCard}
                    onPress={() => navigation.navigate('BookDetail', { bookId: item._id || item })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.logCardContent}>
                      <Text style={styles.logTitle} numberOfLines={1}>{item.title || 'Unknown Book'}</Text>
                      <Text style={styles.logAuthor} numberOfLines={1}>{item.author || ''}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#bbb" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No books on this shelf yet</Text>
                    <Text style={styles.emptySubText}>Add books from the book detail page</Text>
                  </View>
                }
              />
            </View>
          )}
        </View>
      )}

      {/* ── Edit Log Modal (same as Book Detail) ── */}
      <Modal visible={!!editingLog} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update "{editingLog?.book?.title}"</Text>
            <TouchableOpacity onPress={() => setEditingLog(null)}>
              <Ionicons name="close" size={24} color="#454545" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Reading status</Text>
          <View style={styles.chipRow}>
            {STATUS_OPTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, editStatus === s && styles.chipActive]}
                onPress={() => setEditStatus(s)}
              >
                <Text style={[styles.chipText, editStatus === s && styles.chipTextActive]}>
                  {statusConfig[s].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {editStatus === 'reading' && (
            <>
              <Text style={styles.label}>Progress (pages read)</Text>
              <TextInput
                style={styles.input}
                value={editProgress}
                onChangeText={setEditProgress}
                placeholder="e.g. 120"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
              />
            </>
          )}

          {editStatus === 'completed' && (
            <>
              <Text style={styles.label}>Rating</Text>
              <View style={styles.starRow}>
                {[1,2,3,4,5].map(star => (
                  <TouchableOpacity key={star} onPress={() => setEditRating(star)}>
                    <Text style={{ fontSize: 32 }}>{star <= editRating ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Review</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editReview}
                onChangeText={setEditReview}
                placeholder="Write your thoughts..."
                placeholderTextColor="#bbb"
                multiline
                numberOfLines={4}
              />
            </>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveLog} disabled={savingLog}>
            <Text style={styles.primaryButtonText}>{savingLog ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.removeButton} onPress={handleRemoveLogFromModal}>
            <Ionicons name="trash-outline" size={16} color="#c0392b" />
            <Text style={styles.removeButtonText}>Remove from My Logs</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {/* ── Create/Edit Shelf Modal ── */}
      <Modal visible={showShelfModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowShelfModal(false)}>
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingShelf ? 'Edit Shelf Name' : 'Create a new shelf'}
            </Text>
            <TouchableOpacity onPress={() => setShowShelfModal(false)}>
              <Ionicons name="close" size={24} color="#454545" />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Shelf name *</Text>
          <TextInput
            style={styles.input}
            value={shelfName}
            onChangeText={setShelfName}
            placeholder="e.g. Beach Reads, Favourites..."
            placeholderTextColor="#bbb"
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveShelf} disabled={savingShelf}>
            <Text style={styles.primaryButtonText}>
              {savingShelf ? 'Saving...' : editingShelf ? 'Save Changes' : 'Create Shelf'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.outlineButton, { marginTop: 8 }]} onPress={() => setShowShelfModal(false)}>
            <Text style={styles.outlineButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#F6EDDD', backgroundColor: '#FFFDF5' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#454545' },
  tabText: { fontSize: 14, color: '#888', fontWeight: '500' },
  tabTextActive: { color: '#454545', fontWeight: '700' },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 6,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#F6EDDD', padding: 16,
  },
  statusCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusCardIcon: { fontSize: 22 },
  statusCardLabel: { fontSize: 15, fontWeight: '600', color: '#454545' },
  statusCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusCardCount: { fontSize: 16, fontWeight: 'bold', color: '#454545' },
  countBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countBadgeText: { fontSize: 13, fontWeight: 'bold' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderBottomWidth: 1, borderBottomColor: '#F6EDDD' },
  backText: { fontSize: 15, fontWeight: '600', color: '#454545' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 6 },
  hintText: { fontSize: 11, color: '#bbb' },
  logCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 6,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#F6EDDD', padding: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  logCardContent: { flex: 1 },
  logTitle: { fontSize: 15, fontWeight: 'bold', color: '#454545', marginBottom: 2 },
  logAuthor: { fontSize: 13, color: '#888', marginBottom: 8 },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  progress: { fontSize: 12, color: '#888' },
  reviewText: { fontSize: 12, color: '#888', fontStyle: 'italic', marginTop: 4 },
  editLogBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 1.5, borderColor: '#F6EDDD', borderRadius: 8,
  },
  editLogText: { fontSize: 13, color: '#454545' },
  deleteAction: {
    backgroundColor: '#c0392b', justifyContent: 'center', alignItems: 'center',
    width: 80, marginVertical: 6, borderRadius: 10, marginRight: 16,
  },
  deleteActionText: { color: '#fff', fontSize: 11, marginTop: 4, fontWeight: '600' },
  shelfCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 6,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#F6EDDD', padding: 14,
  },
  shelfInfo: { flexDirection: 'row', alignItems: 'center' },
  shelfName: { fontSize: 15, fontWeight: 'bold', color: '#454545' },
  shelfCount: { fontSize: 12, color: '#888', marginTop: 2 },
  emptyState: { justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#888', marginBottom: 16, textAlign: 'center' },
  emptySubText: { fontSize: 13, color: '#bbb', textAlign: 'center' },
  browseButton: { backgroundColor: '#454545', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  browseButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, backgroundColor: '#454545',
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  modal: { flex: 1, backgroundColor: '#FFFDF5' },
  modalContent: { padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#454545', flex: 1, marginRight: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#454545', marginBottom: 8 },
  input: { backgroundColor: '#fff', color: '#454545', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 15, borderWidth: 1.5, borderColor: '#F6EDDD' },
  textArea: { height: 120, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#F6EDDD', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#454545', borderColor: '#454545' },
  chipText: { fontSize: 13, color: '#454545' },
  chipTextActive: { color: '#fff' },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  removeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, padding: 14 },
  removeButtonText: { color: '#c0392b', fontSize: 14, fontWeight: '600' },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#454545', borderRadius: 8, padding: 16 },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  outlineButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: '#F6EDDD', borderRadius: 8, padding: 14 },
  outlineButtonText: { color: '#454545', fontWeight: '600', fontSize: 14 },
});