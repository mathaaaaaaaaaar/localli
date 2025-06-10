import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function CreateBusiness() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const validate = () => {
    const newErrors = {};
    if (!name) newErrors.name = 'Name is required';
    if (!description) newErrors.description = 'Description is required';
    if (!category) newErrors.category = 'Please select a category';
    if (!address) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(
        'http://192.168.2.222:3001/businesses',
        { name, description, category, address },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert('Success', 'Business created');
      router.replace('/home');
    } catch (err) {
      console.error('❌ Error creating business:', err);
      Alert.alert('Error', 'Failed to create business');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create New Business</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={[styles.input, errors.name && styles.errorInput]}
        value={name}
        onChangeText={setName}
      />
      {errors.name && <Text style={styles.error}>{errors.name}</Text>}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 80 }, errors.description && styles.errorInput]}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      {errors.description && <Text style={styles.error}>{errors.description}</Text>}

      <Text style={styles.label}>Category</Text>
      <View style={[styles.pickerContainer, errors.category && styles.errorInput]}>
        <Picker selectedValue={category} onValueChange={setCategory}>
          <Picker.Item label="Select Category" value="" />
          <Picker.Item label="Salon" value="Salon" />
          <Picker.Item label="Spa" value="Spa" />
          <Picker.Item label="Barbershop" value="Barbershop" />
          <Picker.Item label="Clinic" value="Clinic" />
          <Picker.Item label="Gym" value="Gym" />
        </Picker>
      </View>
      {errors.category && <Text style={styles.error}>{errors.category}</Text>}

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={[styles.input, errors.address && styles.errorInput]}
        value={address}
        onChangeText={setAddress}
      />
      {errors.address && <Text style={styles.error}>{errors.address}</Text>}

      <Button title="Create Business" onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    marginTop: 10,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 5,
  },
  error: {
    color: 'red',
    marginBottom: 5,
  },
  errorInput: {
    borderColor: 'red',
  },
});