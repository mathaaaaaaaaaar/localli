// app/SelectDateAndSlot.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SelectDateAndSlot() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="calendar-clock" size={60} color="#4e9af1" />
      <Text style={styles.title}>Coming Soon!</Text>
      <Text style={styles.subtitle}>
        This screen will allow users to select a date and time slot for their appointment.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f2ff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});