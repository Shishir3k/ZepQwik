import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// 🚀 Explicitly define props interface
interface Props {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

const QUICK_CATEGORIES = [
  { id: 'all', name: 'All', icon: 'basket-outline' },
  { id: 'rakhi', name: 'Rakhi', icon: 'decagram-outline' },
  { id: 'electronics', name: 'Electronics', icon: 'headphones' },
  { id: 'beauty', name: 'Beauty', icon: 'face-woman-shimmer' },
  { id: 'pharmacy', name: 'Pharmacy', icon: 'pill' },
  { id: 'kids', name: 'Kids', icon: 'teddy-bear' },
];

const SEARCH_ITEMS = ['"milk"', '"chips"', '"bread"', '"cold drinks"', '"plants"', '"sweets"'];

export default function HomeSearchAndCategories({ activeCategory, setActiveCategory }: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animation values
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setCurrentIndex((prev) => (prev + 1) % SEARCH_ITEMS.length);
        translateY.setValue(20);
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [translateY, opacity]);

  return (
    <View className="pb-3">

      {/* SEARCH BAR */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/search' as any)}
        className="mx-4 mb-6 flex-row items-center bg-[#2A2A2E] rounded-2xl px-4 py-3.5 shadow-sm"
      >
        <Feather name="search" size={22} color="#FFFFFF" className="opacity-90" />

        <View className="flex-1 ml-3 relative justify-center h-6 overflow-hidden">
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              flexDirection: 'row',
              alignItems: 'center',
              left: 0,
              right: 0,
            }}
          >
            <Text className="text-[#A1A1AA] font-medium text-[16px]">
              Search{' '}
            </Text>

            <Animated.View
              style={{
                transform: [{ translateY }],
                opacity,
              }}
            >
              <Text className="text-[#A1A1AA] font-medium text-[16px]">
                {SEARCH_ITEMS[currentIndex]}
              </Text>
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>

      {/* CATEGORIES HORIZONTAL SCROLL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {QUICK_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => {
                // 🚀 Only route the user. The new page will automatically set its own active state!
                if (cat.id === 'all') {
                  router.push('/(tabs)' as any);
                } else {
                  router.push(`/category/${cat.id}` as any);
                }
              }}
              className="items-center mr-8"
            >
              <View className="mb-1.5 h-8 items-center justify-end">
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={28}
                  color="#FFFFFF"
                  style={{ opacity: isActive ? 1 : 0.8 }}
                />
              </View>

              <Text
                className={`text-white text-[13px] tracking-wide ${isActive ? 'font-black' : 'font-medium opacity-80'
                  }`}
              >
                {cat.name}
              </Text>

              {isActive ? (
                <View className="w-8 h-[3px] bg-white rounded-full mt-2" />
              ) : (
                <View className="w-8 h-[3px] bg-transparent mt-2" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

    </View>
  );
}