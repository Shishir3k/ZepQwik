import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import HomeTopBar from '../../components/HomeTopBar';
import HomeSearchAndCategories from '../../components/HomeSearchAndCategories';
import HomeAdSlider from '../../components/HomeAdSlider';
import HomeCategoryGrid from '../../components/HomeCategoryGrid';
import StoreSections from '../../components/StoreSections'; 
import HomeProductSections from '../../components/HomeProductSections';

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <View className="flex-1 bg-[#121212]">
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        bounces={false}
        stickyHeaderIndices={[1]}
      >
        <LinearGradient
          colors={['#276ded', '#276ded']}
          style={{ width: '100%' }}
        >
          <HomeTopBar />
        </LinearGradient>

        <LinearGradient
          colors={['#276ded', '#121212']}
          locations={[0, 0.9]}
          style={{ width: '100%', paddingBottom: 10 }}
        >
          <HomeSearchAndCategories 
            activeCategory={activeCategory} 
            setActiveCategory={setActiveCategory} 
          />
        </LinearGradient>

        <View className="bg-[#121212]">
          <HomeAdSlider activeCategory={activeCategory} />
          <HomeCategoryGrid />
          <StoreSections /> 
          <HomeProductSections />
        </View>

      </ScrollView>
    </View>
  );
}