import { Stack, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as atob } from 'base-64';
import { Image, Text, TouchableOpacity, View, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function Layout() {
  const [avatar, setAvatar] = useState(null);
  const [name, setName] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 🆕 force re-render on token change
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          if (token) {
            const base64Url = token.split('.')[1];
            const padded = base64Url.padEnd(base64Url.length + (4 - (base64Url.length % 4)) % 4, '=');
            const decoded = JSON.parse(atob(padded));

            const defaultAvatar =
              decoded.role === 'owner'
                ? 'https://i.pravatar.cc/100?img=12'
                : 'https://i.pravatar.cc/100?img=36';

            setAvatar(decoded.avatar?.trim() || defaultAvatar);
            setName(decoded.name?.split(' ')[0] || 'User');
            setLoggedIn(true);
            setRefreshKey(prev => prev + 1); // 🆕 force headerRight to update
          } else {
            setAvatar(null);
            setName('');
            setLoggedIn(false);
          }
        } catch (err) {
          console.error('❌ Error loading user info:', err);
          setLoggedIn(false);
        }
      };
      loadUser();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await AsyncStorage.removeItem('userToken');
          setAvatar(null);
          setName('');
          setLoggedIn(false);
          router.replace('/');
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <>
      <Stack
        key={refreshKey} // 🆕 force re-render if user info updates
        screenOptions={{
          headerRight: () =>
            loggedIn ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
                <TouchableOpacity
                  onPress={() => router.push('/profile')}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <Text style={{ marginRight: 8, fontWeight: '600', color: '#333' }}>{name}</Text>
                  <Image
                    source={{ uri: avatar }}
                    style={{ width: 30, height: 30, borderRadius: 15 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 12 }}>
                  <Icon name="logout" size={24} color="#444" />
                </TouchableOpacity>
              </View>
            ) : null,
        }}
      />
      <Toast />
    </>
  );
}