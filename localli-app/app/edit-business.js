import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import API_BASE_URL from '../constants/constants';

const categories = [
  'Salon', 'Spa', 'Barbershop', 'Clinic', 'Gym', 'Dentist', 'Massage',
];

const timeOptions = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00',
];

const slotDurations = ['15', '30', '45', '60', '90', '120'];

export default function EditBusiness() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [price, setPrice] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [slotDuration, setSlotDuration] = useState('');

  const router = useRouter();
  const { id } = useLocalSearchParams();

  useEffect(() => {
    if (id) fetchBusiness();
  }, [id]);

  const fetchBusiness = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.get(`${API_BASE_URL}/businesses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const b = res.data;
      setName(b.name);
      setDescription(b.description);
      setCategory(b.category);
      setAddress(b.address);
      setPhone(b.phone || '');
      setActive(b.active !== false);
      setPrice(b.price ? `$${parseFloat(b.price).toFixed(2)}` : '');
      setStartTime(b.businessHours?.start?.slice(0, 5) || '');
      setEndTime(b.businessHours?.end?.slice(0, 5) || '');
      setSlotDuration(b.businessHours?.slotDuration?.toString() || '');
    } catch (err) {
      console.error('❌ Error fetching business:', err.message);
      Alert.alert('Error', 'Could not load business data');
    }
  };

  const handleUpdate = async () => {
    if (!name || !description || !category || !address || price === '' || !slotDuration) {
      Alert.alert('Missing Info', 'Please fill all fields');
      return;
    }

    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('Invalid Price', 'Price must be a positive number');
      return;
    }

    Alert.alert('Confirm Update', 'Are you sure you want to save changes?', [
      { text: 'Cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            await axios.put(
              `${API_BASE_URL}/businesses/${id}`,
              {
                name,
                description,
                category,
                address,
                phone,
                active,
                price: numericPrice,
                businessHours: {
                  start: `${startTime}:00`,
                  end: `${endTime}:00`,
                  slotDuration: parseInt(slotDuration),
                }
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert('Success', 'Business updated successfully');
            router.replace('/home');
          } catch (err) {
            console.error('❌ Error updating business:', err.message);
            Alert.alert('Error', 'Failed to update business');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Business 🛠️</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} placeholder="Business Name" value={name} onChangeText={setName} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={styles.input} placeholder="Short Description" value={description} onChangeText={setDescription} />

        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker}>
            <Picker.Item label="Select Category" value="" />
            {categories.map((cat) => <Picker.Item key={cat} label={cat} value={cat} />)}
          </Picker>
        </View>

        <Text style={styles.label}>Address</Text>
        <TextInput style={styles.input} placeholder="Location" value={address} onChangeText={setAddress} />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} placeholder="Optional Phone" value={phone} keyboardType="phone-pad" onChangeText={setPhone} />

        <Text style={styles.label}>Starting Price</Text>
        <TextInput
          style={styles.input}
          placeholder="$25.00"
          value={price}
          keyboardType="numeric"
          onChangeText={(val) => {
            const numeric = val.replace(/[^0-9.]/g, '');
            setPrice(numeric ? `$${numeric}` : '');
          }}
        />

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

        <Text style={styles.label}>Slot Duration (minutes)</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={slotDuration} onValueChange={setSlotDuration}>
            <Picker.Item label="Select Duration" value="" />
            {slotDurations.map(d => (
              <Picker.Item key={d} label={`${d} minutes`} value={d} />
            ))}
          </Picker>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Business Status</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <Text style={{ marginRight: 10 }}>Inactive</Text>
            <Switch value={active} onValueChange={setActive} />
            <Text style={{ marginLeft: 10 }}>Active</Text>
          </View>
          <Text style={{ color: active ? 'green' : 'red', fontWeight: 'bold', marginTop: 5 }}>
            {active ? '🟢 Currently Active' : '🔴 Currently Inactive'}
          </Text>
        </View>

        <Button title={loading ? 'Updating...' : 'Update Business'} onPress={handleUpdate} disabled={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: '#f1faff',
  },
  title: {
    fontSize: 24,
    marginTop: 50,
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
  switchRow: {
    marginTop: 20,
    marginBottom: 30,
  },
});