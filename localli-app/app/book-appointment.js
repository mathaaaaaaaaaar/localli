import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Button,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import API_BASE_URL from '../constants/constants';
import moment from 'moment';

export default function BookAppointment() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  const formattedDate = moment(date).format('YYYY-MM-DD');

  useEffect(() => {
    if (businessId) {
      setSelectedSlot(null); // clear previous selection
      fetchSlots(formattedDate);
    }
  }, [formattedDate]);

  const fetchSlots = async (selectedDate) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.get(`${API_BASE_URL}/appointments/${businessId}/slots`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date: selectedDate },
      });
      setSlots(res.data || []);
    } catch (err) {
      console.error('❌ Failed to fetch slots:', err);
      Alert.alert('Error', 'Could not fetch slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) {
      Toast.show({ type: 'error', text1: 'No slot selected!' });
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(
        `${API_BASE_URL}/appointments/book`,
        { businessId, date: formattedDate, slot: selectedSlot },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Toast.show({ type: 'success', text1: 'Appointment booked!' });
      router.replace('/home');
    } catch (err) {
      console.error('❌ Booking error:', err);
      if (err.response?.status === 409) {
        Toast.show({ type: 'error', text1: 'Slot already booked!' });
        fetchSlots(formattedDate);
      } else {
        Alert.alert('Booking failed', 'Something went wrong');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Select Date:</Text>
      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          mode="date"
          display="default"
          value={date}
          onChange={(event, selected) => {
            setShowPicker(false);
            if (selected) setDate(selected);
          }}
        />
      )}

      <Text style={styles.title}>Available Time Slots:</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <View style={styles.slotsContainer}>
          {slots.length === 0 && (
            <Text style={{ textAlign: 'center', marginVertical: 20 }}>No slots available</Text>
          )}
          {slots.map((slot) => (
            <TouchableOpacity
              key={slot.time}
              disabled={!slot.available}
              onPress={() => setSelectedSlot(slot.time)}
              style={[
                styles.slot,
                slot.available ? styles.available : styles.booked,
                selectedSlot === slot.time && styles.selected,
              ]}
            >
              <Text style={styles.slotText}>{slot.time}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedSlot && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ textAlign: 'center', marginBottom: 10 }}>
            Selected Slot: <Text style={{ fontWeight: 'bold' }}>{selectedSlot}</Text>
          </Text>
          <Button title="Confirm Booking" onPress={handleBookSlot} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f0f8ff',
    minHeight: '100%',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  dateButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  slot: {
    padding: 12,
    borderRadius: 8,
    margin: 5,
    width: '45%',
    alignItems: 'center',
  },
  slotText: {
    fontWeight: '600',
    fontSize: 14,
  },
  available: {
    backgroundColor: '#d0f0c0',
  },
  booked: {
    backgroundColor: '#ddd',
  },
  selected: {
    borderWidth: 2,
    borderColor: '#007bff',
  },
});