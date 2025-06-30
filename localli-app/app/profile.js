import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../constants/constants';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          Alert.alert('Error', 'Token missing. Please log in again.');
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error('❌ Error fetching profile:', err.message);
        Alert.alert('Error', 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text>User profile not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <Text style={styles.detail}>Name: {user.name}</Text>
      <Text style={styles.detail}>Email: {user.email}</Text>
      <Text style={styles.detail}>Role: {user.role}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detail: {
    fontSize: 18,
    marginBottom: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});