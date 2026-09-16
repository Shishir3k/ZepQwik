import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAddress } from '@/context/AddressContext';

type ContactType = 'myself' | 'someone_else';
type AddressTag = 'Home' | 'Work' | 'Hotel' | 'Other';

// STORE CENTER: Karwi, Chitrakoot
const STORE_LOCATION = {
  latitude: 25.2027658,
  longitude: 80.9017155,
};

const FALLBACK_REGION: Region = {
  latitude: STORE_LOCATION.latitude,
  longitude: STORE_LOCATION.longitude,
  latitudeDelta: 0.003, // Zoomed in to see local streets clearly
  longitudeDelta: 0.003,
};

// Math formula to calculate real-world distance between two GPS coordinates in Kilometers
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export default function AddAddressScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user, profile } = useAuth();
  const { fetchAddresses, selectAddress, savedAddresses } = useAddress() || {};

  // Location & Map State
  const [region, setRegion] = useState<Region>(FALLBACK_REGION);
  const [detectedCity, setDetectedCity] = useState('Detecting city...');
  const [detectedArea, setDetectedArea] = useState('Pinpointing your location...');
  const [isLocating, setIsLocating] = useState(true);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Form State
  const [completeAddress, setCompleteAddress] = useState('');
  const [contactType, setContactType] = useState<ContactType>('myself');
  const [receiverName, setReceiverName] = useState(profile?.full_name || '');
  const [receiverPhone, setReceiverPhone] = useState(
    profile?.phone_number ? profile.phone_number.replace('+91', '').trim() : ''
  );
  const [selectedTag, setSelectedTag] = useState<AddressTag>('Home');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [missingField, setMissingField] = useState<string | null>(null);

  const showError = (msg: string, fieldKey?: string) => {
    setErrorMsg(msg);
    if (fieldKey) setMissingField(fieldKey);
    setTimeout(() => {
      setErrorMsg(null);
      setMissingField(null);
    }, 4000);
  };

  const hasExistingAddresses = savedAddresses && savedAddresses.length > 0;

  useEffect(() => {
    handleGetCurrentLocation();
  }, []);

  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('Please allow location access to automatically pinpoint your delivery address.');
        setIsLocating(false);
        return;
      }

      if (Platform.OS === 'android') {
        await Location.enableNetworkProviderAsync().catch(() => {});
      }

      let currentLocation = null;
      try {
        currentLocation = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('GPS Timeout')), 8000))
        ]) as Location.LocationObject;
      } catch (e) {
        currentLocation = await Location.getLastKnownPositionAsync();
      }

      const lat = currentLocation?.coords.latitude || FALLBACK_REGION.latitude;
      const lng = currentLocation?.coords.longitude || FALLBACK_REGION.longitude;

      const newRegion: Region = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      };

      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);
      safeReverseGeocode(lat, lng);
    } catch (err) {
      console.log('GPS location error:', err);
      safeReverseGeocode(FALLBACK_REGION.latitude, FALLBACK_REGION.longitude);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const result = await Location.geocodeAsync(searchQuery);
      if (result && result.length > 0) {
        const { latitude, longitude } = result[0];
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
        safeReverseGeocode(latitude, longitude);
      } else {
        showError('Location not found. Try searching a broader area.');
      }
    } catch (e) {
      showError('Error searching location.');
    } finally {
      setIsSearching(false);
    }
  };

  const safeReverseGeocode = async (latitude: number, longitude: number) => {
    setIsGeocoding(true);
    try {
      const result = await Promise.race([
        Location.reverseGeocodeAsync({ latitude, longitude }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 3000)
        ),
      ]);

      if (result && result.length > 0) {
        const place = result[0];
        const area =
          place.street ||
          place.district ||
          place.subregion ||
          place.name ||
          place.city ||
          'Selected Area';
        const city = place.city || place.region || 'Selected City';
        setDetectedArea(area);
        setDetectedCity(city);
        setIsGeocoding(false);
        return;
      }
    } catch (e) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          { headers: { 'User-Agent': 'ZepqwikDeliveryApp/1.0' } }
        );
        const data = await response.json();
        if (data && data.address) {
          const area =
            data.address.road ||
            data.address.suburb ||
            data.address.neighbourhood ||
            data.address.city ||
            'Selected Area';
          const city =
            data.address.city ||
            data.address.town ||
            data.address.state_district ||
            'Selected City';
          setDetectedArea(area);
          setDetectedCity(city);
          setIsGeocoding(false);
          return;
        }
      } catch (httpErr) {
        console.log('Fallback reverse geocode error:', httpErr);
      }
    }

    setDetectedArea('Pinpoint Location');
    setDetectedCity('Selected City');
    setIsGeocoding(false);
  };

  const onRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      safeReverseGeocode(newRegion.latitude, newRegion.longitude);
    }, 500);
  };

  const handleMapTap = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const newRegion = { ...region, latitude, longitude };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  const handleContactTypeChange = (type: ContactType) => {
    setContactType(type);
    if (type === 'myself') {
      setReceiverName(profile?.full_name || '');
      setReceiverPhone(
        profile?.phone_number ? profile.phone_number.replace('+91', '').trim() : ''
      );
    } else {
      setReceiverName('');
      setReceiverPhone('');
    }
  };

  const handleSaveAddress = async () => {
    // 1. GEOFENCING CHECK (20KM RADIUS)
    const distance = calculateDistanceKm(
      STORE_LOCATION.latitude,
      STORE_LOCATION.longitude,
      region.latitude,
      region.longitude
    );

    if (distance > 20) {
      showError(`We currently only deliver within 20km of Chitrakoot. This location is ${distance.toFixed(1)}km away.`, 'address');
      return;
    }

    // 2. FORM VALIDATION
    if (!completeAddress.trim()) {
      showError('Please enter your house, flat, or building details.', 'address');
      return;
    }
    if (!receiverName.trim()) {
      showError("Please enter the receiver's name.", 'name');
      return;
    }
    if (!receiverPhone.trim() || receiverPhone.length < 10) {
      showError('Please enter a valid 10-digit phone number.', 'phone');
      return;
    }
    if (!user?.email) {
      showError('No active session found. Please sign in again.');
      setTimeout(() => router.replace('/(auth)/sign-in' as any), 2000);
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setMissingField(null);
    
    try {
      const googleMapsRideLink = `https://www.google.com/maps/dir/?api=1&destination=${region.latitude},${region.longitude}&travelmode=two-wheeler&dir_action=navigate`;

      const formattedPhone = receiverPhone.trim().startsWith('+91')
        ? receiverPhone.trim()
        : `+91${receiverPhone.trim()}`;

      const payload = {
        user_phone: formattedPhone,
        city: detectedCity,
        area_street: detectedArea,
        complete_address: `${completeAddress.trim()}, ${detectedArea}, ${detectedCity}`,
        house_flat_no: completeAddress.trim(),
        google_maps_link: googleMapsRideLink,
        latitude: region.latitude,
        longitude: region.longitude,
        contact_type: contactType,
        receiver_name: receiverName.trim(),
        receiver_phone: formattedPhone,
        address_tag: selectedTag,
        is_default: true,
      };

      const { data, error } = await supabase
        .from('customer_addresses')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      if (fetchAddresses) await fetchAddresses();
      if (data && selectAddress) {
        selectAddress(data);
      }

      router.replace('/(tabs)' as any);
    } catch (error: any) {
      showError(error.message || 'Could not save address.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reusable Map Component for both Mini-Preview and Full-Screen
  const renderMap = (isFullScreen: boolean) => (
    <View className={`${isFullScreen ? 'flex-1' : 'h-72 w-full rounded-2xl mb-4 border border-zinc-800'} relative bg-zinc-900 overflow-hidden`}>
      <MapView
        ref={isFullScreen ? null : mapRef}
        style={{ width: '100%', height: '100%' }}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={handleMapTap}
        pitchEnabled={isFullScreen}
        rotateEnabled={isFullScreen}
        scrollEnabled={isFullScreen}
        zoomEnabled={isFullScreen}
      />

      {/* FIXED CENTER PIN */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
        <FontAwesome5 name="map-marker-alt" size={40} color="#276ded" style={{ marginBottom: 40 }} />
      </View>

      {/* LOADING OVERLAY IF LOCATING */}
      {isLocating && (
        <View className="absolute inset-0 bg-black/40 items-center justify-center z-10">
          <ActivityIndicator size="large" color="#276ded" />
          <Text className="text-white font-bold text-xs mt-2">Pinpointing your location...</Text>
        </View>
      )}

      {/* EXPAND BUTTON (For Small Map) */}
      {!isFullScreen && (
        <TouchableOpacity
          onPress={() => setIsMapExpanded(true)}
          className="absolute inset-0 items-center justify-center bg-black/10"
        >
          <View className="bg-black/80 px-5 py-3 rounded-full flex-row items-center shadow-lg">
            <Feather name="maximize" size={16} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm ml-2">Tap to expand map</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* FULL SCREEN CONTROLS */}
      {isFullScreen && (
        <>
          {/* SEARCH BAR & BACK BUTTON */}
          <View pointerEvents="box-none" className="absolute top-12 left-4 right-4 flex-row items-center z-50">
            <TouchableOpacity
              onPress={() => setIsMapExpanded(false)}
              className="w-12 h-12 bg-zinc-900 rounded-full items-center justify-center shadow-lg border border-zinc-700 mr-3"
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View className="bg-zinc-900 flex-1 h-12 rounded-full flex-row items-center px-4 border border-zinc-700 shadow-lg">
              <Feather name="search" size={18} color="#A1A1AA" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                placeholder="Search area, city, or street..."
                placeholderTextColor="#71717A"
                className="flex-1 ml-2 text-white font-medium text-sm"
                returnKeyType="search"
              />
              {isSearching && <ActivityIndicator size="small" color="#276ded" />}
            </View>
          </View>

          {/* FLOATING LOCATION CARD */}
          <View pointerEvents="box-none" className="absolute top-28 left-4 right-4 items-center">
            <View className="bg-zinc-900/90 px-5 py-2.5 rounded-full border border-zinc-700 shadow-lg max-w-[90%]">
              <Text className="text-white font-bold text-sm text-center" numberOfLines={1}>{detectedArea}</Text>
              <Text className="text-zinc-400 text-xs mt-0.5 text-center" numberOfLines={1}>{detectedCity}</Text>
            </View>
          </View>
          
          {/* CONFIRM BUTTON */}
          <View className="absolute bottom-8 left-5 right-5">
            <TouchableOpacity
              onPress={() => setIsMapExpanded(false)}
              className="w-full bg-[#276ded] active:bg-[#1d55bc] py-4 rounded-2xl items-center justify-center shadow-lg shadow-blue-900/30"
            >
              <Text className="text-white font-black text-base tracking-wide">Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* GPS RE-CENTER BUTTON */}
      {!isFullScreen && (
        <TouchableOpacity
          onPress={handleGetCurrentLocation}
          className="absolute bottom-3 right-3 w-12 h-12 bg-zinc-900/90 border border-zinc-700 rounded-2xl items-center justify-center shadow-lg z-10"
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#276ded" />
          ) : (
            <MaterialIcons name="my-location" size={24} color="#276ded" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View className="px-5 py-3 flex-row items-center border-b border-zinc-800/80 bg-[#121212] z-10">
        <TouchableOpacity
          onPress={() => {
            if (hasExistingAddresses) {
              router.replace('/(tabs)' as any);
            } else {
              showError('Please add and save a delivery address to continue.');
            }
          }}
          className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center mr-3 border border-zinc-800"
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white font-extrabold text-xl">Enter delivery address</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 110, paddingHorizontal: 20, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ERROR BANNER */}
          {errorMsg && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4 flex-row items-center">
              <Feather name="alert-circle" size={20} color="#EF4444" />
              <Text className="text-red-500 text-sm font-semibold ml-3 flex-1 leading-5">{errorMsg}</Text>
            </View>
          )}

          {/* MINI MAP PREVIEW */}
          {!isMapExpanded && renderMap(false)}

          {/* DETECTED LOCATION STRIP */}
          <View className="bg-[#18181B] border border-zinc-800 rounded-2xl px-4 py-3.5 flex-row items-center justify-between mb-5">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 bg-zinc-900 rounded-xl items-center justify-center mr-3 border border-zinc-800">
                <Feather name="map-pin" size={18} color="#276ded" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-extrabold text-sm" numberOfLines={1}>
                  {detectedArea}
                </Text>
                <Text className="text-zinc-400 font-medium text-xs mt-0.5" numberOfLines={1}>
                  {detectedCity}
                </Text>
              </View>
            </View>
            {isGeocoding && <ActivityIndicator size="small" color="#276ded" />}
          </View>

          {/* HOUSE / FLAT / BUILDING INPUT */}
          <Text className="text-white font-black text-lg mb-3">Address details</Text>
          <View className={`bg-[#18181B] border p-4 rounded-2xl mb-5 ${missingField === 'address' ? 'border-[#276ded]' : 'border-zinc-800'}`}>
            <Text className="text-zinc-400 font-bold text-xs uppercase tracking-wider mb-1.5">
              House / Flat / Floor / Building*
            </Text>
            <TextInput
              value={completeAddress}
              onChangeText={setCompleteAddress}
              placeholder="Example: Flat 402, Block B, Silver Oak Apartments"
              placeholderTextColor="#71717A"
              multiline
              numberOfLines={2}
              className="text-white font-medium text-sm pt-1 pb-1"
              textAlignVertical="top"
            />
          </View>

          {/* CONTACT DETAILS */}
          <Text className="text-white font-black text-lg mb-3">Contact details</Text>

          {/* RADIO BUTTONS */}
          <View className="flex-row items-center mb-4 space-x-6">
            <TouchableOpacity
              onPress={() => handleContactTypeChange('myself')}
              className="flex-row items-center"
            >
              <View
                className={`w-6 h-6 rounded-full border items-center justify-center mr-2.5 ${
                  contactType === 'myself'
                    ? 'border-[#276ded] bg-[#276ded]/20'
                    : 'border-zinc-600 bg-transparent'
                }`}
              >
                {contactType === 'myself' && (
                  <View className="w-3 h-3 rounded-full bg-[#276ded]" />
                )}
              </View>
              <Text className="text-white font-bold text-base">Myself</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleContactTypeChange('someone_else')}
              className="flex-row items-center ml-6"
            >
              <View
                className={`w-6 h-6 rounded-full border items-center justify-center mr-2.5 ${
                  contactType === 'someone_else'
                    ? 'border-[#276ded] bg-[#276ded]/20'
                    : 'border-zinc-600 bg-transparent'
                }`}
              >
                {contactType === 'someone_else' && (
                  <View className="w-3 h-3 rounded-full bg-[#276ded]" />
                )}
              </View>
              <Text className="text-white font-bold text-base">Someone else</Text>
            </TouchableOpacity>
          </View>

          {/* RECEIVER NAME */}
          <View className={`bg-[#18181B] border p-4 rounded-2xl mb-3 ${missingField === 'name' ? 'border-[#276ded]' : 'border-zinc-800'}`}>
            <Text className="text-zinc-400 font-bold text-xs uppercase tracking-wider mb-1">
              Receiver's name*
            </Text>
            <TextInput
              value={receiverName}
              onChangeText={setReceiverName}
              placeholder="Enter receiver's name"
              placeholderTextColor="#71717A"
              className="text-white font-bold text-base"
            />
          </View>

          {/* RECEIVER PHONE */}
          <View className={`bg-[#18181B] border p-4 rounded-2xl flex-row items-center justify-between mb-5 ${missingField === 'phone' ? 'border-[#276ded]' : 'border-zinc-800'}`}>
            <View className="flex-1 mr-2">
              <Text className="text-zinc-400 font-bold text-xs uppercase tracking-wider mb-1">
                Receiver's phone number*
              </Text>
              <View className="flex-row items-center">
                <Text className="text-white font-black text-base mr-2">+91</Text>
                <TextInput
                  value={receiverPhone}
                  onChangeText={setReceiverPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#71717A"
                  className="flex-1 text-white font-bold text-base"
                />
              </View>
            </View>
            <Feather name="book-open" size={20} color="#71717A" />
          </View>

          {/* SAVE ADDRESS AS */}
          <Text className="text-zinc-400 font-bold text-xs uppercase tracking-wider mb-3">
            Save address as
          </Text>

          <View className="flex-row justify-between mb-6">
            {(['Home', 'Work', 'Hotel', 'Other'] as AddressTag[]).map((tagItem) => {
              const isActive = selectedTag === tagItem;
              return (
                <TouchableOpacity
                  key={tagItem}
                  onPress={() => setSelectedTag(tagItem)}
                  className={`flex-1 flex-row items-center justify-center py-3.5 rounded-2xl mr-2 last:mr-0 border ${
                    isActive
                      ? 'bg-[#276ded]/10 border-[#276ded]'
                      : 'bg-[#18181B] border-zinc-800'
                  }`}
                >
                  <FontAwesome5
                    name={
                      tagItem === 'Home'
                        ? 'home'
                        : tagItem === 'Work'
                        ? 'briefcase'
                        : tagItem === 'Hotel'
                        ? 'hotel'
                        : 'map-pin'
                    }
                    size={13}
                    color={isActive ? '#276ded' : '#A1A1AA'}
                  />
                  <Text
                    className={`font-black text-xs ml-2 ${
                      isActive ? 'text-[#276ded]' : 'text-zinc-300'
                    }`}
                  >
                    {tagItem}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* BOTTOM FIXED BUTTON */}
        <View className="absolute bottom-0 left-0 right-0 p-5 bg-[#121212] border-t border-zinc-900">
          <TouchableOpacity
            onPress={handleSaveAddress}
            disabled={isSaving}
            className="w-full bg-[#276ded] active:bg-[#1d55bc] py-4 rounded-2xl items-center justify-center shadow-lg shadow-blue-900/30"
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white font-black text-base tracking-wide">
                Save & Proceed
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* FULL SCREEN MAP MODAL */}
      <Modal visible={isMapExpanded} animationType="slide" transparent={false} onRequestClose={() => setIsMapExpanded(false)}>
        {renderMap(true)}
      </Modal>
    </SafeAreaView>
  );
}