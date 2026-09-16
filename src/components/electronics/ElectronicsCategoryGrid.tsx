import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase'; // Adjust path if needed

interface SubCategory {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
}

interface CategoryGroup {
  id: string;
  title: string;
  items: SubCategory[];
}

export default function ElectronicsCategoryGrid() {
  const router = useRouter();
  const [section, setSection] = useState<CategoryGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchElectronicsSubcategories();
  }, []);

  const fetchElectronicsSubcategories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          subcategories (
            id,
            name,
            image_url,
            is_active
          )
        `)
        .ilike('name', '%electronic%')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) throw error;

      if (data && data.subcategories) {
        const activeSubcategories = data.subcategories.filter((sub: any) => sub.is_active !== false);
        
        setSection({
          id: data.id,
          title: data.name,
          items: activeSubcategories,
        });
      }
    } catch (error) {
      console.error('Error fetching electronics subcategories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubCategoryPress = (subCategory: SubCategory) => {
    router.push(`/subcategory/${subCategory.id}` as any);
  };

  const handleViewMorePress = (categoryId: string, categoryNameVal: string) => {
    router.push({
      pathname: '/(tabs)/categories',
      params: { id: categoryId, name: categoryNameVal }
    } as any);
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#4f46e5" className="mt-10 mb-10" />;
  }

  if (!section || section.items.length === 0) return null;

  const MAX_ITEMS_BEFORE_MORE = 5; 
  const needsViewMore = section.items.length > MAX_ITEMS_BEFORE_MORE;
  
  const displayItems = needsViewMore 
    ? section.items.slice(0, MAX_ITEMS_BEFORE_MORE) 
    : section.items;

  return (
    <View className="px-4 pb-4 mt-4">
      {/* 🚀 NEW HEADING ADDED */}
      <Text className="text-white font-black text-[22px] tracking-tight mb-4 ml-1">
        Shop by Category
      </Text>

      {/* 🚀 FIXED GRID LAYOUT: Removed justify-between so items align left-to-right naturally */}
      <View className="flex-row flex-wrap">
        
        {/* Render Active Subcategories */}
        {displayItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleSubCategoryPress(item)}
            activeOpacity={0.7}
            // 🚀 Changed to w-1/3 for a perfect 3-column left-aligned grid
            className="w-1/3 items-center mb-6 px-1"
          >
            <View className="w-[100px] h-[100px] bg-[#222225] rounded-[22px] items-center justify-center mb-2.5 overflow-hidden shadow-sm">
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Feather name="image" size={28} color="#52525B" />
              )}
            </View>
            <Text 
              className="text-zinc-200 font-bold text-[14px] text-center leading-[16px] px-1"
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Render "See All" Button if items exceed limit */}
        {needsViewMore && (
          <TouchableOpacity
            onPress={() => handleViewMorePress(section.id, section.title)}
            activeOpacity={0.7}
            className="w-1/3 items-center mb-6 px-1"
          >
            <View className="w-[100px] h-[100px] bg-[#222225] border border-zinc-700/50 rounded-[22px] items-center justify-center mb-2.5">
              <View className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
                <Feather name="chevron-down" size={24} color="#FFFFFF" />
              </View>
            </View>
            <Text className="text-white font-bold text-[14px] text-center leading-[16px]">
              See All
            </Text>
          </TouchableOpacity>
        )}
        
      </View>
    </View>
  );
}