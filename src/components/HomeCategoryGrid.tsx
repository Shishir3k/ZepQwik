import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

interface SubCategory {
  id: string;
  name: string;
  image_url: string;
}

interface CategoryGroup {
  id: string;
  title: string;
  items: SubCategory[];
}

export default function HomeCategoryGrid() {
  const router = useRouter();
  const [sections, setSections] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategoriesAndSubcategories();
  }, []);

  const fetchCategoriesAndSubcategories = async () => {
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
        .eq('is_active', true)
        .order('created_at', { ascending: true }); 

      if (error) throw error;

      if (data) {
        const formattedSections = data.map((category: any) => ({
          id: category.id,
          title: category.name,
          items: category.subcategories?.filter((sub: any) => sub.is_active) || [],
        }));
        
        // 🚀 RESTORED: Only grab the 1st category (Grocery) for the Home Screen
        const populatedSections = formattedSections
          .filter(section => section.items.length > 0)
          .slice(0, 1); 
          
        setSections(populatedSections);
      }
    } catch (error) {
      console.error('Error fetching from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubCategoryPress = (subCategory: SubCategory) => {
    router.push(`/subcategory/${subCategory.id}` as any);
  };

  const handleViewMorePress = (categoryId: string, categoryName: string) => {
    router.push({
      pathname: '/(tabs)/categories',
      params: { id: categoryId, name: categoryName }
    } as any);
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#FACC15" className="mt-10" />;
  }

  return (
    <View className="px-4 pb-4">
      {sections.map((section) => {
        const MAX_ITEMS_BEFORE_MORE = 5; 
        const needsViewMore = section.items.length > MAX_ITEMS_BEFORE_MORE;
        
        const displayItems = needsViewMore 
          ? section.items.slice(0, MAX_ITEMS_BEFORE_MORE) 
          : section.items;

        return (
          <View key={section.id} className="mb-4">
            <Text className="text-white font-black text-[24px] tracking-tight mb-4 ml-1">
              {section.title}
            </Text>

            <View className="flex-row flex-wrap">
              {displayItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSubCategoryPress(item)}
                  activeOpacity={0.7}
                  className="w-1/3 items-center mb-6 px-2"
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
                    className="text-zinc-200 font-bold text-[16px] text-center leading-[18px]"
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}

              {needsViewMore && (
                <TouchableOpacity
                  onPress={() => handleViewMorePress(section.id, section.title)}
                  activeOpacity={0.7}
                  className="w-1/3 items-center mb-6 px-2"
                >
                  <View className="w-[100px] h-[100px] bg-[#222225] border border-zinc-700/50 rounded-[22px] items-center justify-center mb-2.5">
                    <View className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
                      <Feather name="chevron-down" size={24} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text className="text-white font-bold text-[14px] text-center leading-[18px]">
                    See All
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}