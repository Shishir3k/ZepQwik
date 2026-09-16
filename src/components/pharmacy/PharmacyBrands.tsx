import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase'; 

export default function PharmacyBrands() {
  const router = useRouter();
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', '%pharmacy%')
        .limit(1)
        .single();

      let query = supabase.from('brands').select('*');

      if (categoryData) {
        query = query.contains('category_ids', [categoryData.id]);
      }

      const { data, error } = await query.limit(5);

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching pharmacy brands:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrandPress = (brandId: string) => {
    console.log(`Pressed brand ID: ${brandId}`);
  };

  if (isLoading) {
    return (
      <View className="px-4 mb-6 mt-2 h-[200px] items-center justify-center">
        <ActivityIndicator color="#059669" />
      </View>
    );
  }

  if (brands.length === 0) return null;

  return (
    <View className="px-4 mb-6 mt-2">
      <Text className="text-white font-black text-[22px] tracking-tight mb-4 ml-1">
        Top Brands in Pharmacy
      </Text>

      {/* TOP ROW: Up to 2 Large Brands */}
      <View className="flex-row justify-between mb-3">
        {brands.slice(0, 2).map((brand) => (
          <TouchableOpacity
            key={brand.id}
            onPress={() => handleBrandPress(brand.id)}
            activeOpacity={0.9}
            className="w-[48%] h-[100px] bg-white rounded-[20px] items-center justify-center shadow-md overflow-hidden"
          >
            {brand.logo_url ? (
              <Image
                source={{ uri: brand.logo_url }}
                className="w-full h-full"
                resizeMode="cover" 
              />
            ) : (
              <Text className="text-indigo-600 font-black text-2xl">{brand.name.charAt(0)}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* BOTTOM ROW: Up to 3 Smaller Brands */}
      {brands.length > 2 && (
        <View className="flex-row justify-between">
          {brands.slice(2, 5).map((brand) => (
            <TouchableOpacity
              key={brand.id}
              onPress={() => handleBrandPress(brand.id)}
              activeOpacity={0.9}
              className="w-[31%] h-[95px] bg-white rounded-[20px] items-center justify-center shadow-md overflow-hidden"
            >
              {brand.logo_url ? (
                <Image
                  source={{ uri: brand.logo_url }}
                  className="w-full h-full"
                  resizeMode="cover" 
                />
              ) : (
                <Text className="text-indigo-600 font-black text-xl">{brand.name.charAt(0)}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}