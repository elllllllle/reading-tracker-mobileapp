import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { register, login } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setToken } = useAuth();

  const handleRegister = async () => {
    setError(null);
    if (!username.trim()) return setError('Username is required');
    if (!email.trim() || !email.includes('@')) return setError('Enter a valid email address');
    if (password.length < 6) return setError('Password must be at least 6 characters');

    setLoading(true);
    try {
      await register(username, email, password);
      const data = await login(username, password);
      setToken(data.authToken, username);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create an account</Text>
        <Text style={styles.subtitle}>Start tracking your reading journey</Text>

        {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Choose a username"
          placeholderTextColor="#bbb"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor="#bbb"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="At least 6 characters"
          placeholderTextColor="#bbb"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.outlineButtonText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF5' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#454545', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 40 },
  label: { fontSize: 14, color: '#454545', fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#fff', color: '#454545', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 15, borderWidth: 1.5, borderColor: '#F6EDDD' },
  button: { backgroundColor: '#454545', borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 12, marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  outlineButton: { borderRadius: 8, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#F6EDDD' },
  outlineButtonText: { color: '#454545', fontSize: 14 },
  errorBox: { backgroundColor: '#fff0f0', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: '#c0392b', fontSize: 13 },
});