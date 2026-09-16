import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAddress } from '../context/AddressContext';
import LocationSelectModal from '../app/location-select';

export default function UnserviceableScreen() {
  const { selectedAddress } = useAddress();
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);

  const displayLocationName =
    selectedAddress?.area_street || selectedAddress?.city || 'Detecting Location...';

  return (
    <SafeAreaView className="flex-1 bg-[#231215]">
      {/* TOP BAR */}
      <View className="px-5 py-4 flex-row justify-between items-center border-b border-red-900/30">
        <TouchableOpacity
          onPress={() => setLocationModalVisible(true)}
          className="flex-1"
        >
          <Text className="text-red-500 font-extrabold text-lg tracking-tight">
            Unserviceable area
          </Text>
          <View className="flex-row items-center mt-0.5">
            <Text
              className="text-zinc-300 font-bold text-sm mr-1"
              numberOfLines={1}
            >
              {displayLocationName}
            </Text>
            <Feather name="chevron-down" size={16} color="#a1a1aa" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="w-9 h-9 bg-zinc-800/80 rounded-full items-center justify-center border border-zinc-700">
          <Feather name="user" size={18} color="#e4e4e7" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        {/* HERO MESSAGE */}
        <View className="items-center my-6">
          <Text className="text-white text-2xl font-black text-center mb-1">
            Hello!
          </Text>
          <Text className="text-zinc-200 text-lg font-bold text-center mb-1">
            It's not you, it's us.
          </Text>
          <Text className="text-zinc-300 text-base font-semibold text-center mb-1">
            We are not serving this area at the moment.
          </Text>
          <Text className="text-zinc-400 text-sm font-medium text-center">
            Sorry for the inconvenience 😔
          </Text>
        </View>

        {/* STORE CLOSED GRAPHIC */}
        <View className="items-center justify-center my-6 py-8">
          <View className="w-48 h-32 bg-red-950/40 border border-red-800/40 rounded-3xl items-center justify-center relative">
            <View className="absolute -top-3 bg-red-500/90 px-3 py-1 rounded-full">
              <Text className="text-white text-[10px] font-black uppercase tracking-wider">
                Store closed
              </Text>
            </View>
            <FontAwesome5 name="store-slash" size={42} color="#f87171" />
          </View>
        </View>

        {/* HELPFUL OPTIONS LIST */}
        <View className="space-y-3 mt-4">
          <TouchableOpacity className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-9 h-9 bg-zinc-800 rounded-xl items-center justify-center mr-3">
                <Feather name="help-circle" size={18} color="#e4e4e7" />
              </View>
              <Text className="text-zinc-200 font-bold text-sm">
                Need help with your previous orders?
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#71717a" />
          </TouchableOpacity>

          <TouchableOpacity className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-9 h-9 bg-zinc-800 rounded-xl items-center justify-center mr-3">
                <Feather name="info" size={18} color="#e4e4e7" />
              </View>
              <Text className="text-zinc-200 font-bold text-sm">About us</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#71717a" />
          </TouchableOpacity>

          <TouchableOpacity className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-9 h-9 bg-zinc-800 rounded-xl items-center justify-center mr-3">
                <Ionicons name="logo-instagram" size={18} color="#e4e4e7" />
              </View>
              <Text className="text-zinc-200 font-bold text-sm">
                Follow us on Instagram for updates
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#71717a" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* LOCATION SELECTOR DRAWER MODAL */}
      <LocationSelectModal
        visible={isLocationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />
    </SafeAreaView>
  );
}