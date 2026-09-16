import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

// Component and lib imports require 3 step-backs from src/app/(tabs)/category/
import { supabase } from '../../../lib/supabase';
import HomeTopBar from '../../../components/HomeTopBar';
import HomeSearchAndCategories from '../../../components/HomeSearchAndCategories';
import HomeAdSlider from '../../../components/HomeAdSlider';
import ElectronicsCategoryGrid from '../../../components/electronics/ElectronicsCategoryGrid';
import ElectronicsBrands from '../../../components/electronics/ElectronicsBrands';
import ElectronicsTopDeals from '../../../components/electronics/ElectronicsTopDeals';
import ElectronicsProductSections from '../../../components/electronics/ElectronicsProductSections';

export default function ElectronicsCategoryScreen() {
  const router = useRouter();
  
  // Set to exactly 'Electronics' so the HomeSearchAndCategories component highlights it correctly
  const [activeCategory, setActiveCategory] = useState('electronics');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatId = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', '%electronic%')
        .limit(1)
        .single();
      if (data) setCategoryId(data.id);
    };
    fetchCatId();
  }, []);


  return (
    <View className="flex-1 bg-[#121212]">
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} stickyHeaderIndices={[1]}>
        
        <View className="bg-[#588def] w-full">
          <HomeTopBar />
        </View>

        <View className="bg-[#588def] w-full pb-3">
          <HomeSearchAndCategories 
            activeCategory={activeCategory} 
            setActiveCategory={setActiveCategory} 
          />
        </View>

        <View className="bg-[#121212] flex-1 pb-10">
          <View className="w-full h-[180px] overflow-hidden bg-zinc-800 mb-2">
            <Image 
              // Requires 4 step-backs to reach the root assets folder
              source={require('../../../../assets/categoryBanners/Electronic.png')} 
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>

          {categoryId ? (
            <HomeAdSlider activeCategory={categoryId} />
          ) : (
            <View className="h-[160px] justify-center items-center">
              <ActivityIndicator color="#4f46e5" />
            </View>
          )}

          <ElectronicsBrands />
          <ElectronicsCategoryGrid />
          <ElectronicsTopDeals />
          <ElectronicsProductSections />
        </View>

      </ScrollView>
    </View>
  );
}