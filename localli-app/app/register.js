import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert, Image, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import API_BASE_URL from '../constants/constants';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

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
      setLoading(true);
      let uploadedAvatar = '';

      if (avatar) {
        try {
          uploadedAvatar = await uploadToCloudinary(avatar);
          console.log('✅ Avatar uploaded URL:', uploadedAvatar);
        } catch (uploadErr) {
          console.error('❌ Cloudinary upload failed:', uploadErr);
          Alert.alert('Upload Error', 'Failed to upload avatar image.');
          return;
        }
      }

      await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
        role,
        avatar: uploadedAvatar,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      await AsyncStorage.setItem('userToken', res.data.token);
      router.replace('/home');
    } catch (err) {
      console.error('❌ Registration Error:', err);
      const msg = err.response?.data?.message || err.response?.data || 'Something went wrong';
      Alert.alert('Registration failed', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register on Localli</Text>

      <TouchableOpacity onPress={pickImage} style={styles.avatarPicker}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarPlaceholder}>Pick Avatar</Text>
        )}
      </TouchableOpacity>

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

      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 20 }} />
      ) : (
        <Button
          title="Register"
          onPress={handleRegister}
          disabled={!name || !email || !password}
        />
      )}
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
  avatarPicker: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 100,
    color: '#888',
  },
});