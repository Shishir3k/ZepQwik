import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase'; 

export default function PharmacyTopDeals() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopDeals();
  }, []);

  const fetchTopDeals = async () => {
    try {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', '%pharmacy%')
        .limit(1)
        .single();

      if (!categoryData) return;

      const { data, error } = await supabase
        .from('products')
        .select('*, brands(name)')
        .eq('category_id', categoryData.id)
        // Removed .eq('is_active', true) to allow manual DB entries to appear
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching top deals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="px-4 mb-8 mt-2 h-[200px] items-center justify-center">
        <ActivityIndicator color="#059669" />
      </View>
    );
  }

  if (products.length === 0) return null;

  return (
    <View className="mb-8 mt-2">
      <Text className="text-white font-black text-[22px] tracking-tight mb-4 px-5">
        Top Deals
      </Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {products.map((product) => {
          const primaryImg = product.images?.[0];
          const inStock = product.stock_quantity > 0;
          const brandName = product.brands?.name || 'Top Brand';

          const formattedSellingPrice = Number(product.selling_price).toLocaleString('en-IN');
          const formattedMrpPrice = Number(product.mrp_price).toLocaleString('en-IN');

          return (
            <TouchableOpacity
              key={product.id}
              activeOpacity={1}
              onPress={() => router.push(`/product/${product.id}` as any)}
              className="w-[150px] mr-4"
            >
              {/* 🚀 FIXED: Image container now takes up the full card height perfectly */}
              <View className="relative h-[150px] bg-[#1c1c1e] rounded-[20px] border border-zinc-800 mb-3">
                
                <Feather name="heart" size={16} color="#52525b" className="absolute top-3 right-3 z-10" />

                <View className="flex-1 w-full p-4 items-center justify-center overflow-hidden rounded-[20px]">
                  {primaryImg ? (
                    <Image source={{ uri: primaryImg }} className="w-full h-full" resizeMode="contain" />
                  ) : (
                    <Feather name="image" size={32} color="#52525b" />
                  )}
                  
                  {!inStock && (
                    <View className="absolute inset-0 bg-black/70 items-center justify-center">
                      <Text className="text-[11px] font-black text-white uppercase tracking-wider">Sold Out</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  disabled={!inStock}
                  className={`absolute -bottom-3 right-[-2px] bg-[#121212] border ${inStock ? 'border-green-600' : 'border-zinc-700'} rounded-xl px-4 py-1.5 shadow-sm z-20`}
                >
                  <Text className={`font-black text-xs ${inStock ? 'text-green-500' : 'text-zinc-500'}`}>
                    ADD
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="px-1">
                <View className="flex-row items-baseline mb-1">
                  <Text className="text-white text-lg font-black tracking-tight">₹{formattedSellingPrice}</Text>
                  {product.mrp_price > product.selling_price && (
                    <Text className="text-zinc-500 text-[10px] line-through ml-1.5">₹{formattedMrpPrice}</Text>
                  )}
                </View>

                <Text className="text-white text-xs font-semibold leading-snug" numberOfLines={1}>
                  {product.name}
                </Text>

                {product.description ? (
                  <Text className="text-zinc-400 text-[10px] mt-0.5 leading-snug" numberOfLines={2}>
                    {product.description}
                  </Text>
                ) : null}

                {/* Emerald Green highlight tag to match Pharmacy theme */}
                <View className="bg-emerald-900/30 self-start px-1.5 py-0.5 rounded mt-2 border border-emerald-900/50">
                  <Text className="text-emerald-500 text-[9px] font-bold uppercase tracking-wider">
                    {brandName}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}