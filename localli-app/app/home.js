import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Button,
  StyleSheet, Alert, RefreshControl,
  Image, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { decode as atob } from 'base-64';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';

import API_BASE_URL from '../constants/constants';

export default function Home() {
  const [businesses, setBusinesses] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/');
        return;
      }

      const decoded = JSON.parse(atob(token.split('.')[1]));

      // Expired token check
      if (decoded.exp * 1000 < Date.now()) {
        await AsyncStorage.removeItem('userToken');
        router.replace('/');
        return;
      }

      setUserId(decoded.id);
      setUserEmail(decoded.email);
      setUserRole(decoded.role);
      setUserName(decoded.name);

      const defaultAvatar =
        decoded.role === 'owner'
          ? 'https://i.pravatar.cc/100?img=12'
          : 'https://i.pravatar.cc/100?img=36';

      setAvatar(decoded.avatar?.trim() ? decoded.avatar : defaultAvatar);

      const res = await axios.get(`${API_BASE_URL}/businesses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filtered = decoded.role === 'owner'
        ? res.data.filter(b => b.owner?._id === decoded.id)
        : res.data;

      setBusinesses(filtered);
    } catch (err) {
      console.error('❌ Error fetching businesses:', err.message);
      Alert.alert('Error', 'Failed to load businesses');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    Toast.show({ type: 'success', text1: 'Logged out successfully' });
    router.replace('/');
  };

  const handleDelete = async (id) => {
    if (!id) return;

    Alert.alert(
      'Delete Business',
      'Are you sure you want to delete this business?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await axios.delete(`${API_BASE_URL}/businesses/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Toast.show({ type: 'success', text1: 'Business deleted' });
              fetchData();
            } catch (err) {
              console.error('❌ Error deleting business:', err.message);
              Alert.alert('Error', 'Failed to delete business');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (id) => {
    router.push(`/edit-business?id=${id}`);
  };

  if (loading && businesses.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      userRole === 'owner' ? styles.ownerBackground : styles.customerBackground
    ]}>
      <View style={styles.header}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : null}
        <View>
          <Text style={styles.welcome}>Welcome, {userName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>
      </View>

      {userRole === 'owner' && (
        <View style={{ marginBottom: 10 }}>
          <Button title="Create Business" onPress={() => router.push('/create-business')} />
        </View>
      )}

      {userRole === 'customer' && (
        <Text style={styles.infoText}>
          You are a customer. You can browse available businesses.
        </Text>
      )}

      <FlatList
        data={businesses}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>{item.description}</Text>
            <Text style={styles.meta}>{item.category} | {item.address}</Text>

            {userRole === 'owner' && (
              <View style={styles.buttonRow}>
                <Button title="Edit" onPress={() => handleEdit(item._id)} />
                <Button title="Delete" color="red" onPress={() => handleDelete(item._id)} />
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20, color: 'gray' }}>
            {userRole === 'owner'
              ? 'You have not created any businesses yet.'
              : 'No businesses found. Try again later.'}
          </Text>
        }
      />

      <Button title="Logout" color="red" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  ownerBackground: {
    backgroundColor: '#e6f2ff',
  },
  customerBackground: {
    backgroundColor: '#e6ffe6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25, marginRight: 10,
  },
  welcome: {
    fontSize: 18, fontWeight: 'bold',
  },
  email: {
    fontSize: 14, color: 'gray',
  },
  infoText: {
    color: 'gray',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  card: {
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  meta: {
    marginTop: 5,
    fontStyle: 'italic',
    fontSize: 12,
    color: 'gray',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});