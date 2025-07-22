import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  Button
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import { decode as atob } from 'base-64';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import API_BASE_URL from '../constants/constants';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newDate, setNewDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => { init(); }, []);

  const init = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setUserRole(decoded.role);
      setUserId(decoded.id);
      fetchAppointments(decoded.role, decoded.id, token);
    } catch (err) {
      console.error('❌ Error decoding token:', err);
      Toast.show({ type: 'error', text1: 'Login expired' });
    }
  };

  const fetchAppointments = async (role, id, token) => {
    setLoading(true);
    try {
      let allAppointments = [];
      if (role === 'customer') {
        const res = await axios.get(`${API_BASE_URL}/appointments/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        allAppointments = res.data;
      } else {
        const res = await axios.get(`${API_BASE_URL}/appointments/owner/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        allAppointments = res.data;
      }
      allAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));
      setAppointments(allAppointments);
    } catch (err) {
      console.error('❌ Fetch appointments error:', err);
      Toast.show({ type: 'error', text1: 'Failed to load appointments' });
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = (id) => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      { text: 'No' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.delete(`${API_BASE_URL}/appointments/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Toast.show({ type: 'success', text1: 'Appointment cancelled' });
            init();
          } catch (err) {
            console.error('❌ Cancel error:', err);
            Alert.alert('Error', 'Failed to cancel');
          }
        },
      },
    ]);
  };

  const confirmAppointment = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_BASE_URL}/appointments/${id}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Toast.show({ type: 'success', text1: 'Confirmed successfully' });
      init();
    } catch (err) {
      console.error('❌ Confirm error:', err);
      Toast.show({ type: 'error', text1: 'Confirmation failed' });
    }
  };

  const showRescheduleModal = async (appt) => {
    const parsedDate = moment(appt.date).format('YYYY-MM-DD');
    setSelectedAppt({ ...appt, newSlot: appt.slot });
    setNewDate(new Date(appt.date));
    setShowModal(true);
    fetchAvailableSlots(selectedAppt.business._id, moment(selected).format('YYYY-MM-DD'));
  };

  const fetchAvailableSlots = async (businessId, date) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const formattedDate = moment(date).format('YYYY-MM-DD');
      const res = await axios.get(`${API_BASE_URL}/appointments/${businessId}/slots`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date: formattedDate },
      });
      setAvailableSlots(res.data);
    } catch (err) {
      console.error('❌ Error fetching slots:', err);
    }
  };

  const rescheduleAppointment = async () => {
    if (!selectedAppt) return;
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_BASE_URL}/appointments/${selectedAppt._id}`, {
        newDate: moment(newDate).format('YYYY-MM-DD'),
        newSlot: selectedAppt.newSlot
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Toast.show({ type: 'success', text1: 'Rescheduled successfully' });
      setShowModal(false);
      init();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Reschedule failed' });
    }
  };

  const renderItem = ({ item }) => {
    const business = item.business?.name || 'Business';
    const date = moment(item.date).format('MMMM Do YYYY');
    const slot = item.slot;

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{business}</Text>
        <Text style={styles.meta}>{date} • {slot}</Text>
        {userRole === 'owner' && (
          <Text style={styles.customer}>👤 {item.customer?.name || 'Unknown'} ({item.customer?.email})</Text>
        )}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ff9800' }]} onPress={() => showRescheduleModal(item)}>
            <Icon name="calendar-edit" size={18} color="#fff" />
            <Text style={styles.actionText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f44336' }]} onPress={() => cancelAppointment(item._id)}>
            <Icon name="cancel" size={18} color="#fff" />
            <Text style={styles.actionText}>Cancel</Text>
          </TouchableOpacity>
          {userRole === 'owner' && !item.confirmed && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4caf50' }]} onPress={() => confirmAppointment(item._id)}>
              <Icon name="check" size={18} color="#fff" />
              <Text style={styles.actionText}>Confirm</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.badge}>You have {appointments.length} Appointments</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No appointments found.</Text>}
      />

      <Modal visible={showModal} animationType="slide" transparent>
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
                    const businessId = typeof selectedAppt.business === 'object' ? selectedAppt.business._id : selectedAppt.business;
                    fetchAvailableSlots(businessId, moment(selected).format('YYYY-MM-DD'));
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
                  style={[
                    styles.slot,
                    !slot.available && styles.booked,
                    slot.time === selectedAppt?.newSlot && styles.selectedSlot,
                  ]}
                >
                  <Text>{slot.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
           <View style={{ marginTop: 10 }}>
              <Button title="Confirm Reschedule" onPress={rescheduleAppointment} />
            </View>
            <View style={{ marginTop: 10 }}>
              <Button title="Close" onPress={() => setShowModal(false)} color="gray" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  badge: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
  },
  name: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  meta: { color: '#777', marginBottom: 6 },
  customer: { color: '#444', marginBottom: 8 },
 actionRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 8,
  marginTop: 8,
},
actionBtn: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 10,
  borderRadius: 6,
  marginHorizontal: 4,
},
  actionText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 30, color: 'gray' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 8, width: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  dateButton: { backgroundColor: '#eee', padding: 10, borderRadius: 5, marginBottom: 10 },
  dateText: { fontSize: 16, textAlign: 'center' },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  slot: { padding: 10, borderRadius: 5, margin: 4, backgroundColor: '#eee' },
  available: { backgroundColor: '#d0f0c0' },
  booked: { backgroundColor: '#ccc' },
  selectedSlot: { backgroundColor: '#90caf9' },
});