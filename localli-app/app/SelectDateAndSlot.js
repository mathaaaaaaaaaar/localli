// app/SelectDateAndSlot.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SelectDateAndSlot() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This screen will be used to select date and time slot.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1faff',
  },
  text: {
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
});