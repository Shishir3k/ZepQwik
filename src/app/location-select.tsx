import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAddress } from '../context/AddressContext';
import { useRouter } from 'expo-router';

// Darkstore coordinates for distance calculation
const DARKSTORE_LOCATION = { latitude: 28.5355, longitude: 77.3910 };

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

export default function LocationSelectScreen() {
  const router = useRouter();
  const {
    savedAddresses = [],
    selectedAddress,
    selectAddress,
    deleteAddress,
    checkCurrentLocation,
  } = useAddress() || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [activeOptionAddress, setActiveOptionAddress] = useState<any | null>(null);

  // Filter saved addresses based on search
  const filteredAddresses = useMemo(() => {
    if (!searchQuery.trim()) return savedAddresses;
    return savedAddresses.filter((addr) => {
      const fullText = `${addr.tag || ''} ${addr.complete_address || ''} ${addr.area_street || ''} ${addr.city || ''}`.toLowerCase();
      return fullText.includes(searchQuery.toLowerCase().trim());
    });
  }, [savedAddresses, searchQuery]);

  const handleUseCurrentLocation = async () => {
    if (checkCurrentLocation) {
      await checkCurrentLocation();
    }
    router.replace('/(tabs)' as any);
  };

  const handleAddNewAddress = () => {
    router.push('/add-address' as any);
  };

  const handleSelect = (addr: any) => {
    selectAddress?.(addr);
    router.replace('/(tabs)' as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212] px-5 pt-2" edges={['top', 'left', 'right']}>
      {/* HEADER WITH CLOSE BUTTON */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white font-black text-2xl tracking-tight">
          Select delivery location
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 bg-zinc-900 rounded-full items-center justify-center border border-zinc-800"
        >
          <Feather name="x" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View className="flex-row items-center bg-[#18181B] border border-zinc-800 rounded-2xl px-4 py-3 mb-4">
        <Feather name="search" size={18} color="#71717a" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for area, street name..."
          placeholderTextColor="#71717a"
          className="flex-1 text-white font-semibold text-sm ml-3"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x-circle" size={16} color="#71717a" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* QUICK ACTION LIST */}
        <View className="space-y-2.5 mb-6">
          {/* USE CURRENT LOCATION */}
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            className="bg-[#18181B] border border-zinc-800/80 p-4 rounded-2xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Feather name="crosshair" size={20} color="#22C55E" />
              <Text className="text-brand-green font-extrabold text-base ml-3.5">
                Use current location
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#71717a" />
          </TouchableOpacity>

          {/* ADD NEW ADDRESS */}
          <TouchableOpacity
            onPress={handleAddNewAddress}
            className="bg-[#18181B] border border-zinc-800/80 p-4 rounded-2xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Feather name="plus" size={20} color="#22C55E" />
              <Text className="text-brand-green font-extrabold text-base ml-3.5">
                Add new address
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#71717a" />
          </TouchableOpacity>
        </View>

        {/* SAVED ADDRESSES */}
        <View className="pb-12">
          <Text className="text-zinc-400 font-bold text-xs uppercase tracking-wider mb-3 px-1">
            Your saved addresses
          </Text>

          {filteredAddresses && filteredAddresses.length > 0 ? (
            filteredAddresses.map((addr) => {
              const lat = addr.latitude ? parseFloat(addr.latitude) : 28.5355;
              const lng = addr.longitude ? parseFloat(addr.longitude) : 77.3910;
              const dist = calculateDistanceKm(
                DARKSTORE_LOCATION.latitude,
                DARKSTORE_LOCATION.longitude,
                lat,
                lng
              ).toFixed(2);

              const isSelected = selectedAddress?.id === addr.id;

              return (
                <TouchableOpacity
                  key={addr.id}
                  activeOpacity={0.8}
                  onPress={() => handleSelect(addr)}
                  className={`bg-[#18181B] p-4 rounded-3xl mb-3.5 border ${
                    isSelected ? 'border-brand-yellow' : 'border-zinc-800'
                  }`}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-row items-start flex-1 mr-2">
                      {/* ICON & DISTANCE BADGE */}
                      <View className="items-center mr-3.5">
                        <View className="w-12 h-12 bg-zinc-900 rounded-2xl items-center justify-center border border-zinc-800">
                          <FontAwesome5
                            name={addr.tag === 'Work' ? 'briefcase' : addr.tag === 'Hotel' ? 'hotel' : 'home'}
                            size={18}
                            color="#FACC15"
                          />
                        </View>
                        <View className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-md mt-1.5">
                          <Text className="text-[10px] font-extrabold text-zinc-400">
                            {dist} km
                          </Text>
                        </View>
                      </View>

                      {/* ADDRESS INFO */}
                      <View className="flex-1 pt-0.5">
                        <Text className="text-white font-black text-base">
                          {addr.tag || 'Home'}
                        </Text>
                        <Text className="text-zinc-400 font-semibold text-xs mt-1 leading-4" numberOfLines={2}>
                          {addr.complete_address || `${addr.house_flat_no || ''}, ${addr.area_street || ''}, ${addr.city || ''}`}
                        </Text>
                        <Text className="text-zinc-400 font-medium text-xs mt-2.5">
                          Phone number: <Text className="text-zinc-300 font-bold">{addr.receiver_phone || addr.user_phone}</Text>
                        </Text>
                      </View>
                    </View>

                    {/* PIN / MORE OPTIONS */}
                    <View className="flex-row items-center space-x-1">
                      {isSelected && (
                        <MaterialIcons name="push-pin" size={18} color="#FACC15" />
                      )}
                      <TouchableOpacity
                        onPress={() => setActiveOptionAddress(addr)}
                        className="p-1.5"
                      >
                        <Feather name="more-horizontal" size={20} color="#a1a1aa" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View className="py-8 items-center justify-center bg-[#18181B] rounded-3xl border border-zinc-800">
              <Feather name="map-pin" size={28} color="#52525b" />
              <Text className="text-zinc-400 font-bold text-sm mt-2">
                No saved addresses found.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* OPTIONS BOTTOM SHEET (DELETE / EDIT / SET DEFAULT) */}
      {activeOptionAddress && (
        <Modal transparent animationType="fade">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setActiveOptionAddress(null)}
            className="flex-1 bg-black/70 justify-end"
          >
            <View className="bg-[#18181B] border-t border-zinc-800 p-5 rounded-t-3xl space-y-2.5 pb-8">
              <Text className="text-white font-black text-lg mb-2">
                Select option
              </Text>

              {/* DELETE */}
              <TouchableOpacity
                onPress={() => {
                  deleteAddress?.(activeOptionAddress.id);
                  setActiveOptionAddress(null);
                }}
                className="py-3.5 px-4 bg-zinc-900 rounded-2xl flex-row items-center justify-between border border-zinc-800"
              >
                <View className="flex-row items-center">
                  <Feather name="trash-2" size={18} color="#ef4444" />
                  <Text className="text-red-500 font-bold text-sm ml-3.5">
                    Delete address
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color="#71717a" />
              </TouchableOpacity>

              {/* EDIT */}
              <TouchableOpacity
                onPress={() => {
                  setActiveOptionAddress(null);
                  router.push('/add-address' as any);
                }}
                className="py-3.5 px-4 bg-zinc-900 rounded-2xl flex-row items-center justify-between border border-zinc-800"
              >
                <View className="flex-row items-center">
                  <Feather name="edit-2" size={18} color="#FFFFFF" />
                  <Text className="text-white font-bold text-sm ml-3.5">
                    Edit address
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color="#71717a" />
              </TouchableOpacity>

              {/* SET AS ACTIVE */}
              <TouchableOpacity
                onPress={() => {
                  handleSelect(activeOptionAddress);
                  setActiveOptionAddress(null);
                }}
                className="py-3.5 px-4 bg-zinc-900 rounded-2xl flex-row items-center justify-between border border-zinc-800"
              >
                <View className="flex-row items-center">
                  <Feather name="map-pin" size={18} color="#22C55E" />
                  <Text className="text-white font-bold text-sm ml-3.5">
                    Set as delivery address
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color="#71717a" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}