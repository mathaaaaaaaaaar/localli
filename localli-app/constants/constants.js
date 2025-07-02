import Constants from 'expo-constants';

const getLocalIp = () => {
  try {
    // Try modern Expo config first
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoClient?.hostUri;

    if (!hostUri) {
      console.warn('⚠️ Could not detect host IP. Falling back to localhost.');
      return 'http://localhost:3001';
    }

    // Handle both '192.168.x.x:19000' and '192.168.x.x:19000/somepath'
    const ip = hostUri.split(':')[0].split('/')[0];
    return `http://${ip}:3001`;
  } catch (error) {
    console.warn('❌ Error detecting host IP. Defaulting to localhost.', error);
    return 'http://localhost:3001';
  }
};

const API_BASE_URL = getLocalIp();

export default API_BASE_URL;