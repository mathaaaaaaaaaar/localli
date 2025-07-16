import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';

import API_BASE_URL from '../constants/constants';

const categories = [
  'Salon',
  'Spa',
  'Barbershop',
  'Clinic',
  'Gym',
  'Dentist',
  'Massage',
];

const timeOptions = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00',
];

const slotDurations = ['15', '30', '45', '60', '90', '120'];

export default function CreateBusiness() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [price, setPrice] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slotDuration, setSlotDuration] = useState('');

  const router = useRouter();

  const handleSubmit = async () => {
    if (!name || !description || !category || !address || !price || !startTime || !endTime || !slotDuration) {
      Alert.alert('Missing Fields', 'Please fill out all required fields.');
      return;
    }

    const numeric = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(numeric) || numeric <= 0) {
      Alert.alert('Invalid Price', 'Enter a valid positive price.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const payload = {
        name,
        description,
        category,
        address,
        phone,
        price: numeric,
        businessHours: {
          start: `${startTime}:00`,
          end: `${endTime}:00`,
          slotDuration: parseInt(slotDuration),
        },
      };

      const res = await axios.post(`${API_BASE_URL}/businesses`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Toast.show({ type: 'success', text1: 'Business created successfully' });
      router.replace('/home');
    } catch (err) {
      console.error('❌ Error creating business:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Something went wrong.');
    }
  };

  const handlePriceChange = (val) => {
    const numeric = val.replace(/[^0-9.]/g, '');
    if (!numeric) {
      setPrice('');
    } else {
      setPrice(`$${numeric}`);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create New Business 🏢</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} placeholder="Business Name" value={name} onChangeText={setName} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={styles.input} placeholder="Short Description" value={description} onChangeText={setDescription} />

        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={category} onValueChange={setCategory}>
            <Picker.Item label="Select Category" value="" />
            {categories.map((cat) => <Picker.Item key={cat} label={cat} value={cat} />)}
          </Picker>
        </View>

        <Text style={styles.label}>Address</Text>
        <TextInput style={styles.input} placeholder="Location" value={address} onChangeText={setAddress} />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} placeholder="Optional Phone" value={phone} keyboardType="phone-pad" onChangeText={setPhone} />

        <Text style={styles.label}>Starting Price</Text>
        <TextInput style={styles.input} placeholder="$25.00" value={price} keyboardType="numeric" onChangeText={handlePriceChange} />

        {/* 🕒 Business Hours */}
        <Text style={styles.label}>Business Hours</Text>
        <View style={styles.row}>
          <View style={styles.pickerHalf}>
            <Picker selectedValue={startTime} onValueChange={setStartTime}>
              <Picker.Item label="Start Time" value="" />
              {timeOptions.map(t => <Picker.Item key={t} label={t} value={t} />)}
            </Picker>
          </View>
          <View style={styles.pickerHalf}>
            <Picker selectedValue={endTime} onValueChange={setEndTime}>
              <Picker.Item label="End Time" value="" />
              {timeOptions.map(t => <Picker.Item key={t} label={t} value={t} />)}
            </Picker>
          </View>
        </View>

        {/* ⏱️ Slot Duration Picker */}
        <Text style={styles.label}>Slot Duration (minutes)</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={slotDuration} onValueChange={setSlotDuration}>
            <Picker.Item label="Select Duration" value="" />
            {slotDurations.map(d => <Picker.Item key={d} label={`${d} minutes`} value={d} />)}
          </Picker>
        </View>

        <Button title="Submit" onPress={handleSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    backgroundColor: '#f1faff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  pickerHalf: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
});