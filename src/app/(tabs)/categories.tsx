import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import HomeTopBar from '../../components/HomeTopBar';
import HomeSearchAndCategories from '../../components/HomeSearchAndCategories';

interface SubCategory {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
}

interface CategoryGroup {
  id: string;
  name: string;
  subcategories: SubCategory[];
}

export default function CategoriesScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllCategories();
  }, []);

  const fetchAllCategories = async () => {
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
        // 🚀 FIXED: Now orders exactly by the rank/time they were created in the Admin App!
        // (Note: If you added a specific 'sort_order' column to your categories table, change 'created_at' to 'sort_order')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedData = data
          .map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            subcategories: (cat.subcategories || []).filter((sub: any) => sub.is_active),
          }))
          .filter(cat => cat.subcategories.length > 0);

        setCategories(formattedData);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubCategoryPress = (subCategory: SubCategory) => {
    router.push(`/subcategory/${subCategory.id}` as any);
  };

  return (
    <View className="flex-1 bg-[#121212]">
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        bounces={false}
        stickyHeaderIndices={[1]}
      >
        
        {/* INDEX 0: Top Bar with solid yellow background extension */}
        <LinearGradient
          colors={['#E6AF19', '#E6AF19']}
          style={{ width: '100%' }}
        >
          <HomeTopBar />
        </LinearGradient>

        {/* INDEX 1: Sticky Search & Categories with seamless gradient blending */}
        <LinearGradient
          colors={['#E6AF19', '#121212']}
          locations={[0, 0.9]}
          style={{ width: '100%', paddingBottom: 10 }}
        >
          <HomeSearchAndCategories 
            activeCategory={activeCategory} 
            setActiveCategory={setActiveCategory} 
          />
        </LinearGradient>

        {/* INDEX 2: Main Content Grid & Footer */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-20 bg-[#121212]">
            <ActivityIndicator size="large" color="#FACC15" />
          </View>
        ) : (
          <View className="px-4 pt-4 bg-[#121212]">
            {categories.map((category) => (
              <View key={category.id} className="mb-8">
                <Text className="text-white font-black text-[22px] tracking-tight mb-5 ml-1">
                  {category.name}
                </Text>

                <View className="flex-row flex-wrap">
                  {category.subcategories.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleSubCategoryPress(item)}
                      activeOpacity={0.7}
                      className="w-1/3 items-center mb-6 px-1.5"
                    >
                      <View className="w-[100px] h-[100px] bg-[#222225] rounded-[22px] items-center justify-center mb-2.5 overflow-hidden shadow-sm border border-zinc-800/50">
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
                        className="text-zinc-200 font-bold text-[14px] text-center leading-[18px]"
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* 🚀 BLINKIT-STYLE FOOTER */}
            <View className="mt-8 mb-24 items-center py-10 border-t border-zinc-900/50">
              <Text className="text-[#3F3F46] font-black text-[36px] tracking-tighter text-center leading-[38px]">
                India's last{'\n'}minute app <Text className="text-[#F43F5E]">❤️</Text>
              </Text>
              
              <View className="w-full h-[1px] bg-zinc-800/50 my-6" />
              
              <Text className="text-zinc-700 font-black text-2xl tracking-tighter">
                zepqwik
              </Text>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}