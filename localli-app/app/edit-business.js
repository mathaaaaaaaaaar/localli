import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import API_BASE_URL from '../constants/constants';

export default function EditBusiness() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!id) return;

      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await axios.get(`${API_BASE_URL}/businesses/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { name, description, category, address } = res.data;
        setName(name);
        setDescription(description);
        setCategory(category);
        setAddress(address);
      } catch (err) {
        console.error('❌ Error fetching business:', err.message);
        Alert.alert('Error', 'Unable to fetch business details');
        router.replace('/home');
      }
    };

    fetchBusiness();
  }, [id]);

  const handleUpdate = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_BASE_URL}/businesses/${id}`, {
        name,
        description,
        category,
        address,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Success', 'Business updated');
      router.replace('/home');
    } catch (err) {
      console.error('❌ Error updating business:', err.message);
      Alert.alert('Error', 'Failed to update business');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Business</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={category} onValueChange={setCategory}>
          <Picker.Item label="Select Category" value="" />
          <Picker.Item label="Salon" value="Salon" />
          <Picker.Item label="Spa" value="Spa" />
          <Picker.Item label="Barbershop" value="Barbershop" />
          <Picker.Item label="Clinic" value="Clinic" />
          <Picker.Item label="Gym" value="Gym" />
          <Picker.Item label="Dentist" value="Dentist" />
          <Picker.Item label="Massage" value="Massage" />
        </Picker>
      </View>

      <Text style={styles.label}>Address</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} />

      <Button title="Update Business" onPress={handleUpdate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 24, marginBottom: 20, fontWeight: 'bold' },
  label: { fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  input: {
    borderWidth: 1, borderColor: '#ccc',
    padding: 10, borderRadius: 6,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    overflow: 'hidden',
  },
});