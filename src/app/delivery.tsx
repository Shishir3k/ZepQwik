import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function DeliveryDashboard() {
  const router = useRouter();
  
  // Rider States
  const [isOnline, setIsOnline] = useState(true);
  
  // Delivery States (Dummy data for UI building)
  const [hasActiveOrder, setHasActiveOrder] = useState(true);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Simulate verifying the OTP
  const handleVerifyOtp = () => {
    if (enteredOtp.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter a 4-digit OTP.');
      return;
    }
    
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsOtpModalOpen(false);
      setHasActiveOrder(false); // Order completed!
      Alert.alert('Success!', 'Order delivered successfully. Great job!');
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]">
      {/* 🚀 HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#1C1C1E]">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-[#2A2A2E] rounded-full items-center justify-center">
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View className="items-center">
          <Text className="text-white font-black text-[18px]">Rider App</Text>
          <Text className={`font-bold text-[11px] uppercase tracking-widest ${isOnline ? 'text-green-500' : 'text-zinc-500'}`}>
            {isOnline ? '🟢 You are Online' : '🔴 Offline'}
          </Text>
        </View>

        {/* Online/Offline Toggle */}
        <TouchableOpacity 
          onPress={() => setIsOnline(!isOnline)}
          className={`w-12 h-7 rounded-full justify-center px-1 border ${isOnline ? 'bg-green-500/20 border-green-500' : 'bg-zinc-800 border-zinc-600'}`}
        >
          <View className={`w-5 h-5 rounded-full ${isOnline ? 'bg-green-500 self-end' : 'bg-zinc-500 self-start'}`} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        
        {!isOnline ? (
          <View className="flex-1 items-center justify-center py-20">
            <MaterialIcons name="two-wheeler" size={60} color="#3F3F46" className="mb-4" />
            <Text className="text-white font-black text-2xl mb-2">You are Offline</Text>
            <Text className="text-zinc-400 text-center px-6">
              Go online to start receiving delivery requests in your area.
            </Text>
          </View>
        ) : !hasActiveOrder ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#22C55E" className="mb-6" />
            <Text className="text-white font-black text-xl mb-2">Looking for orders...</Text>
            <Text className="text-zinc-400 text-center px-6">
              Stay in your zone. We will notify you when an order is ready for pickup.
            </Text>
          </View>
        ) : (
          /* ---------------------------------------------------
             🟢 ACTIVE ORDER CARD
             --------------------------------------------------- */
          <View>
            <Text className="text-white font-black text-xl mb-4">Current Delivery</Text>

            <View className="bg-[#1C1C1E] border border-zinc-800 rounded-3xl overflow-hidden shadow-lg mb-6">
              
              {/* Order Header */}
              <View className="bg-green-500 px-5 py-3 flex-row justify-between items-center">
                <Text className="text-white font-black text-lg">Order #4092</Text>
                <Text className="text-green-900 font-bold text-sm bg-white/30 px-2 py-1 rounded-md">
                  12 Mins left
                </Text>
              </View>

              {/* Pickup & Drop Details */}
              <View className="p-5">
                
                {/* Pickup */}
                <View className="flex-row mb-6 relative">
                  <View className="items-center mr-4">
                    <View className="w-3 h-3 bg-zinc-500 rounded-full mb-1" />
                    <View className="w-0.5 h-12 bg-zinc-700" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider mb-1">Pickup From</Text>
                    <Text className="text-white font-black text-[16px] mb-1">Bhayankar Motors (Store)</Text>
                    <Text className="text-zinc-400 font-medium text-xs">Civil Lines, Prayagraj</Text>
                  </View>
                </View>

                {/* Drop */}
                <View className="flex-row">
                  <View className="items-center mr-4">
                    <View className="w-3 h-3 bg-green-500 rounded-full" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-green-500 font-bold text-[10px] uppercase tracking-wider mb-1">Deliver To</Text>
                    <Text className="text-white font-black text-[16px] mb-1">Rahul Sharma</Text>
                    <Text className="text-zinc-400 font-medium text-xs mb-3 leading-5">
                      Flat 402, Sunshine Apartments, {'\n'}Near Petrol Pump, Civil Lines, Prayagraj
                    </Text>
                  </View>
                </View>

              </View>

              {/* Action Buttons (Call & Map) */}
              <View className="flex-row px-4 pb-4 space-x-3">
                <TouchableOpacity className="flex-1 bg-[#2A2A2E] py-3.5 rounded-xl flex-row items-center justify-center border border-zinc-700 mr-2">
                  <Feather name="phone-call" size={16} color="#FFFFFF" />
                  <Text className="text-white font-bold text-sm ml-2">Call</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-blue-600/20 py-3.5 rounded-xl flex-row items-center justify-center border border-blue-500/50 ml-2">
                  <Feather name="navigation" size={16} color="#60A5FA" />
                  <Text className="text-blue-400 font-bold text-sm ml-2">Map</Text>
                </TouchableOpacity>
              </View>

              {/* Main Action Button */}
              <TouchableOpacity 
                onPress={() => setIsOtpModalOpen(true)}
                className="bg-green-600 m-4 mt-0 py-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-green-900/20"
              >
                <Feather name="check-circle" size={20} color="#FFFFFF" />
                <Text className="text-white font-black text-[16px] uppercase tracking-wide ml-2">
                  Mark as Delivered
                </Text>
              </TouchableOpacity>
            </View>

            {/* Earnings Snippet */}
            <View className="bg-[#1C1C1E] border border-zinc-800 p-4 rounded-2xl flex-row justify-between items-center">
              <View>
                <Text className="text-zinc-400 font-bold text-xs">Expected Earning</Text>
                <Text className="text-white font-black text-xl">₹45.00</Text>
              </View>
              <FontAwesome5 name="rupee-sign" size={24} color="#22C55E" />
            </View>

          </View>
        )}
      </ScrollView>

      {/* ---------------------------------------------------
          🔐 OTP CONFIRMATION MODAL
          --------------------------------------------------- */}
      <Modal visible={isOtpModalOpen} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1C1C1E] rounded-t-3xl p-6 border-t border-zinc-800 pb-10">
            
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-white font-black text-2xl">Confirm Delivery</Text>
                <Text className="text-zinc-400 font-medium text-sm mt-1">Ask the customer for their 4-digit PIN.</Text>
              </View>
              <TouchableOpacity onPress={() => setIsOtpModalOpen(false)} className="bg-[#2A2A2E] p-2 rounded-full">
                <Feather name="x" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TextInput 
              className="bg-[#121212] text-white text-center text-3xl tracking-[10px] p-5 rounded-2xl border border-zinc-700 mb-6 font-black"
              placeholder="----" 
              placeholderTextColor="#52525B" 
              keyboardType="number-pad"
              maxLength={4}
              value={enteredOtp}
              onChangeText={setEnteredOtp}
              autoFocus
            />

            <TouchableOpacity 
              onPress={handleVerifyOtp} disabled={isVerifying}
              className={`py-4 rounded-xl items-center shadow-lg flex-row justify-center ${enteredOtp.length === 4 ? 'bg-green-600' : 'bg-zinc-700'}`}
            >
              {isVerifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="unlock" size={18} color={enteredOtp.length === 4 ? '#FFFFFF' : '#A1A1AA'} />
                  <Text className={`font-black text-[16px] uppercase tracking-wide ml-2 ${enteredOtp.length === 4 ? 'text-white' : 'text-zinc-400'}`}>
                    Verify & Deliver
                  </Text>
                </>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}