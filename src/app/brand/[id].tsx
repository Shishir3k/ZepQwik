import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  FlatList,
  Share
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function BrandScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [brand, setBrand] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBrandAndProducts();
    }
  }, [id]);

  const fetchBrandAndProducts = async () => {
    setIsLoading(true);
    try {
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('id', id)
        .single();

      if (brandError) throw brandError;
      setBrand(brandData);

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('brand_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productError) throw productError;
      setProducts(productData || []);
    } catch (error) {
      console.error('Error fetching brand data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}` as any);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out all ${brand?.name || 'these'} products on Zepqwik!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBrandSearch = () => {
    router.push({
      pathname: '/search',
      params: { brand_id: id, brand_name: brand?.name }
    } as any);
  };

  const renderProductCard = ({ item }: { item: any }) => {
    const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
    const isOutOfStock = item.stock_quantity <= 0;
    const isVeg = !item.dietary_type || item.dietary_type.toLowerCase() === 'veg';

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleProductPress(item.id)}
        className="w-[31.5%] mb-5"
      >
        {/* IMAGE CONTAINER */}
        <View className="w-full aspect-[4/5] bg-[#1C1C1E] rounded-[14px] relative mb-2.5 border border-zinc-800/80 items-center justify-center p-2">
          
          <TouchableOpacity className="absolute top-1.5 right-1.5 z-10 p-1">
            <Feather name="bookmark" size={14} color="#A1A1AA" />
          </TouchableOpacity>

          {firstImage ? (
            <Image 
              source={{ uri: firstImage }} 
              className={`w-full h-full ${isOutOfStock ? 'opacity-40' : ''}`}
              resizeMode="contain"
            />
          ) : (
            <Feather name="image" size={24} color="#52525B" />
          )}

          {item.dietary_type && item.dietary_type !== 'None' && (
            <View className="absolute bottom-1.5 left-1.5 bg-white rounded-sm p-[2px]">
              <View className={`border ${isVeg ? 'border-green-700' : 'border-red-700'} w-2 h-2 items-center justify-center rounded-sm`}>
                 <View className={`w-[3px] h-[3px] rounded-full ${isVeg ? 'bg-green-700' : 'bg-red-700'}`} />
              </View>
            </View>
          )}

          {isOutOfStock ? (
            <View className="absolute -bottom-2.5 right-1.5 bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-[8px] shadow-lg">
              <Text className="text-zinc-400 text-[8px] font-black uppercase tracking-wider">Sold</Text>
            </View>
          ) : (
            <TouchableOpacity className="absolute -bottom-3 right-1.5 w-[28px] h-[28px] bg-white border border-zinc-200 rounded-[8px] items-center justify-center shadow-lg">
              <Feather name="plus" size={18} color="#3B82F6" />
            </TouchableOpacity>
          )}
          
        </View>

        {/* DETAILS SECTION */}
        <View className="px-0.5 mt-1">
          
          {/* Title - Fixed Height removed to eliminate the gap */}
          <Text className="text-zinc-100 font-bold text-[11px] leading-[14px] mb-1" numberOfLines={2}>
            {item.name}
          </Text>

          {/* Description added right below the name */}
          {item.description && item.description !== 'EMPTY' && (
            <Text className="text-zinc-400 font-medium text-[9px] leading-[12px] mb-1.5" numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* Tags (Weight/Volume) */}
          <View className="flex-row mb-1.5">
            <View className="bg-[#1C1C1E] border border-zinc-800 px-1.5 py-0.5 rounded flex-shrink">
              <Text className="text-zinc-400 text-[9px] font-bold" numberOfLines={1}>
                {item.weight_or_volume || '1 Unit'}
              </Text>
            </View>
          </View>

          {/* Price */}
          <View className="flex-row items-baseline gap-1">
            <Text className="text-white font-black text-[13px]">₹{item.selling_price}</Text>
            {item.mrp_price && item.mrp_price > item.selling_price && (
              <Text className="text-zinc-500 text-[9px] font-medium line-through">₹{item.mrp_price}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top', 'left', 'right']}>
      
      {/* STICKY HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-[#121212] border-b border-zinc-900 z-10">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-black text-[18px] flex-1" numberOfLines={1}>
            {brand?.name || 'Brand Details'}
          </Text>
        </View>

        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={handleBrandSearch}>
            <Feather name="search" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Feather name="share-2" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN CONTENT */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FACC15" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductCard}
          numColumns={3}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View className="px-4 mb-4">
              <Text className="text-white font-extrabold text-[15px]">
                {products.length} {products.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <View className="items-center justify-center py-20 px-6">
              <MaterialCommunityIcons name="package-variant-closed" size={64} color="#3F3F46" />
              <Text className="text-zinc-400 text-base font-medium mt-4 text-center">
                No products are currently available from this brand.
              </Text>
            </View>
          )}
        />
      )}
      
    </SafeAreaView>
  );
}