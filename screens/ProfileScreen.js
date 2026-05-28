import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { token, username, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={40} color="#bbb" />
          </View>
          <Text style={styles.name}>Not logged in</Text>
          <Text style={styles.subtitle}>Login to track your reading</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('HomeTab', { screen: 'Login' })}>
          <Text style={styles.primaryButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineButton} onPress={() => navigation.navigate('HomeTab', { screen: 'Register' })}>
          <Text style={styles.outlineButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#454545" />
        </View>
        <Text style={styles.name}>{username || 'My Account'}</Text>
        <Text style={styles.subtitle}>Reading Tracker Member</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#c0392b" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF5', padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', paddingVertical: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F6EDDD', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#454545', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888' },
  primaryButton: { backgroundColor: '#454545', borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 12 },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  outlineButton: { borderRadius: 8, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#F6EDDD', marginBottom: 12 },
  outlineButtonText: { color: '#454545', fontSize: 14 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#ffcccc', borderRadius: 8, padding: 16 },
  logoutText: { color: '#c0392b', fontWeight: '600', fontSize: 15 },
});
