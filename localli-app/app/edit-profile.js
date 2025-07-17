// EditProfile.js
// ✅ With upload logs, better error handling, safer UX
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import API_BASE_URL from '../constants/constants';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';

export default function EditProfile() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [password, setPassword] = useState('');
  const [localImage, setLocalImage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(res.data.name);
        setAvatar(res.data.avatar);
        setLocalImage(res.data.avatar);
        console.log('👤 Profile loaded:', res.data);
      } catch (err) {
        console.error('❌ Error loading profile:', err);
        Alert.alert('Error', 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      console.log('🖼️ New local image selected:', result.assets[0].uri);
      setLocalImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      let uploadedAvatar = avatar;

      if (localImage && localImage !== avatar) {
        console.log('☁️ Uploading new avatar to Cloudinary...');
        uploadedAvatar = await uploadToCloudinary(localImage);
        console.log('✅ Cloudinary URL:', uploadedAvatar);
      }

      const body = { name, avatar: uploadedAvatar };
      if (password) body.password = password;

      const response = await axios.put(`${API_BASE_URL}/user/profile`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newToken = response.data.token;
      await AsyncStorage.setItem('userToken', newToken);

      Alert.alert('✅ Success', 'Profile updated!');
      router.replace('/home');
    } catch (err) {
      console.error('❌ Update error:', err);
      const msg = err.response?.data?.message || err.response?.data || 'Something went wrong';
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          await AsyncStorage.removeItem('userToken');
          router.replace('/');
        },
      },
    ]);
  };

  const handleDelete = async () => {
    Alert.alert('Delete Account', 'This will delete all your data. Continue?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.delete(`${API_BASE_URL}/user`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            await AsyncStorage.removeItem('userToken');
            router.replace('/');
          } catch (err) {
            console.error('❌ Delete error:', err);
            Alert.alert('Error', 'Failed to delete account');
          }
        },
      },
    ]);
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TouchableOpacity onPress={pickImage}>
        <Image
          source={{ uri: localImage || 'https://i.pravatar.cc/100' }}
          style={styles.avatar}
        />
        <Text style={styles.pickText}>Change Avatar</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="New Password (optional)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" />
      ) : (
        <Button title="Save Changes" onPress={handleSave} disabled={loading} />
      )}

      <View style={{ marginTop: 20 }}>
        <Button title="Logout" color="orange" onPress={handleLogout} />
      </View>
      <View style={{ marginTop: 10 }}>
        <Button title="Delete Account" color="red" onPress={handleDelete} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    borderRadius: 6,
    padding: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
  },
  pickText: {
    textAlign: 'center',
    color: '#007bff',
    marginTop: 6,
    marginBottom: 20,
  },
});