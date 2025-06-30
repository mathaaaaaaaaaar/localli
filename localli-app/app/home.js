import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Button,
  StyleSheet, Alert, RefreshControl,
  Image, ActivityIndicator, TextInput, TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { decode as atob } from 'base-64';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import API_BASE_URL from '../constants/constants';

const categoryIcons = {
  Barbershop: 'content-cut',
  Salon: 'hair-dryer',
  Spa: 'spa',
  Gym: 'dumbbell',
  Clinic: 'medical-bag',
  Dentist: 'tooth',
  Massage: 'hands-pray',
};

export default function Home() {
  const [businesses, setBusinesses] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOption, setSortOption] = useState('az');

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

  const filteredBusinesses = businesses
    .filter(b =>
      (!selectedCategory || b.category === selectedCategory) &&
      b.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === 'az') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  if (loading && businesses.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.sharedBackground]}>
      <View style={styles.header}>
        {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : null}
        <View>
          <Text style={styles.welcome}>Welcome, {userName}</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>
      </View>

      <TextInput
        placeholder="Search businesses..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.input}
      />

      <View style={styles.categoryBar}>
        {Object.keys(categoryIcons).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.iconButton,
              selectedCategory === cat && styles.activeIconButton,
            ]}
            onPress={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
          >
            <Icon name={categoryIcons[cat]} size={24} color="#333" />
            <Text style={styles.iconLabel}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sortRow}>
        <Button
          title="Sort A-Z"
          onPress={() => setSortOption('az')}
        />
        {userRole === 'owner' && (
          <Button
            title="Create Business"
            onPress={() => router.push('/create-business')}
          />
        )}
      </View>

      <FlatList
        data={filteredBusinesses}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon
                name={categoryIcons[item.category] || 'briefcase'}
                size={20}
                color="#333"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.name}>{item.name}</Text>
            </View>
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
  sharedBackground: {
    backgroundColor: '#f1faff',
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 10,
    borderRadius: 5,
  },
  categoryBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  iconButton: {
    alignItems: 'center',
    margin: 5,
  },
  activeIconButton: {
    backgroundColor: '#cceeff',
    borderRadius: 5,
    padding: 4,
  },
  iconLabel: {
    fontSize: 10,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
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