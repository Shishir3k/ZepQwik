import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Feather } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { profile, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-[#121212] px-6 pt-6">
      <Text className="text-white text-3xl font-extrabold mb-8 tracking-tight">Profile</Text>

      {/* User Details Card */}
      <View className="bg-[#1C1C1E] border border-zinc-800 rounded-[20px] p-6 mb-8 items-center shadow-sm">
        <View className="w-20 h-20 bg-[#276ded] rounded-full items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
          <Feather name="user" size={32} color="#FFFFFF" />
        </View>
        <Text className="text-white text-xl font-bold">{profile?.full_name || 'Loading...'}</Text>
        <Text className="text-zinc-400 mt-1">{profile?.email || 'No Email'}</Text>
        {profile?.phone_number && (
          <Text className="text-zinc-500 mt-1">+91 {profile.phone_number}</Text>
        )}
      </View>

      {/* Temp Logout Button */}
      <TouchableOpacity
        onPress={logout}
        activeOpacity={0.8}
        className="bg-red-500/10 border border-red-500/30 rounded-2xl h-14 flex-row items-center justify-center active:scale-[0.98] transition-transform"
      >
        <Feather name="log-out" size={20} color="#EF4444" />
        <Text className="text-red-500 text-base font-bold ml-3 tracking-wide">LOG OUT</Text>
      </TouchableOpacity>
      
    </SafeAreaView>
  );
}