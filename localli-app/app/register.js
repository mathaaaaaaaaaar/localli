import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import API_BASE_URL from '../constants/constants';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // default to customer
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing Fields', 'All fields are required');
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
        role,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Auto-login
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const token = res.data.token;
      await AsyncStorage.setItem('userToken', token);
      router.replace('/home');
    } catch (err) {
      console.error('❌ Registration Error:', err);
      const msg = err.response?.data?.message || err.response?.data || 'Something went wrong';
      Alert.alert('Registration failed', typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register on Localli</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        returnKeyType="next"
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        returnKeyType="done"
        onChangeText={setPassword}
      />

      <Text style={styles.label}>Registering as:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={role}
          onValueChange={(value) => setRole(value)}
        >
          <Picker.Item label="Customer" value="customer" />
          <Picker.Item label="Owner" value="owner" />
        </Picker>
      </View>

      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#fff',
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
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
  },
});