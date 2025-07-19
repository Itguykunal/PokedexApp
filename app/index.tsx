import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      
      // Small delay to prevent flickering
      setTimeout(() => {
        if (isLoggedIn === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      }, 1000); // 1 second delay to show loading
      
    } catch (error) {
      console.error('Error checking auth status:', error);
      // If there's an error, default to login screen
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FFD76F" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
  },
});