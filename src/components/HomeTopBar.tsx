import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAddress } from '../context/AddressContext';

export default function HomeTopBar() {
  const router = useRouter();
  const { selectedAddress } = useAddress() || {};

  const [deliveryTime, setDeliveryTime] = useState('15 minutes');
  
  // 🚀 DEV MODE: Toggle these to 'true' to build their screens without logging in!
  const [isMerchant, setIsMerchant] = useState(false); 
  const [isRider, setIsRider] = useState(false); // <-- Turned ON to build Rider App

  useEffect(() => {
    fetchSettings();
    // 🚀 Uncomment this when you want real database verification!
    // checkUserRoles();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('app_settings')
        .select('avg_delivery_time')
        .single();

      if (!error && settings?.avg_delivery_time) {
        setDeliveryTime(settings.avg_delivery_time);
      }
    } catch (error) {
      console.error('Error fetching delivery time:', error);
    }
  };

  const checkUserRoles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        let phoneToCheck = user.phone || '';
        if (phoneToCheck.startsWith('+91')) phoneToCheck = phoneToCheck.substring(3);
        else if (phoneToCheck.startsWith('+')) phoneToCheck = phoneToCheck.substring(1);

        const emailToCheck = user.email || '';

        let queryConditions = [];
        if (phoneToCheck) queryConditions.push(`phone.eq.${phoneToCheck}`);
        if (emailToCheck) queryConditions.push(`email.eq.${emailToCheck}`);

        if (queryConditions.length > 0) {
          const conditionString = queryConditions.join(',');

          // 1. Check if user is a Merchant
          const { data: merchantData } = await supabase
            .from('merchants')
            .select('id')
            .or(conditionString)
            .eq('is_active', true)
            .maybeSingle();
          if (merchantData) setIsMerchant(true);

          // 2. Check if user is a Delivery Rider
          const { data: riderData } = await supabase
            .from('delivery_partners') 
            .select('id')
            .or(conditionString)
            .eq('is_active', true)
            .maybeSingle();
          if (riderData) setIsRider(true);
        }
      }
    } catch (error) {
      console.error('Error checking user roles:', error);
    }
  };

  const addressTag = selectedAddress?.tag ? selectedAddress.tag.toUpperCase() : 'HOME';
  const addressDetails = selectedAddress
    ? `${selectedAddress.house_flat_no || ''} ${selectedAddress.area_street || selectedAddress.city || ''}`
    : 'Select your location';

  return (
    <SafeAreaView edges={['top']} className="px-4 pb-4">
      <View className="flex-row justify-between items-start mt-2">
        {/* LEFT: App Name + Time */}
        <View className="flex-1 mr-4">
          <Text className="text-white font-extrabold text-[13px] tracking-wide opacity-95">Zepqwik in</Text>
          
          {/* 🚀 AUTO-SHRINK FIX: Forces text to 1 line and scales down on smaller phones */}
          <Text 
            className="text-white font-black text-[34px] tracking-tighter" 
            style={{ marginTop: -2 }}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.6}
          >
            {deliveryTime}
          </Text>
        </View>

        {/* RIGHT: Action Icons */}
        <View className="flex-row items-center mt-1">
          
          {/* 🚀 DELIVERY RIDER BUTTON */}
          {isRider && (
            <TouchableOpacity 
              onPress={() => router.push('/delivery')}
              activeOpacity={0.8}
              className="w-[42px] h-[42px] bg-black/30 rounded-full items-center justify-center mr-3 border border-green-500/50"
            >
              <MaterialIcons name="two-wheeler" size={20} color="#22C55E" />
            </TouchableOpacity>
          )}

          {/* 🚀 MERCHANT BUTTON */}
          {isMerchant && (
            <TouchableOpacity 
              onPress={() => router.push('/merchant')}
              activeOpacity={0.8}
              className="w-[42px] h-[42px] bg-black/30 rounded-full items-center justify-center mr-3 border border-[#FACC15]/50"
            >
              <MaterialIcons name="storefront" size={20} color="#FACC15" />
            </TouchableOpacity>
          )}

          {/* Notification Bell */}
          <TouchableOpacity className="w-[42px] h-[42px] bg-black/30 rounded-full items-center justify-center">
            <Feather name="bell" size={20} color="#FFFFFF" />
            <View className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#b58814]" />
          </TouchableOpacity>
          
        </View>
      </View>

      <TouchableOpacity onPress={() => router.push('/location-select' as any)} className="flex-row items-center mt-2">
        <Text className="text-white text-[15px] opacity-90" numberOfLines={1}>
          <Text className="font-black">{addressTag}</Text>
          <Text className="font-medium"> - {addressDetails}</Text>
        </Text>
        <MaterialCommunityIcons name="menu-down" size={22} color="#FFFFFF" style={{ opacity: 0.9, marginLeft: 2 }} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}