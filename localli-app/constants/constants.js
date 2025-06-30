import Constants from 'expo-constants';

const getLocalIp = () => {
  // Try to get IP from modern expo config first
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri;

  if (!hostUri) {
    console.warn('⚠️ Could not detect host IP. Falling back to localhost.');
    return 'http://localhost:3001';
  }

  const ip = hostUri.split(':')[0];
  return `http://${ip}:3001`;
};

const API_BASE_URL = getLocalIp();

export default API_BASE_URL;