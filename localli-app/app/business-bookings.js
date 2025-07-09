// 📁 app/business-bookings.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Button,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { decode as atob } from 'base-64';
import API_BASE_URL from '../constants/constants';

export default function BusinessBookings() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newDate, setNewDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const decoded = JSON.parse(atob(token.split('.')[1]));

      const bizRes = await axios.get(`${API_BASE_URL}/businesses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ownerBusinesses = bizRes.data.filter(b => b.owner?._id === decoded.id);
      if (ownerBusinesses.length === 0) {
        Toast.show({ type: 'info', text1: 'No business found for this owner' });
        setAppointments([]);
        return;
      }

      const businessId = ownerBusinesses[0]._id;

      const res = await axios.get(`${API_BASE_URL}/appointments/business/${businessId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAppointments(res.data);
    } catch (err) {
      console.error('❌ Error fetching business appointments:', err.response?.data || err.message);
      Toast.show({ type: 'error', text1: 'Failed to load bookings' });
    } finally {
      setLoading(false);
    }
  };

  const deleteAppointment = async (id) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this appointment?', [
      { text: 'No' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.delete(`${API_BASE_URL}/appointments/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Toast.show({ type: 'success', text1: 'Booking cancelled' });
            fetchAppointments();
          } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed to cancel' });
          }
        },
      }
    ]);
  };

const confirmAppointment = async (id) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    await axios.post(`${API_BASE_URL}/appointments/${id}/confirm`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    Toast.show({ type: 'success', text1: 'Appointment confirmed' });
    fetchAppointments();
  } catch (err) {
    console.error('❌ Confirm error:', err.response?.data || err.message);
    Toast.show({ type: 'error', text1: 'Failed to confirm' });
  }
};

  const rescheduleAppointment = async () => {
    if (!selectedAppt) return;
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(
        `${API_BASE_URL}/appointments/${selectedAppt._id}`,
        { newDate: moment(newDate).format('YYYY-MM-DD'), newSlot: selectedAppt.newSlot },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Toast.show({ type: 'success', text1: 'Rescheduled successfully' });
      setShowModal(false);
      fetchAppointments();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Reschedule failed' });
    }
  };

  const showRescheduleModal = async (appt) => {
    setSelectedAppt({ ...appt, newSlot: appt.slot });
    setNewDate(new Date(appt.date));
    setShowModal(true);
    fetchAvailableSlots(appt.business._id, appt.date);
  };

  const fetchAvailableSlots = async (businessId, date) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.get(`${API_BASE_URL}/appointments/${businessId}/slots`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date },
      });
      setAvailableSlots(res.data);
    } catch (err) {
      console.error('❌ Error fetching slots:', err);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.customer?.name}</Text>
      <Text style={styles.meta}>{moment(item.date).format('MMMM Do YYYY')} | {item.slot}</Text>
      <Text>{item.customer?.email}</Text>
      <View style={styles.buttonRow}>
        <Button title="Reschedule" onPress={() => showRescheduleModal(item)} />
        <Button title="Cancel" color="red" onPress={() => deleteAppointment(item._id)} />
        <Button title="Confirm" color="green" onPress={() => confirmAppointment(item._id)} />
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TouchableOpacity onPress={() => router.replace('/home')} style={styles.backButton}>
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>

      <Text style={styles.totalCount}>
        Booked Appointments: {appointments.length}
      </Text>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>No bookings yet.</Text>}
      />

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
              <Text style={styles.dateText}>{moment(newDate).format('YYYY-MM-DD')}</Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                mode="date"
                display="default"
                value={newDate}
                onChange={(event, selected) => {
                  setShowPicker(false);
                  if (selected) {
                    setNewDate(selected);
                    fetchAvailableSlots(selectedAppt.business._id, moment(selected).format('YYYY-MM-DD'));
                  }
                }}
              />
            )}
            <View style={styles.slotsContainer}>
              {availableSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.time}
                  disabled={!slot.available}
                  onPress={() => setSelectedAppt(prev => ({ ...prev, newSlot: slot.time }))}
                  style={[styles.slot, slot.available ? styles.available : styles.booked]}
                >
                  <Text>{slot.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Confirm Reschedule" onPress={rescheduleAppointment} />
            <Button title="Close" onPress={() => setShowModal(false)} color="gray" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  name: { fontSize: 18, fontWeight: 'bold' },
  meta: { color: 'gray', marginBottom: 4 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 8, width: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  dateButton: { backgroundColor: '#eee', padding: 10, borderRadius: 5, marginBottom: 10 },
  dateText: { fontSize: 16, textAlign: 'center' },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  slot: { padding: 10, borderRadius: 5, margin: 4 },
  available: { backgroundColor: '#d0f0c0' },
  booked: { backgroundColor: '#ccc' },
  backButton: { marginBottom: 12 },
  backText: { color: '#007aff', fontSize: 16 },
  totalCount: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
});