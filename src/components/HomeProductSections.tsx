import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  images: string[];
  description: string;
  mrp_price: number;
  selling_price: number;
  stock_quantity: number;
  weight_or_volume: string;
  dietary_type: string;
}

interface Subcategory {
  id: string;
  name: string;
  products: Product[];
}

interface CategorySection {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export default function HomeProductSections() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategorySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEverything();
  }, []);

  const fetchEverything = async () => {
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
            is_active,
            products (
              id,
              name,
              images,
              description,
              mrp_price,
              selling_price,
              stock_quantity,
              weight_or_volume,
              dietary_type,
              is_active
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: true }); // 🚀 Ordered to match Admin app

      if (error) throw error;

      if (data) {
        const formattedFeed = data.map((category: any) => {
          const validSubcategories = (category.subcategories || []).filter(
            (sub: any) => sub.is_active && sub.products && sub.products.length > 0
          );
          const limitedSubcategories = validSubcategories.slice(0, 2);

          return {
            ...category,
            subcategories: limitedSubcategories
          };
        }).filter(cat => cat.subcategories.length > 0); 

        setCategories(formattedFeed);
      }
    } catch (error) {
      console.error('Error fetching home feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}` as any);
  };

  const handleSeeAllPress = (subcategoryId: string, subcategoryName: string) => {
    router.push({
      pathname: '/(tabs)/categories',
      params: { id: subcategoryId, name: subcategoryName }
    } as any);
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#FACC15" className="mt-10 mb-20" />;
  }

  if (categories.length === 0) return null;

  return (
    <View className="px-3 pb-2">
      {categories.map((category) => (
        <View key={category.id} className="mb-2">
          
          <View className="flex-row items-center mb-4 mt-2 px-2">
            <View className="flex-1 h-[1px] bg-zinc-800" />
            <Text className="text-zinc-400 font-black text-[14px] uppercase tracking-[3px] mx-4">
              {category.name}
            </Text>
            <View className="flex-1 h-[1px] bg-zinc-800" />
          </View>

          {category.subcategories.map((subcategory) => {
            const displayItems = subcategory.products.slice(0, 6);
            
            const thumbnailImages = displayItems
              .map(p => (p.images && p.images.length > 0 ? p.images[0] : null))
              .filter(Boolean)
              .slice(0, 3);

            return (
              <View key={subcategory.id} className="mb-4">
                <Text className="text-white font-black text-[22px] tracking-tight mb-4 ml-2 mt-1">
                  {subcategory.name}
                </Text>

                <View className="flex-row flex-wrap">
                  {displayItems.map((item) => {
                    const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
                    const isOutOfStock = item.stock_quantity <= 0;
                    const isVeg = !item.dietary_type || item.dietary_type.toLowerCase() === 'veg';

                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleProductPress(item.id)}
                        activeOpacity={0.9}
                        style={{ width: '33.33%' }}
                        className="px-1.5 mb-3"
                      >
                        <View className="w-full border border-zinc-800/80 bg-[#121212] rounded-[16px] pb-3">
                          
                          <View 
                            className="w-full bg-[#1C1C1E] rounded-t-[16px] relative flex justify-center items-center"
                            style={{ aspectRatio: 1 }}
                          >
                            <View className="absolute top-2 right-2 z-10">
                              <Feather name="heart" size={14} color="#71717A" />
                            </View>

                            {firstImage ? (
                              <Image
                                source={{ uri: firstImage }}
                                className="w-3/4 h-3/4 rounded-[10px]"
                                resizeMode="contain"
                                style={{ opacity: isOutOfStock ? 0.4 : 1 }}
                              />
                            ) : null}

                            {item.dietary_type && item.dietary_type !== 'None' && (
                              <View className="absolute bottom-5 right-2 bg-white rounded-sm p-[2px]">
                                <View className={`border ${isVeg ? 'border-green-700' : 'border-red-700'} w-2.5 h-2.5 items-center justify-center rounded-sm`}>
                                   <View className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-700' : 'bg-red-700'}`} />
                                </View>
                              </View>
                            )}

                            <View className="absolute -bottom-3 left-1 right-1 flex-row justify-between items-end z-20">
                              <View className="bg-[#1C1C1E] border border-zinc-700 px-1.5 py-[3px] rounded mb-0.5 flex-shrink mr-1">
                                <Text className="text-zinc-300 text-[9px] font-bold" numberOfLines={1}>
                                  {item.weight_or_volume || '1 pc'}
                                </Text>
                              </View>

                              {isOutOfStock ? (
                                <View className="bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-lg">
                                  <Text className="text-zinc-400 text-[9px] font-black uppercase tracking-wider">
                                    SOLD
                                  </Text>
                                </View>
                              ) : (
                                <TouchableOpacity 
                                  activeOpacity={0.7}
                                  className="bg-[#121212] border border-green-600 px-3 py-1 rounded-lg"
                                >
                                  <Text className="text-green-500 text-[11px] font-black uppercase tracking-wider">
                                    ADD
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>

                          <View className="h-4" />

                          <View className="px-2">
                            <View className="flex-row items-baseline mt-1">
                              <Text className="text-white font-black text-[15px]">
                                ₹{item.selling_price}
                              </Text>
                              {item.mrp_price && item.mrp_price > item.selling_price ? (
                                <Text className="text-zinc-500 font-medium text-[11px] line-through ml-1.5">
                                  ₹{item.mrp_price}
                                </Text>
                              ) : null}
                            </View>

                            <Text className="text-zinc-100 font-bold text-[13px] leading-[17px] mt-1" numberOfLines={2}>
                              {item.name}
                            </Text>

                            {item.description && item.description !== 'EMPTY' ? (
                              <Text className="text-zinc-400 font-medium text-[11px] leading-[15px] mt-0.5" numberOfLines={2}>
                                {item.description}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {subcategory.products.length > 6 ? (
                  <TouchableOpacity
                    onPress={() => handleSeeAllPress(subcategory.id, subcategory.name)}
                    activeOpacity={0.8}
                    className="mt-1 mx-1.5 mb-2 bg-[#1C1C1E] border border-zinc-800/80 rounded-[14px] py-3.5 flex-row justify-center items-center shadow-sm"
                  >
                    <View className="flex-row mr-2">
                      {thumbnailImages.map((img, idx) => (
                        <Image
                          key={idx}
                          source={{ uri: img as string }}
                          className={`w-6 h-6 rounded-full border-[2px] border-[#1C1C1E] bg-zinc-800 ${idx > 0 ? '-ml-2' : ''}`}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                    <Text className="text-white font-bold text-[13px] mr-1">
                      See all products
                    </Text>
                    <Feather name="chevron-right" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}