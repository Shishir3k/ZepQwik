import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

const { width } = Dimensions.get('window');

export default function SubcategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  // Data States
  const [activeSub, setActiveSub] = useState<any>(null);
  const [siblingSubs, setSiblingSubs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  // Loading States
  const [isFullPageLoading, setIsFullPageLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    if (id) fetchInitialPageData(id as string);
  }, [id]);

  const fetchInitialPageData = async (subcategoryId: string) => {
    setIsFullPageLoading(true);
    try {
      const { data: currentSub } = await supabase
        .from('subcategories')
        .select('*')
        .eq('id', subcategoryId)
        .single();
      
      if (currentSub) {
        setActiveSub(currentSub);
        
        const { data: siblings } = await supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', currentSub.category_id)
          .eq('is_active', true);
        
        if (siblings) setSiblingSubs(siblings);
      }

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('subcategory_id', subcategoryId)
        .eq('is_active', true);
        
      if (productsData) setProducts(productsData);

    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsFullPageLoading(false);
    }
  };

  const switchSubcategory = async (newId: string) => {
    // 1. Reset search
    setSearchQuery('');
    setIsSearchActive(false);
    const newActiveSub = siblingSubs.find(sub => sub.id === newId);
    if (newActiveSub) setActiveSub(newActiveSub);

    // 2. Fetch only new products
    setIsProductsLoading(true);
    try {
      const { data: newProducts } = await supabase
        .from('products')
        .select('*')
        .eq('subcategory_id', newId)
        .eq('is_active', true);
        
      if (newProducts) setProducts(newProducts);
    } catch (error) {
      console.error('Error fetching new products:', error);
    } finally {
      setIsProductsLoading(false);
    }
  };

  // 🚀 DYNAMIC SEARCH LOGIC
  const displayedProducts = useMemo(() => {
    let result = [...products];

    // Apply Local Search
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) || 
        (product.description && product.description.toLowerCase().includes(query))
      );
    }

    return result;
  }, [products, searchQuery]);

  if (isFullPageLoading) {
    return (
      <View className="flex-1 bg-[#121212] justify-center items-center">
        <ActivityIndicator size="large" color="#FACC15" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#121212]">
      
      {/* 🚀 TOP HEADER WITH DYNAMIC SEARCH */}
      <View className="px-4 pt-12 pb-3 bg-[#1C1C1E] flex-row items-center justify-between border-b border-zinc-800 min-h-[90px]">
        {isSearchActive ? (
          <View className="flex-row items-center flex-1 bg-[#121212] rounded-full px-3 py-1 border border-zinc-700 h-[45px]">
            <Feather name="search" size={18} color="#A1A1AA" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search in ${activeSub?.name || 'Category'}...`}
              placeholderTextColor="#A1A1AA"
              autoFocus
              className="flex-1 text-white font-medium ml-2 text-[14px]"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} className="p-2">
                <Feather name="x-circle" size={18} color="#A1A1AA" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setIsSearchActive(false)} className="p-2">
                <Feather name="x" size={18} color="#A1A1AA" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View className="flex-row items-center flex-1">
              <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
                <Feather name="arrow-left" size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-white font-black text-[18px]" numberOfLines={1}>
                {activeSub?.name || 'Category'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsSearchActive(true)} className="p-2 bg-[#121212] rounded-full border border-zinc-800">
              <Feather name="search" size={20} color="white" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* MAIN CONTENT SPLIT */}
      <View className="flex-1 flex-row">
        
        {/* Left Sidebar */}
        <View className="w-[85px] bg-[#121212] border-r border-zinc-900">
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {siblingSubs.map((sub) => {
              const isActive = sub.id === activeSub?.id;
              return (
                <TouchableOpacity 
                  key={sub.id}
                  onPress={() => switchSubcategory(sub.id)}
                  className={`items-center py-4 border-l-4 ${isActive ? 'bg-[#1C1C1E] border-[#3B82F6]' : 'border-transparent'}`}
                >
                  <View className="w-12 h-12 bg-white rounded-full items-center justify-center mb-2 overflow-hidden p-1 shadow-sm">
                    {sub.image_url ? (
                      <Image source={{ uri: sub.image_url }} className="w-full h-full" resizeMode="contain" />
                    ) : (
                      <Feather name="image" size={16} color="#A1A1AA" />
                    )}
                  </View>
                  <Text className={`text-center text-[10px] px-1 ${isActive ? 'text-white font-black' : 'text-zinc-500 font-medium'}`}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Right Grid (Products) */}
        <View className="flex-1 bg-[#121212]">
          {isProductsLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 12, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
              <View className="flex-row flex-wrap justify-between">
                {displayedProducts.length === 0 ? (
                  <View className="w-full items-center justify-center mt-10">
                    <Feather name="search" size={40} color="#3F3F46" />
                    <Text className="text-zinc-400 font-medium text-center mt-4 px-4">
                      {searchQuery.length > 0 ? `No products found for "${searchQuery}"` : "No products available in this category."}
                    </Text>
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')} className="mt-4 px-4 py-2 border border-zinc-600 rounded-full">
                        <Text className="text-zinc-300 font-bold">Clear Search</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  displayedProducts.map((item) => {
                    const firstImage = item.images?.[0] || null;
                    const discount = item.mrp_price && item.mrp_price > item.selling_price
                      ? Math.round(((item.mrp_price - item.selling_price) / item.mrp_price) * 100)
                      : 0;
                    const isVeg = !item.dietary_type || item.dietary_type.toLowerCase() === 'veg';

                    return (
                      <TouchableOpacity 
                        key={item.id} 
                        onPress={() => router.push(`/product/${item.id}` as any)}
                        activeOpacity={0.9}
                        style={{ width: '48%' }}
                        className="mb-6"
                      >
                        <View className="w-full bg-[#1C1C1E] rounded-[20px] relative border border-zinc-800" style={{ aspectRatio: 1 }}>
                          {firstImage && (
                            <Image source={{ uri: firstImage }} className="w-full h-full rounded-[20px]" resizeMode="contain" />
                          )}
                          
                          <TouchableOpacity className="absolute top-2 right-2">
                            <Feather name="bookmark" size={16} color="#A1A1AA" />
                          </TouchableOpacity>

                          <View className="absolute bottom-2 left-2 bg-white rounded-sm p-[2px]">
                            <View className={`border ${isVeg ? 'border-green-700' : 'border-red-700'} w-2.5 h-2.5 items-center justify-center rounded-sm`}>
                               <View className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-700' : 'bg-red-700'}`} />
                            </View>
                          </View>

                          <TouchableOpacity className="absolute -bottom-3 right-2 bg-white border border-zinc-300 w-8 h-8 rounded-xl items-center justify-center shadow-lg">
                            <Text className="text-[#3B82F6] font-black text-[18px]">+</Text>
                          </TouchableOpacity>
                        </View>

                        <Text className="text-white font-bold text-[13px] leading-[17px] mt-4" numberOfLines={2}>
                          {item.name}
                        </Text>
                        
                        <View className="bg-[#1C1C1E] border border-zinc-800 rounded px-1.5 py-0.5 mt-1.5 self-start">
                          <Text className="text-zinc-400 font-medium text-[10px]">{item.weight_or_volume || '1 pc'}</Text>
                        </View>

                        {discount > 0 ? (
                          <Text className="text-[#10B981] font-black text-[11px] mt-1.5">{discount}% OFF</Text>
                        ) : (
                          <View className="h-4 mt-1.5" />
                        )}

                        <View className="flex-row items-baseline gap-1 mt-0.5">
                          <Text className="text-white font-black text-[15px]">₹{item.selling_price}</Text>
                          {item.mrp_price > item.selling_price && (
                            <Text className="text-zinc-500 font-medium text-[11px] line-through">₹{item.mrp_price}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

    </View>
  );
}