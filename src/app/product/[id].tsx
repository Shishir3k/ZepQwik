import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

// Get screen width for the image slider
const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [merchant, setMerchant] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSellerExpanded, setIsSellerExpanded] = useState(false);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const fetchProductDetails = async () => {
    setIsLoading(true);
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*, brands(name)')
        .eq('id', id)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Fetch Merchant
      if (productData?.merchant_id) {
        const { data: merchantData } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', productData.merchant_id)
          .single();

        if (merchantData) setMerchant(merchantData);
      }

      // Fetch Similar Products from the same subcategory
      if (productData?.subcategory_id) {
        const { data: similarData } = await supabase
          .from('products')
          .select('*')
          .eq('subcategory_id', productData.subcategory_id)
          .neq('id', id)
          .limit(5);

        if (similarData) setSimilarProducts(similarData);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveImageIndex(index);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product.name} on Zepqwik!`,
      });
    } catch (error) {
      console.error('Error sharing product:', error);
    }
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#121212] justify-center items-center">
        <ActivityIndicator size="large" color="#FACC15" />
      </View>
    );
  }

  if (!product) return null;

  const discount = product.mrp_price && product.mrp_price > product.selling_price
    ? Math.round(((product.mrp_price - product.selling_price) / product.mrp_price) * 100)
    : 0;

  const hasImages = product.images && product.images.length > 0;
  const isVeg = !product.dietary_type || product.dietary_type.toLowerCase() === 'veg';
  const brandName = product.brands?.name;

  return (
    <View className="flex-1 bg-[#121212]">

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        bounces={false}
      >
        {/* IMAGE SLIDER SECTION */}
        <View className="w-full h-[400px] bg-[#1C1C1E] relative">

          {hasImages ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                className="w-full h-full"
              >
                {product.images.map((imgUrl: string, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: imgUrl }}
                    style={{ width, height: 400 }}
                    className="opacity-90"
                    resizeMode="contain"
                  />
                ))}
              </ScrollView>

              {product.images.length > 1 && (
                <View className="absolute bottom-8 flex-row w-full justify-center gap-1.5 z-10">
                  {product.images.map((_: any, index: number) => (
                    <View
                      key={index}
                      className={`h-1.5 rounded-full ${activeImageIndex === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Feather name="image" size={50} color="#52525B" />
            </View>
          )}

          {/* Floating Top Actions */}
          <View className="absolute top-12 left-4 right-4 flex-row justify-between z-10">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-black/50 rounded-full items-center justify-center border border-white/10"
            >
              <Feather name="chevron-down" size={24} color="white" />
            </TouchableOpacity>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={toggleWishlist}
                className="w-10 h-10 bg-black/50 rounded-full items-center justify-center border border-white/10"
              >
                <Ionicons
                  name={isWishlisted ? "heart" : "heart-outline"}
                  size={22}
                  color={isWishlisted ? "#EF4444" : "white"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShare}
                className="w-10 h-10 bg-black/50 rounded-full items-center justify-center border border-white/10"
              >
                <Feather name="share" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* MAIN DETAILS SECTION */}
        <View className="bg-[#121212] -mt-5 rounded-t-[24px] px-4 pt-6">

          <TouchableOpacity
            className="mb-2"
            onPress={() => {
              if (product.brand_id) {
                router.push(`/brand/${product.brand_id}` as any);
              } else {
                router.push('/(tabs)/categories' as any);
              }
            }}
          >
            <Text className="text-[#3B82F6] font-black text-[13px]">
              Explore all {brandName || 'Category'} items <Feather name="chevron-right" size={12} />
            </Text>
          </TouchableOpacity>

          <Text className="text-white text-[22px] font-black leading-[28px] mb-3">
            {product.name}
          </Text>

          <View className="flex-row gap-2 mb-6">
            {product.dietary_type && product.dietary_type !== 'None' && (
              <View className="bg-[#1C1C1E] border border-zinc-800 px-3 py-1.5 rounded-md flex-row items-center gap-1.5">
                <View className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                <Text className="text-zinc-300 text-[11px] font-bold">{product.dietary_type}</Text>
              </View>
            )}
            <View className="bg-[#1C1C1E] border border-zinc-800 px-3 py-1.5 rounded-md">
              <Text className="text-zinc-300 text-[11px] font-bold">Fast Delivery</Text>
            </View>
          </View>

          <Text className="text-zinc-400 text-[13px] mb-2 font-medium">Quantity / Size</Text>
          <View className="border-2 border-[#3B82F6] rounded-[20px] p-4 bg-[#1C1C1E]/30 mb-8 relative w-[45%]">
            <Text className="text-white font-bold text-[15px] mb-1">{product.weight_or_volume || '1 Unit'}</Text>

            {discount > 0 && (
              <Text className="text-[#10B981] font-black text-[12px] mb-2">{discount}% OFF</Text>
            )}

            <View className="flex-row items-baseline gap-1.5 mb-1">
              <Text className="text-white font-black text-[18px]">₹{product.selling_price}</Text>
              {product.mrp_price && product.mrp_price > product.selling_price && (
                <Text className="text-zinc-500 font-medium text-[12px] line-through">₹{product.mrp_price}</Text>
              )}
            </View>

            <View className="absolute -bottom-2.5 bg-[#121212] px-2 self-center left-1/2 -translate-x-4 z-10">
              <Text className={`text-[11px] font-bold ${
                product.stock_quantity <= 0 
                  ? 'text-red-500' 
                  : product.stock_quantity < 10 
                  ? 'text-[#FACC15]' 
                  : 'text-green-500'
              }`}>
                {product.stock_quantity <= 0 
                  ? 'Out of stock' 
                  : product.stock_quantity < 10 
                  ? `Only ${product.stock_quantity} left!` 
                  : 'In Stock'}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between border-t border-b border-zinc-800 py-4 mb-8">
            <View className="items-center flex-1">
              <Feather name="refresh-ccw" size={24} color="#A1A1AA" style={{ marginBottom: 4 }} />
              {/* 🚀 FIXED: Updated to 24 Hours */}
              <Text className="text-white font-bold text-[12px] mt-2">24 Hours</Text>
              <Text className="text-zinc-500 text-[10px]">Refund*</Text>
            </View>
            <View className="items-center flex-1 border-l border-zinc-800">
              <Feather name="truck" size={24} color="#A1A1AA" style={{ marginBottom: 4 }} />
              <Text className="text-white font-bold text-[12px] mt-2">Fast</Text>
              <Text className="text-zinc-500 text-[10px]">Delivery</Text>
            </View>
            <View className="items-center flex-1 border-l border-zinc-800">
              <Feather name="headphones" size={24} color="#A1A1AA" style={{ marginBottom: 4 }} />
              <Text className="text-white font-bold text-[12px] mt-2">24/7</Text>
              <Text className="text-zinc-500 text-[10px]">Support</Text>
            </View>
          </View>

          {/* 🚀 FIXED: Removed the Highlights tab and kept just the Description block */}
          <Text className="text-white font-black text-[18px] mb-3">Description</Text>
          <View className="bg-[#1C1C1E] p-4 rounded-[16px] mb-8 border border-zinc-800">
            <Text className="text-zinc-300 text-[13px] leading-[20px]">
              {product.description !== 'EMPTY' && product.description ? product.description : 'No description provided by the seller.'}
            </Text>
          </View>

          {similarProducts.length > 0 && (
            <View className="mb-8">
              <Text className="text-white font-black text-[18px] mb-4">Similar Products</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {similarProducts.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(`/product/${item.id}` as any)}
                    className="w-[140px] mr-4"
                  >
                    <View className="bg-[#1C1C1E] rounded-[16px] p-2 mb-2 border border-zinc-800 relative">
                      <Image
                        source={{ uri: item.images?.[0] }}
                        className="w-full h-[100px] rounded-xl"
                        resizeMode="contain"
                      />
                      <TouchableOpacity className="absolute bottom-[-10px] right-2 bg-white rounded-[10px] border border-zinc-300 px-3 py-1 shadow-sm">
                        <Text className="text-[#3B82F6] font-black text-[16px]">+</Text>
                      </TouchableOpacity>
                    </View>

                    <Text className="text-zinc-100 font-bold text-[12px] leading-[16px] mt-2 mb-1" numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text className="text-zinc-400 text-[10px] mb-1">{item.weight_or_volume}</Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-white font-black text-[14px]">₹{item.selling_price}</Text>
                      {item.mrp_price > item.selling_price && (
                        <Text className="text-zinc-500 text-[10px] line-through">₹{item.mrp_price}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View className="border-t border-zinc-800 pt-6 mb-8">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsSellerExpanded(!isSellerExpanded)}
              className="flex-row justify-between items-center mb-2"
            >
              <Text className="text-white font-black text-[18px]">Seller Details</Text>
              <Feather name={isSellerExpanded ? "chevron-up" : "chevron-down"} size={20} color="white" />
            </TouchableOpacity>

            {isSellerExpanded && merchant ? (
              <View className="mt-4">
                <Text className="text-zinc-400 text-[13px] mb-4">Seller Name: {merchant.name || 'N/A'}</Text>
                <Text className="text-zinc-400 text-[13px] mb-4">FSSAI Number: {merchant.fssai_number || 'N/A'}</Text>
                <Text className="text-zinc-400 text-[13px] mb-4 leading-5">Address: {merchant.address || 'N/A'}</Text>
              </View>
            ) : isSellerExpanded && !merchant ? (
              <View className="mt-4">
                <Text className="text-zinc-500 text-[13px] italic mb-4">Seller details not available.</Text>
              </View>
            ) : null}

            <TouchableOpacity onPress={() => setIsSellerExpanded(!isSellerExpanded)}>
              <Text className="text-[#3B82F6] font-bold text-[13px] mt-2">
                {isSellerExpanded ? 'Show less -' : 'Show more +'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* STICKY BOTTOM ACTION BAR */}
      <View className="absolute bottom-0 w-full bg-[#1C1C1E] border-t border-zinc-800 px-4 py-3 flex-row justify-between items-center shadow-2xl">
        <View>
          <Text className="text-zinc-400 text-[12px] mb-0.5">
            {product.weight_or_volume} {discount > 0 && <Text className="text-[#10B981] font-black">{discount}% OFF</Text>}
          </Text>
          <View className="flex-row items-baseline gap-1.5">
            <Text className="text-white text-[20px] font-black">₹{product.selling_price}</Text>
            {product.mrp_price && product.mrp_price > product.selling_price && (
              <Text className="text-zinc-500 text-[13px] font-medium line-through">₹{product.mrp_price}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          disabled={product.stock_quantity <= 0}
          className={`${product.stock_quantity > 0 ? 'bg-[#3B82F6]' : 'bg-zinc-700'} px-12 py-3.5 rounded-[14px]`}
        >
          <Text className="text-white font-black text-[16px] tracking-wide">
            {product.stock_quantity > 0 ? 'ADD' : 'SOLD OUT'}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}