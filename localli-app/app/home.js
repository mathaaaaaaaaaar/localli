import React, {
  useCallback,
  useState,
} from 'react';

import axios from 'axios';
import { decode as atob } from 'base-64';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import API_BASE_URL from '../constants/constants';

const categoryIcons = {
  Barbershop: 'content-cut',
  Salon: 'hair-dryer',
  Spa: 'spa',
  Gym: 'dumbbell',
  Clinic: 'medical-bag',
  Dentist: 'tooth',
  Massage: 'hands-pray',
};

export default function Home() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5); // Default rating
  const [currentBusinessId, setCurrentBusinessId] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOption, setSortOption] = useState('az');

  const router = useRouter();
  const navigation = useNavigation();

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return router.replace('/');
  
      const decoded = JSON.parse(atob(token.split('.')[1]));
  
      if (decoded.exp * 1000 < Date.now()) {
        await AsyncStorage.removeItem('userToken');
        return router.replace('/');
      }
  
      setUserId(decoded.id);
      setUserEmail(decoded.email);
      setUserRole(decoded.role);
      setUserName(decoded.name);
      const defaultAvatar = decoded.role === 'owner'
        ? 'https://i.pravatar.cc/100?img=12'
        : 'https://i.pravatar.cc/100?img=36';
      setAvatar(decoded.avatar?.trim() || defaultAvatar);
  
      const res = await axios.get(`${API_BASE_URL}/businesses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const filtered = decoded.role === 'owner'
        ? res.data.filter(b => b.owner?._id === decoded.id)
        : res.data;
  
      // Fetch reviews for each business
      const businessesWithReviews = await Promise.all(
        filtered.map(async (business) => {
          const reviews = await fetchReviews(business._id);
          return { ...business, reviews };
        })
      );
  
      const enhanced = businessesWithReviews.map(b => ({
        ...b,
        totalAppointments: b.totalAppointments || 0,
      }));
  
      setBusinesses(enhanced);
    } catch (err) {
      console.error('❌ Error fetching businesses:', err.message);
      Alert.alert('Error', 'Failed to load businesses');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
};

const fetchReviews = async (businessId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/businesses/${businessId}/reviews`);
    return response.data;
  } catch (err) {
    console.error('Error fetching reviews:', err.message);
    return [];
  }
};

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    Toast.show({ type: 'success', text1: 'Logged out successfully' });
    router.replace('/');
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete Business', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const token = await AsyncStorage.getItem('userToken');
          await axios.delete(`${API_BASE_URL}/businesses/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchData();
          Toast.show({ type: 'success', text1: 'Business deleted' });
        },
      },
    ]);
  };

  const handleEdit = (id) => router.push(`/edit-business?id=${id}`);
  const handleBookNow = (businessId) => router.push(`/book-appointment?businessId=${businessId}`);

  const handleViewAppointments = () => {
    router.push(userRole === 'owner' ? '/business-bookings' : '/my-appointments');
  };

  const handleAddReview = async (businessId) => {
    setCurrentBusinessId(businessId);
    setIsModalVisible(true); // Show the modal
      // let selectedRating = 5; // Default rating
      // Alert.prompt(
      //   'Add Review',
      //   'Write your review below:',
      //   [
      //     { text: 'Cancel', style: 'cancel' },
      //     {
      //       text: 'Submit',
      //       onPress: async (reviewText) => {
      //         try {
      //           const token = await AsyncStorage.getItem('userToken');
      //           await axios.post(`${API_BASE_URL}/businesses/${businessId}/reviews`, 
      //             { comment: reviewText, rating: selectedRating },
      //             { headers: { Authorization: `Bearer ${token}` } }
      //           );
      //           Toast.show({ type: 'success', text1: 'Review added successfully' });
      //           fetchData(); // Refresh data to include the new review
      //         } catch (err) {
      //           console.error('❌ Error adding review:', err.message);
      //           Alert.alert('Error', 'Failed to add review');
      //         }
      //       },
      //     },
      //   ],
      //   'plain-text'
      // );
  };

  const submitReview = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Error', 'Review text cannot be empty.');
      return;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert('Error', 'Rating must be between 1 and 5.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(
        `${API_BASE_URL}/businesses/${currentBusinessId}/reviews`,
        { comment: reviewText, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Toast.show({ type: 'success', text1: 'Review added successfully' });
      setIsModalVisible(false); // Close the modal
      setReviewText(''); // Reset the review text
      setRating(5); // Reset the rating
      fetchData(); // Refresh the business data
    } catch (err) {
      console.error('❌ Error adding review:', err.message);
      Alert.alert('Error', 'Failed to add review.');
    }
  };


  
 const filteredBusinesses = businesses
  .filter(b =>
    (!selectedCategory || b.category === selectedCategory) &&
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (userRole === 'owner' || b.active)  // <--- ✨ Hide inactive for customers
  )
    .sort((a, b) => {
      if (sortOption === 'az') return a.name.localeCompare(b.name);
      if (sortOption === 'priceLow') return (a.price || 0) - (b.price || 0);
      if (sortOption === 'priceHigh') return (b.price || 0) - (a.price || 0);
      return 0;
    });

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 👤 Header with avatar + name */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {avatar && <Image source={{ uri: avatar }} style={styles.avatar} />}
          <View>
            <Text style={styles.welcome}>Welcome, {userName}</Text>
            <Text style={styles.email}>{userEmail}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/edit-profile')}>
          <Icon name="account-edit" size={26} color="#1976d2" style={{ marginRight: 12 }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout}>
          <Icon name="logout" size={26} color="red" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Review</Text>
            <TextInput
              style={styles.input}
              placeholder="Write your review"
              multiline
              value={reviewText}
              onChangeText={setReviewText}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter rating (1-5)"
              keyboardType="numeric"
              value={rating.toString()}
              onChangeText={(value) => setRating(Number(value))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={submitReview}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 📅 Appointment Button */}
      <TouchableOpacity style={styles.appointmentButton} onPress={handleViewAppointments}>
        <Text style={styles.appointmentButtonText}>
          {userRole === 'owner' ? 'Booked Appointments' : 'View My Appointments'}
        </Text>
      </TouchableOpacity>

      {/* 🔍 Search & Filter */}
      <TextInput
        placeholder="Search businesses..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.input}
      />

      <View style={styles.categoryBar}>
        {Object.keys(categoryIcons).map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.iconButton, selectedCategory === cat && styles.activeIconButton]}
            onPress={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
          >
            <Icon name={categoryIcons[cat]} size={24} color="#333" />
            <Text style={styles.iconLabel}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ➕ Create Business */}
      {userRole === 'owner' && (
        <TouchableOpacity
          style={styles.createBusinessButton}
          onPress={() => router.push('/create-business')}
        >
          <Text style={styles.createBusinessText}>+ Create Business</Text>
        </TouchableOpacity>
      )}

      {/* 🔃 Fancy Sorting with Equal Width */}
      <View style={styles.sortRow}>
        {[
          { key: 'az', label: '🔤 A-Z' },
          { key: 'priceLow', label: '📉 Price Low' },
          { key: 'priceHigh', label: '📈 Price High' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.sortButton,
              sortOption === key && styles.activeSortButton,
            ]}
            onPress={() => setSortOption(key)}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortOption === key && styles.activeSortButtonText,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBusinesses}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name={categoryIcons[item.category] || 'store'} size={20} color="#555" style={{ marginRight: 8 }} />
                <Text style={styles.name}>{item.name}</Text>
              </View>
              {userRole === 'customer' && item.price != null && (
                <Text style={styles.priceTag}>${parseFloat(item.price).toFixed(2)}</Text>
              )}
            </View>

            <Text>{item.description}</Text>
            <Text style={styles.meta}>{item.category} | {item.address}</Text>

            {item.phone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                <Text style={styles.phoneNumber}>📞 {item.phone}</Text>
              </TouchableOpacity>
            )}

            {/* Display reviews */}
            <View style={styles.reviewsSection}>
  <Text style={styles.reviewsTitle}>Reviews:</Text>
  {item.reviews?.length > 0 ? (
    item.reviews.map((review, index) => (
      <View key={index} style={styles.reviewCard}>
        <Text style={styles.reviewUser}>{review.user?.name || 'Anonymous'}</Text>
        <Text style={styles.reviewRating}>Rating: {review.rating}/5</Text>
        <Text style={styles.reviewComment}>{review.comment}</Text>
      </View>
    ))
  ) : (
    <Text style={styles.noReviewsText}>No reviews yet.</Text>
  )}
  <TouchableOpacity style={styles.addReviewButton} onPress={() => handleAddReview(item._id)}>
    <Text style={styles.addReviewButtonText}>Add Review</Text>
  </TouchableOpacity>
</View>


            {userRole === 'owner' && (
              <View style={styles.buttonRow}>
                <Button title="Edit" onPress={() => handleEdit(item._id)} />
                <Button title="Delete" color="red" onPress={() => handleDelete(item._id)} />
              </View>
            )}


          {/* 💰 Price shown for both roles only once */}
          {item.price != null && (
            <Text style={styles.priceTag}>💰 ${parseFloat(item.price).toFixed(2)}</Text>
          )}

        {/* 👤 Owner badge */}
        {userRole === 'owner' && (
          <TouchableOpacity onPress={handleViewAppointments}>
            <Text style={styles.appointmentBadge}>
              🗓️ {item.totalAppointments} appointments
            </Text>
          </TouchableOpacity>
        )}

        {/* 📄 Description + Meta */}
        <Text>{item.description}</Text>
        <Text style={styles.meta}>{item.category} | {item.address}</Text>

        {/* 📞 Phone */}
        {item.phone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
            <Text style={styles.phoneNumber}>📞 {item.phone}</Text>
          </TouchableOpacity>
        )}

        {/* 📅 Book Now for Customers */}
        {userRole === 'customer' && (
          <View style={styles.priceAndButtonWrapper}>
            <TouchableOpacity style={styles.bookButton} onPress={() => handleBookNow(item._id)}>
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ✏️ Edit/Delete for Owners */}
        {userRole === 'owner' && (
          <View style={styles.buttonRow}>
            <Button title="Edit" onPress={() => handleEdit(item._id)} />
            <Button title="Delete" color="red" onPress={() => handleDelete(item._id)} />
          </View>
        )}
      </View>
    )}
    ListEmptyComponent={
      <Text style={{ textAlign: 'center', marginTop: 20, color: 'gray' }}>
        {userRole === 'owner'
          ? 'You have not created any businesses yet.'
          : 'No businesses found. Try again later.'}
      </Text>
    }
  />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50, backgroundColor: '#f1faff' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: { backgroundColor: '#ccc' },
  submitButton: { backgroundColor: '#1976d2' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  welcome: { fontSize: 18, fontWeight: 'bold' },
  email: { fontSize: 14, color: 'gray' },
  appointmentButton: {
    backgroundColor: '#1976d2', padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center',
  },
  appointmentButtonText: { color: 'white', fontWeight: 'bold' },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 10, borderRadius: 5, backgroundColor: '#fff',
  },
  categoryBar: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginBottom: 10 },
  iconButton: { alignItems: 'center', margin: 5 },
  activeIconButton: { backgroundColor: '#cceeff', borderRadius: 5, padding: 4 },
  iconLabel: { fontSize: 10 },
  createBusinessButton: {
    backgroundColor: '#4caf50', padding: 12, borderRadius: 8, marginBottom: 10, alignItems: 'center',
  },
  createBusinessText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  card: {
    padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#ccc',
    borderRadius: 8, backgroundColor: '#fff',
  },
  name: { fontSize: 18, fontWeight: 'bold' },
  meta: { marginTop: 5, fontStyle: 'italic', fontSize: 12, color: 'gray' },
  phoneNumber: { marginTop: 5, color: '#007aff', fontWeight: '500', fontSize: 16 },
  priceTag: { fontSize: 20, fontWeight: 'bold', color: '#1e88e5' },
  priceAndButtonWrapper: { marginTop: 10, alignItems: 'center' },
  bookButton: {
    marginTop: 8, backgroundColor: '#43a047', paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 3, elevation: 3, alignItems: 'center', width: '100%',
  },
  bookButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  reviewsSection: { marginTop: 10, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8 },
  reviewsTitle: { fontWeight: 'bold', marginBottom: 5 },
  reviewText: { fontSize: 14, marginBottom: 5 },
  noReviewsText: { fontStyle: 'italic', color: 'gray' },
  addReviewButton: {
    marginTop: 10,
    backgroundColor: '#1976d2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addReviewButtonText: { color: '#fff', fontWeight: 'bold' },

  sortRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 10,
  gap: 8, // Optional if you're using newer RN version
},
sortButton: {
  flex: 1,
  paddingVertical: 10,
  alignItems: 'center',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#ccc',
  backgroundColor: '#fff',
},
activeSortButton: {
  backgroundColor: '#1976d2',
  borderColor: '#1976d2',
},
sortButtonText: {
  fontSize: 13,
  color: '#333',
  fontWeight: '500',
},
activeSortButtonText: {
  color: '#fff',
},

appointmentBadge: {
  marginTop: 4,
  fontSize: 17,
  color: '#1565c0',
  textDecorationLine: 'underline',
  fontWeight: '500',
}
});