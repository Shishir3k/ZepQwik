import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';

import HomeTopBar from '../../../components/HomeTopBar';
import HomeSearchAndCategories from '../../../components/HomeSearchAndCategories';
import HomeAdSlider from '../../../components/HomeAdSlider';
import PharmacyCategoryGrid from '../../../components/pharmacy/PharmacyCategoryGrid';
import PharmacyBrands from '../../../components/pharmacy/PharmacyBrands';
import PharmacyTopDeals from '../../../components/pharmacy/PharmacyTopDeals';
import PharmacyProductSections from '../../../components/pharmacy/PharmacyProductSections';

export default function PharmacyCategoryScreen() {
  const router = useRouter();
  
  // Lowercase 'pharmacy' matches your HomeSearchAndCategories array ID exactly
  const [activeCategory, setActiveCategory] = useState('pharmacy');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatId = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', '%pharmacy%')
        .limit(1)
        .single();
      if (data) setCategoryId(data.id);
    };
    fetchCatId();
  }, []);

  return (
    <View className="flex-1 bg-[#121212]">
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} stickyHeaderIndices={[1]}>
        
        <View className="bg-[#6ed860] w-full">
          <HomeTopBar />
        </View>

        <View className="bg-[#6ed860] w-full pb-3">
          <HomeSearchAndCategories 
            activeCategory={activeCategory} 
            setActiveCategory={setActiveCategory} 
          />
        </View>

        <View className="bg-[#121212] flex-1 pb-10">
          <View className="w-full h-[180px] overflow-hidden bg-zinc-800 mb-2">
            <Image 
              // Pointing 4 levels up to the root assets folder
              source={require('../../../../assets/categoryBanners/Pharmacy.png')} 
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

          <PharmacyCategoryGrid />
          <PharmacyBrands />
          <PharmacyTopDeals />
          <PharmacyProductSections />
        </View>

      </ScrollView>
    </View>
  );
}