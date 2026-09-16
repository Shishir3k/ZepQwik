import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface AddressContextType {
  selectedAddress: any | null;
  savedAddresses: any[];
  isServicedArea: boolean;
  loading: boolean;
  fetchAddresses: () => Promise<void>;
  selectAddress: (address: any) => void;
  deleteAddress: (id: string) => Promise<void>;
  checkCurrentLocation: () => Promise<void>;
}

const AddressContext = createContext<AddressContextType>({} as AddressContextType);

// DARKSTORE CONFIGURATION
const DARKSTORE_LOCATION = {
  latitude: 25.2140361,  
  longitude: 80.9198276, 
};
const MAX_DELIVERY_RADIUS_KM = 20.0; 

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const AddressProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useAuth();
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isServicedArea, setIsServicedArea] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (profile?.id) {
      fetchAddresses();
    } else {
      setSavedAddresses([]);
      setSelectedAddress(null);
    }
  }, [profile?.id]);

  const validateCoordinates = (lat?: number, lng?: number) => {
    if (!lat || !lng) {
      setIsServicedArea(false);
      return;
    }
    const distance = calculateDistanceKm(
      DARKSTORE_LOCATION.latitude,
      DARKSTORE_LOCATION.longitude,
      lat,
      lng
    );
    setIsServicedArea(distance <= MAX_DELIVERY_RADIUS_KM);
  };

  const fetchAddresses = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_addresses') 
        .select('*')
        .eq('user_id', profile.id) 
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedAddresses(data || []);

      if (data && data.length > 0 && !selectedAddress) {
        const defaultAddr = data.find((a) => a.is_default) || data[0];
        setSelectedAddress(defaultAddr);
        validateCoordinates(
          defaultAddr.latitude ? parseFloat(defaultAddr.latitude) : undefined,
          defaultAddr.longitude ? parseFloat(defaultAddr.longitude) : undefined
        );
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      validateCoordinates(latitude, longitude);
    } catch (err) {
      console.error('Error fetching location:', err);
      setIsServicedArea(false);
    } finally {
      setLoading(false);
    }
  };

  const selectAddress = (address: any) => {
    setSelectedAddress(address);
    validateCoordinates(
      address.latitude ? parseFloat(address.latitude) : undefined,
      address.longitude ? parseFloat(address.longitude) : undefined
    );
  };

  const deleteAddress = async (id: string) => {
    try {
      await supabase.from('user_addresses').delete().eq('id', id);
      await fetchAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  return (
    <AddressContext.Provider
      value={{
        selectedAddress,
        savedAddresses,
        isServicedArea,
        loading,
        fetchAddresses,
        selectAddress,
        deleteAddress,
        checkCurrentLocation,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => useContext(AddressContext);