import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AddressProvider, useAddress } from '../context/AddressContext';

// @ts-ignore
import '../../global.css';

function InitialLayout() {
  const { user, isLoading: authLoading } = useAuth();
  const { selectedAddress, savedAddresses } = useAddress() || {};
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const currentRoute = segments[segments.length - 1];

    // 1. If user is not logged in, force them to sign-in
    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/sign-in' as any);
      }
      return;
    }

    // 2. If logged in, but no delivery address is selected/saved, force them to add an address
    const hasAddresses = savedAddresses && savedAddresses.length > 0;
    const needsAddress = !hasAddresses && !selectedAddress;

    if (needsAddress) {
      if (currentRoute !== 'add-address') {
        router.replace('/add-address' as any);
      }
      return;
    }

    // 3. If logged in and has an address, ensure they are inside the tabs home area
    if (!inTabsGroup && currentRoute !== 'add-address' && currentRoute !== 'location-select') {
      router.replace('/(tabs)' as any);
    }
  }, [user, selectedAddress, savedAddresses, authLoading, segments]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#276ded" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AddressProvider>
          <StatusBar style="light" />
          <InitialLayout />
        </AddressProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}