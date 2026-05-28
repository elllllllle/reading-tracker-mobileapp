import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Modal, Share, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { createReadingLog } from '../services/api';

export default function BookCard({ book, onPress, navigation }) {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [showMenu, setShowMenu] = useState(false);

  const coverUrl = book.isbn
    ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`
    : null;

  const handleLongPress = () => {
    setShowMenu(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `📖 Check out "${book.title}" by ${book.author}${book.genre ? ` — a great ${book.genre} book` : ''}!`,
        url: `https://cassowary02.ifn666.com/assessment02/books/${book._id}`,
      });
      setShowMenu(false);
    } catch (err) {
      Alert.alert('Share Error', err.message);
      setShowMenu(false);
    }
  };

  const handleQuickAdd = () => {
    setShowMenu(false);
    setTimeout(() => {
      onPress(); // navigate to book detail
    }, 300);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onLongPress={handleLongPress}
        delayLongPress={400}
        activeOpacity={0.7}
      >
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverPlaceholderText}>📖</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
          <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
          {book.genre ? <Text style={styles.genre}>{book.genre}</Text> : null}
        </View>
      </TouchableOpacity>

      {/* Quick action bottom sheet */}
      <Modal
        visible={showMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        />
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />

          {/* Book info header */}
          <View style={styles.menuHeader}>
            {coverUrl
              ? <Image source={{ uri: coverUrl }} style={styles.menuCover} resizeMode="cover" />
              : <View style={styles.menuCoverPlaceholder}><Text>📖</Text></View>
            }
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle} numberOfLines={2}>{book.title}</Text>
              <Text style={styles.menuAuthor}>{book.author}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Actions */}
          {token && (
            <TouchableOpacity style={styles.menuItem} onPress={handleQuickAdd}>
              <Ionicons name="journal-outline" size={22} color="#454545" />
              <Text style={styles.menuItemText}>Add to Reading Log</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#454545" />
            <Text style={styles.menuItemText}>Share this Book</Text>
          </TouchableOpacity>

          {!token && (
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate('Login'); }}>
              <Ionicons name="log-in-outline" size={22} color="#454545" />
              <Text style={styles.menuItemText}>Login to track this book</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onPress(); }}>
            <Ionicons name="book-outline" size={22} color="#454545" />
            <Text style={styles.menuItemText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#F6EDDD',
    overflow: 'hidden',
  },
  cover: { width: 80, height: 110 },
  coverPlaceholder: {
    width: 80, height: 110, backgroundColor: '#F6EDDD',
    justifyContent: 'center', alignItems: 'center',
  },
  coverPlaceholderText: { fontSize: 28 },
  info: { flex: 1, padding: 12, justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: 'bold', color: '#454545', marginBottom: 4 },
  author: { fontSize: 13, color: '#888', marginBottom: 4 },
  genre: { fontSize: 12, color: '#aaa' },

  // Modal styles
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
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
  handle: {
    width: 40, height: 4, backgroundColor: '#F6EDDD',
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  menuHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  menuCover: { width: 48, height: 64, borderRadius: 4 },
  menuCoverPlaceholder: {
    width: 48, height: 64, backgroundColor: '#F6EDDD',
    borderRadius: 4, justifyContent: 'center', alignItems: 'center',
  },
  menuTitle: { fontSize: 15, fontWeight: 'bold', color: '#454545', marginBottom: 2 },
  menuAuthor: { fontSize: 13, color: '#888' },
  divider: { height: 1, backgroundColor: '#F6EDDD', marginBottom: 8 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F6EDDD',
  },
  menuItemText: { fontSize: 15, color: '#454545' },
  cancelButton: {
    marginTop: 8, padding: 14, alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: '#888' },
});
