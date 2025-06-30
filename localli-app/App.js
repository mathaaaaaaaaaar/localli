import React, { useState } from 'react';

import { LinearGradient } from 'expo-linear-gradient';

import axios from 'axios';
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import API_BASE_URL
  from './constants/constants'; // Adjust the import path as needed

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });
      Alert.alert('Login successful!', `Token: ${res.data.token}`);
    } catch (err) {
      const errorMessage = err.response?.data || 'Server error';
      Alert.alert('Login failed', typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  };

  return (
    <LinearGradient colors={['#e0f7fa', '#b2ebf2']} style={styles.gradient}>
      <View style={styles.card}>
        <Text style={styles.title}>Localli Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          autoCapitalize="none"
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />

        <Button title="Login" onPress={handleLogin} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffffee',
    padding: 25,
    borderRadius: 16,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 20,
    fontSize: 16,
    padding: 8,
  },
});