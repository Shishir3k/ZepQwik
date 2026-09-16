import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

interface Product {
  id: string;
  name: string;
  images: string[];
  description: string;
  mrp_price: number;
  selling_price: number;
  stock_quantity: number;
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

export default function ElectronicsProductSections() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategorySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchElectronicsProducts();
  }, []);

  const fetchElectronicsProducts = async () => {
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
              is_active
            )
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        const targetCategories = data.filter((cat: any) => 
          cat.name.toLowerCase().includes('electronic')
        );

        const formattedFeed = targetCategories.map((category: any) => {
          const validSubcategories = (category.subcategories || []).filter(
            (sub: any) => sub.is_active && sub.products && sub.products.length > 0
          );
          return { ...category, subcategories: validSubcategories };
        }).filter(cat => cat.subcategories.length > 0); 

        setCategories(formattedFeed);
      }
    } catch (error) {
      console.error('Error fetching electronics product sections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}` as any);
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#FACC15" className="mt-10 mb-20" />;
  }

  if (categories.length === 0) return null;

  return (
    <View className="px-3 pb-2">
      {categories.map((category) => (
        <View key={category.id} className="mb-2">
          {category.subcategories.map((subcategory) => {
            const displayItems = subcategory.products.slice(0, 6);

            return (
              <View key={subcategory.id} className="mb-4">
                <Text className="text-white font-black text-[22px] tracking-tight mb-4 ml-2 mt-1">
                  {subcategory.name}
                </Text>

                <View className="flex-row flex-wrap">
                  {displayItems.map((item) => {
                    const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
                    const isOutOfStock = item.stock_quantity <= 0;
                    
                    const formattedSellingPrice = Number(item.selling_price).toLocaleString('en-IN');
                    const formattedMrpPrice = item.mrp_price ? Number(item.mrp_price).toLocaleString('en-IN') : null;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleProductPress(item.id)}
                        activeOpacity={0.9}
                        className="w-1/3 px-1.5 mb-4"
                      >
                        {/* Premium Card Wrapper */}
                        <View className="w-full bg-[#1a1a1c] border border-zinc-800/60 rounded-[16px] p-2 pb-3">
                          
                          {/* Image Box */}
                          <View className="w-full aspect-square bg-[#222225] rounded-[12px] relative flex justify-center items-center mb-3">
                            <View className="absolute top-2 right-2 z-10">
                              <Feather name="heart" size={14} color="#71717A" />
                            </View>

                            {firstImage ? (
                              <Image
                                source={{ uri: firstImage }}
                                className="w-3/4 h-3/4"
                                resizeMode="contain"
                                style={{ opacity: isOutOfStock ? 0.4 : 1 }}
                              />
                            ) : null}

                            <View className="absolute -bottom-3 right-1 z-20">
                              {isOutOfStock ? (
                                <View className="bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-lg">
                                  <Text className="text-zinc-400 text-[9px] font-black uppercase tracking-wider">
                                    SOLD
                                  </Text>
                                </View>
                              ) : (
                                <TouchableOpacity 
                                  activeOpacity={0.7}
                                  className="bg-[#1a1a1c] border border-green-600 px-3 py-1 rounded-lg shadow-sm"
                                >
                                  <Text className="text-green-500 text-[11px] font-black uppercase tracking-wider">
                                    ADD
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>

                          {/* Typography Details */}
                          <View className="px-1 mt-1">
                            <View className="flex-row items-baseline overflow-hidden">
                              <Text 
                                className="text-white font-black text-[13px]"
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.7}
                              >
                                ₹{formattedSellingPrice}
                              </Text>
                              {formattedMrpPrice && item.mrp_price > item.selling_price && (
                                <Text 
                                  className="text-zinc-500 font-semibold text-[9px] line-through ml-1.5 mt-0.5 flex-shrink"
                                  numberOfLines={1}
                                >
                                  ₹{formattedMrpPrice}
                                </Text>
                              )}
                            </View>

                            <Text className="text-zinc-100 font-bold text-[11px] leading-[15px] mt-1.5" numberOfLines={2}>
                              {item.name}
                            </Text>

                            {item.description && (
                              <Text className="text-zinc-500 text-[9px] mt-1 leading-[12px]" numberOfLines={1}>
                                {item.description}
                              </Text>
                            )}
                          </View>

                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}