import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Share, Modal, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBook, getReadingLogs, createReadingLog, updateReadingLog,
         getShelves, addBookToShelf, deleteReadingLog, removeBookFromShelf } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['want-to-read', 'reading', 'completed'];

const statusColor = {
  'want-to-read': { bg: '#fff3cd', text: '#856404' },
  'reading': { bg: '#cce5ff', text: '#004085' },
  'completed': { bg: '#d4edda', text: '#155724' },
};

const statusLabel = {
  'want-to-read': 'Want to Read',
  'reading': 'Currently Reading',
  'completed': 'Completed',
};

export default function BookDetailScreen({ route, navigation }) {
  const { bookId } = route.params;
  const { token } = useAuth();
  const [book, setBook] = useState(null);
  const [myLog, setMyLog] = useState(null);
  const [shelves, setShelves] = useState([]);
  const [bookShelfId, setBookShelfId] = useState(null);
  const [bookShelfName, setBookShelfName] = useState(null);
  const [selectedShelfId, setSelectedShelfId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showShelfModal, setShowShelfModal] = useState(false);
  const [logStatus, setLogStatus] = useState('want-to-read');
  const [logProgress, setLogProgress] = useState('');
  const [logRating, setLogRating] = useState(0);
  const [logReview, setLogReview] = useState('');
  const [savingLog, setSavingLog] = useState(false);
  const [coverExpanded, setCoverExpanded] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: 'Book Details' });
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const bookData = await getBook(bookId);
      setBook(bookData);
      if (token) {
        const [logsData, shelvesData] = await Promise.all([
          getReadingLogs({ book: bookId }),
          getShelves(),
        ]);
        const allLogs = Array.isArray(logsData) ? logsData : (logsData.docs || []);
        const existing = allLogs.find(l => (l.book?._id || l.book) === bookId);
        if (existing) {
          setMyLog(existing);
          setLogStatus(existing.status);
          setLogProgress(String(existing.progress || ''));
          setLogRating(existing.rating || 0);
          setLogReview(existing.review || '');
        } else {
          setMyLog(null);
          setLogStatus('want-to-read');
          setLogProgress('');
          setLogRating(0);
          setLogReview('');
        }
        const allShelves = Array.isArray(shelvesData) ? shelvesData : (shelvesData.docs || []);
        setShelves(allShelves);
        const shelfWithBook = allShelves.find(s =>
          s.books?.some(b => (b._id || b) === bookId)
        );
        if (shelfWithBook) {
          setBookShelfId(shelfWithBook._id);
          setBookShelfName(shelfWithBook.name);
        } else {
          setBookShelfId(null);
          setBookShelfName(null);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `📖 I'm reading "${book.title}" by ${book.author} — check it out!`,
        url: `https://cassowary02.ifn666.com/assessment02/books/${book._id}`,
      });
    } catch (err) {}
  };

  const handleSaveLog = async () => {
    setSavingLog(true);
    try {
      const logData = {
        book: bookId,
        status: logStatus,
        progress: logStatus === 'reading' && logProgress ? Number(logProgress) : undefined,
        rating: logStatus === 'completed' && logRating ? logRating : undefined,
        review: logStatus === 'completed' && logReview ? logReview : undefined,
      };
      if (myLog) {
        await updateReadingLog(myLog._id, logData);
      } else {
        await createReadingLog(logData);
      }
      setShowLogModal(false);
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSavingLog(false);
    }
  };

  const handleRemoveLog = () => {
    Alert.alert('Remove Log', 'Remove this book from your reading log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await deleteReadingLog(myLog._id);
            setShowLogModal(false);
            setMyLog(null);
            setLogStatus('want-to-read');
            setLogProgress('');
            setLogRating(0);
            setLogReview('');
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        }
      }
    ]);
  };

  const handleAddToShelf = async () => {
    if (!selectedShelfId) { Alert.alert('Please select a shelf'); return; }
    try {
      await addBookToShelf(selectedShelfId, bookId);
      const shelf = shelves.find(s => s._id === selectedShelfId);
      setBookShelfId(selectedShelfId);
      setBookShelfName(shelf?.name);
      setShowShelfModal(false);
      setSelectedShelfId(null);
      Alert.alert('Added!', `Book added to "${shelf?.name}".`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleRemoveFromShelf = async () => {
    try {
      await removeBookFromShelf(bookShelfId, bookId);
      setBookShelfId(null);
      setBookShelfName(null);
      Alert.alert('Removed', 'Book removed from shelf.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#454545" /></View>;
  if (error) return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={fetchData} style={styles.retryButton}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const coverUrl = book.isbn ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg` : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Cover */}
      <View style={styles.coverContainer}>
        {coverUrl ? (
          <TouchableOpacity onPress={() => setCoverExpanded(true)} activeOpacity={0.9}>
            <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
            <View style={styles.expandHint}>
              <Ionicons name="expand-outline" size={14} color="#fff" />
              <Text style={styles.expandHintText}>Tap to expand</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={{ fontSize: 48 }}>📖</Text>
          </View>
        )}
      </View>

      {/* Full screen cover modal */}
      <Modal visible={coverExpanded} transparent animationType="fade" onRequestClose={() => setCoverExpanded(false)}>
        <TouchableOpacity style={styles.fullScreenOverlay} activeOpacity={1} onPress={() => setCoverExpanded(false)}>
          <Image source={{ uri: coverUrl }} style={styles.fullScreenCover} resizeMode="contain" />
          <View style={styles.fullScreenHint}>
            <Ionicons name="close-circle" size={28} color="#fff" />
            <Text style={styles.fullScreenHintText}>Tap anywhere to close</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Title & Author */}
      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>by {book.author}</Text>

      {/* Badges */}
      <View style={styles.badgeRow}>
        {book.genre && <View style={styles.badge}><Text style={styles.badgeText}>{book.genre}</Text></View>}
        {book.isbn && <View style={styles.badge}><Text style={styles.badgeText}>ISBN: {book.isbn}</Text></View>}
      </View>

      {/* Description */}
      {book.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{book.description}</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {token ? (
          <>
            {myLog ? (
              <TouchableOpacity style={styles.outlineButton} onPress={() => setShowLogModal(true)}>
              <View style={[styles.statusDot, { backgroundColor: statusColor[myLog.status]?.text || '#454545' }]} />
              <Text style={styles.outlineButtonText}>
                  {statusLabel[myLog.status] || myLog.status}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#454545" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primaryButton} onPress={() => setShowLogModal(true)}>
                <Ionicons name="journal-outline" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Add to Reading Log</Text>
              </TouchableOpacity>
            )}

            {bookShelfId ? (
              <TouchableOpacity style={styles.outlineButton} onPress={handleRemoveFromShelf}>
                <Ionicons name="albums-outline" size={18} color="#c0392b" />
                <Text style={[styles.outlineButtonText, { color: '#c0392b', textAlign: 'center' }]}>
                  Remove from {bookShelfName}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.outlineButton} onPress={() => setShowShelfModal(true)}>
                <Ionicons name="albums-outline" size={18} color="#454545" />
                <Text style={[styles.outlineButtonText, { textAlign: 'center' }]}>Add to Shelf</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.primaryButtonText}>Login to track this book</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.outlineButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={18} color="#454545" />
          <Text style={[styles.outlineButtonText, { textAlign: 'center' }]}>Share this Book</Text>
        </TouchableOpacity>
      </View>

      {/* Reading Log Modal */}
      <Modal visible={showLogModal} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {myLog ? `Update "${book.title}"` : `Add "${book.title}" to reading log`}
            </Text>
            <TouchableOpacity onPress={() => setShowLogModal(false)}>
              <Ionicons name="close" size={24} color="#454545" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Reading status</Text>
          <View style={styles.chipRow}>
            {STATUS_OPTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, logStatus === s && styles.chipActive]}
                onPress={() => setLogStatus(s)}
              >
                <Text style={[styles.chipText, logStatus === s && styles.chipTextActive]}>
                  {statusLabel[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {logStatus === 'reading' && (
            <>
              <Text style={styles.label}>Progress (pages read)</Text>
              <TextInput
                style={styles.input}
                value={logProgress}
                onChangeText={setLogProgress}
                placeholder="e.g. 120"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
              />
            </>
          )}

          {logStatus === 'completed' && (
            <>
              <Text style={styles.label}>Rating</Text>
              <View style={styles.starRow}>
                {[1,2,3,4,5].map(star => (
                  <TouchableOpacity key={star} onPress={() => setLogRating(star)}>
                    <Text style={{ fontSize: 32 }}>{star <= logRating ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Review</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={logReview}
                onChangeText={setLogReview}
                placeholder="Write your thoughts about this book..."
                placeholderTextColor="#bbb"
                multiline
                numberOfLines={4}
              />
            </>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveLog} disabled={savingLog}>
            <Text style={styles.primaryButtonText}>
              {savingLog ? 'Saving...' : myLog ? 'Save Changes' : 'Add to Log'}
            </Text>
          </TouchableOpacity>

          {myLog && (
            <TouchableOpacity style={styles.removeButton} onPress={handleRemoveLog}>
              <Ionicons name="trash-outline" size={16} color="#c0392b" />
              <Text style={styles.removeButtonText}>Remove from My Logs</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </Modal>

      {/* Add to Shelf Modal */}
      <Modal visible={showShelfModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { flex: 1 }]}>
          <View style={[styles.modalHeader, { padding: 24, paddingBottom: 16 }]}>
            <Text style={styles.modalTitle}>
              {shelves.length > 0 ? `Add "${book.title}" to a shelf` : 'Add to a shelf'}
            </Text>
            <TouchableOpacity onPress={() => { setShowShelfModal(false); setSelectedShelfId(null); }}>
              <Ionicons name="close" size={24} color="#454545" />
            </TouchableOpacity>
          </View>

          {shelves.length === 0 ? (
            <View style={styles.emptyShelf}>
              <Ionicons name="albums-outline" size={40} color="#ccc" />
              <Text style={styles.emptyShelfText}>
                You don't have any shelves yet. Create one from My Books page first!
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { paddingHorizontal: 24, marginBottom: 12 }]}>Select a shelf</Text>
              <ScrollView style={{ flex: 1 }}>
                {shelves.map(shelf => (
                  <TouchableOpacity
                    key={shelf._id}
                    style={styles.shelfItem}
                    onPress={() => setSelectedShelfId(shelf._id)}
                  >
                    <View style={[styles.radio, selectedShelfId === shelf._id && styles.radioSelected]} />
                    <Text style={styles.shelfItemText}>
                      {shelf.name} ({shelf.books?.length || 0} books)
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.shelfModalActions}>
                <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={handleAddToShelf}>
                  <Text style={styles.primaryButtonText}>Add to Shelf</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF5' },
  content: { padding: 24, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  coverContainer: { alignItems: 'center', marginBottom: 20 },
  cover: { width: 140, height: 200, borderRadius: 8 },
  coverPlaceholder: { width: 140, height: 200, backgroundColor: '#F6EDDD', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  expandHint: {
    position: 'absolute', bottom: 8, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  expandHintText: { color: '#fff', fontSize: 11 },
  fullScreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullScreenCover: { width: '90%', height: '75%' },
  fullScreenHint: { position: 'absolute', bottom: 60, flexDirection: 'row', alignItems: 'center', gap: 8 },
  fullScreenHintText: { color: '#fff', fontSize: 14 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#454545', textAlign: 'center', marginBottom: 6 },
  author: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 16 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20 },
  badge: { backgroundColor: '#F6EDDD', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, color: '#454545', textTransform: 'capitalize' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#454545', marginBottom: 10 },
  description: { fontSize: 14, color: '#666', lineHeight: 22 },
  actions: { gap: 10 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#454545', borderRadius: 8, padding: 14 },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  outlineButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: '#F6EDDD', borderRadius: 8, padding: 14, backgroundColor: '#fff' },
  outlineButtonText: { color: '#454545', fontWeight: '600', fontSize: 14 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
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
  shelfItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F6EDDD', gap: 12, marginHorizontal: 24 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc' },
  radioSelected: { borderColor: '#454545', backgroundColor: '#454545' },
  shelfItemText: { fontSize: 15, color: '#454545' },
  emptyShelf: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
  emptyShelfText: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22 },
  shelfModalActions: { padding: 24, paddingBottom: 40 },
  errorText: { color: '#c0392b', marginBottom: 12 },
  retryButton: { backgroundColor: '#454545', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: 'bold' },
});