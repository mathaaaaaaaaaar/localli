import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Button,
  FlatList,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';

export default function SelectDateAndSlot() {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const timeSlots = [
    '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
    '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
  ];

  const onConfirm = () => {
    if (!selectedSlot) {
      Alert.alert('Please select a time slot');
      return;
    }
    Alert.alert('Confirmed', `Appointment booked on ${moment(date).format('YYYY-MM-DD')} at ${selectedSlot}`);
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="calendar-clock" size={60} color="#4e9af1" />
      <Text style={styles.title}>Book Your Appointment</Text>

      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateBtn}>
        <Text style={styles.dateText}>{moment(date).format('YYYY-MM-DD')}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <Text style={styles.subtitle}>Available Time Slots</Text>
      <FlatList
        data={timeSlots}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.slotList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.slot,
              selectedSlot === item && styles.selectedSlot,
            ]}
            onPress={() => setSelectedSlot(item)}
          >
            <Text style={[styles.slotText, selectedSlot === item && { color: '#fff' }]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <Button title="Confirm Appointment" onPress={onConfirm} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f2ff',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 16,
  },
  dateBtn: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  slotList: {
    marginBottom: 20,
  },
  slot: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  selectedSlot: {
    backgroundColor: '#007bff',
  },
  slotText: {
    color: '#007bff',
    fontWeight: '600',
  },
});