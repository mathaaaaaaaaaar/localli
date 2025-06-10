import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return Alert.alert('Error', 'Token missing. Please log in again.');

      try {
        const res = await axios.get('http://192.168.2.222:3001/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error('❌ Error fetching profile:', err.message);
        Alert.alert('Error fetching profile');
      }
    };

    fetchProfile();
  }, []);

  if (!user) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <Text>Name: {user.name}</Text>
      <Text>Email: {user.email}</Text>
      <Text>Role: {user.role}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 10 },
});