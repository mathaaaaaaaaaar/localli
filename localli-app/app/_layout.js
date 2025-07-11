import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as atob } from 'base-64';
import { Image } from 'react-native';

export default function Layout() {
  const [avatar, setAvatar] = useState(null);

  // Load avatar on screen focus
  useFocusEffect(
    useCallback(() => {
      const loadAvatar = async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          if (token) {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            setAvatar(decoded.avatar || 'https://i.pravatar.cc/100');
          } else {
            setAvatar(null);
          }
        } catch (err) {
          console.error('Error loading avatar:', err);
        }
      };
      loadAvatar();
    }, [])
  );

  return (
    <>
      <Stack
        screenOptions={{
          headerRight: () =>
            avatar ? (
              <Image
                source={{ uri: avatar }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  marginRight: 10,
                }}
              />
            ) : null,
        }}
      />
      <Toast />
    </>
  );
}