import { useState } from 'react';

import axios from 'axios';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import API_BASE_URL from '../constants/constants';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const token = res.data.token;
      await AsyncStorage.setItem('userToken', token);

      router.replace('/home');
    } catch (err) {
      const errorMessage = err.response?.data || 'Server error';
      Alert.alert(
        'Login failed',
        typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Localli Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />

      <Button title="Login" onPress={handleLogin} />
      <View style={{ marginVertical: 10 }} />
      <Button title="Register" onPress={() => router.push('/register')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 20,
    fontSize: 16,
    padding: 8,
  },
});