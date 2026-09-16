import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, TextInput, 
  Modal, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

// ---------------- TYPES ---------------- //
interface Product {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  mrp_price: number;
  selling_price: number;
  stock_quantity: number;
  weight_or_volume: string;
  dietary_type: string | null;
  shelf_life: string | null;
  is_active: boolean;
  barcode: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  categories?: { name: string }; // 🚀 Added to hold category name for grouping!
}

interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

// ---------------------------------------------------------
// 🚀 BASE64 CONVERTER
// ---------------------------------------------------------
function base64ToByteArray(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let len = base64.length;
  if (base64[len - 1] === '=') len--;
  if (base64[len - 1] === '=') len--;

  const u8 = new Uint8Array(Math.floor((len * 3) / 4));
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const a = chars.indexOf(base64[i]);
    const b = chars.indexOf(base64[i + 1]);
    const c = chars.indexOf(base64[i + 2]);
    const d = chars.indexOf(base64[i + 3]);

    u8[p++] = (a << 2) | (b >> 4);
    if (c !== -1 && c !== 64) {
      u8[p++] = ((b & 15) << 4) | (c >> 2);
      if (d !== -1 && d !== 64) {
        u8[p++] = ((c & 3) << 6) | d;
      }
    }
  }
  return u8;
}

export default function MerchantDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('products');
  
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  const [coverImage, setCoverImage] = useState<{ uri: string, base64?: string } | null>(null);
  const [sliderImages, setSliderImages] = useState<{ uri: string, base64?: string }[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: '', description: '', selling_price: '', mrp_price: '',
    stock_quantity: '10', weight_or_volume: '', dietary_type: 'Veg',
    shelf_life: '', barcode: '', category_id: null as string | null, subcategory_id: null as string | null,
  });

  useEffect(() => {
    initializeMerchantAndData();
  }, []);

  const initializeMerchantAndData = async () => {
    setIsLoading(true);
    try {
      const { data: catData } = await supabase
        .from('categories')
        .select(`id, name, subcategories ( id, name, is_active )`)
        .eq('is_active', true);
      
      if (catData) {
        setCategories(catData.map(c => ({
          ...c, subcategories: c.subcategories?.filter((s: any) => s.is_active) || []
        })));
      }

      const { data: merchantData } = await supabase.from('merchants').select('id').limit(1).single();
      if (merchantData?.id) {
        setMerchantId(merchantData.id);
        fetchProducts(merchantData.id);
      } else {
        Alert.alert('No Merchant Found', 'Please add a merchant in Supabase first!');
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const fetchProducts = async (mId: string) => {
    try {
      // 🚀 Added categories(name) to the query so we can group them!
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('merchant_id', mId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    setProducts(products.map(p => p.id === productId ? { ...p, is_active: !currentStatus } : p));
    const { error } = await supabase.from('products').update({ is_active: !currentStatus }).eq('id', productId);
    if (error) {
      Alert.alert('Error', 'Could not update status');
      fetchProducts(merchantId!); 
    }
  };

  const confirmDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to permanently delete "${productName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            const { error } = await supabase.from('products').delete().eq('id', productId);
            if (error) Alert.alert("Error", "Could not delete product.");
            else fetchProducts(merchantId!);
          }
        }
      ]
    );
  };

  const openEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name || '', description: product.description || '',
      selling_price: product.selling_price?.toString() || '', mrp_price: product.mrp_price?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '0', weight_or_volume: product.weight_or_volume || '',
      dietary_type: product.dietary_type || 'Veg', shelf_life: product.shelf_life || '', barcode: product.barcode || '',
      category_id: product.category_id || null, subcategory_id: product.subcategory_id || null,
    });
    
    if (product.images && product.images.length > 0) {
      setCoverImage({ uri: product.images[0] });
      setSliderImages(product.images.slice(1).map(uri => ({ uri })));
    } else {
      setCoverImage(null);
      setSliderImages([]);
    }
    
    setIsAddModalOpen(true);
  };

  const resetForm = () => {
    setNewProduct({
      name: '', description: '', selling_price: '', mrp_price: '', stock_quantity: '10',
      weight_or_volume: '', dietary_type: 'Veg', shelf_life: '', barcode: '',
      category_id: null, subcategory_id: null,
    });
    setCoverImage(null);
    setSliderImages([]);
    setEditingProductId(null);
    setIsAddModalOpen(false);
  };

  const pickCoverImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9, 
      base64: true, 
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setCoverImage({ 
        uri: result.assets[0].uri, 
        base64: result.assets[0].base64 || undefined 
      });
    }
  };

  const pickSliderImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.9,
      base64: true, 
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => ({ 
        uri: asset.uri, 
        base64: asset.base64 || undefined 
      }));
      setSliderImages([...sliderImages, ...newImages]);
    }
  };

  const uploadImageAsync = async (uri: string, base64Data: string | undefined) => {
    if (uri.startsWith('http')) return uri; 

    try {
      const rawExt = uri.split('.').pop()?.toLowerCase();
      const ext = rawExt && rawExt.length <= 4 ? rawExt : 'jpg';
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
      
      const path = `items/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;

      let fileData: ArrayBuffer;
      
      if (base64Data) {
        fileData = base64ToByteArray(base64Data).buffer as ArrayBuffer;
      } else {
        const response = await fetch(uri);
        const blob = await response.blob();
        fileData = await new Response(blob).arrayBuffer();
      }

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, fileData, { contentType, upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      return data.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.selling_price || !coverImage) {
      Alert.alert('Required Fields', 'Please enter a name, selling price, and a Cover Image!');
      return;
    }

    setIsSaving(true);
    try {
      const uploadedCover = await uploadImageAsync(coverImage.uri, coverImage.base64);
      
      let uploadedSliders = [];
      for (const img of sliderImages) {
        const url = await uploadImageAsync(img.uri, img.base64);
        if (url) uploadedSliders.push(url);
      }

      const finalImageArray = uploadedCover ? [uploadedCover, ...uploadedSliders] : [];

      const productData = {
        merchant_id: merchantId,
        category_id: newProduct.category_id,
        subcategory_id: newProduct.subcategory_id,
        name: newProduct.name,
        description: newProduct.description,
        selling_price: parseFloat(newProduct.selling_price),
        mrp_price: newProduct.mrp_price ? parseFloat(newProduct.mrp_price) : parseFloat(newProduct.selling_price),
        stock_quantity: newProduct.stock_quantity ? parseInt(newProduct.stock_quantity) : 10,
        weight_or_volume: newProduct.weight_or_volume || '1 pc',
        dietary_type: newProduct.dietary_type,
        shelf_life: newProduct.shelf_life,
        barcode: newProduct.barcode,
        images: finalImageArray,
        is_active: true,
      };

      if (editingProductId) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProductId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
      }

      resetForm();
      fetchProducts(merchantId!);
    } catch (error: any) {
      Alert.alert('Error saving product', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 🚀 FILTER LOGIC
  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const matchesName = p.name.toLowerCase().includes(query);
    const matchesBarcode = p.barcode ? p.barcode.toLowerCase().includes(query) : false;
    return matchesName || matchesBarcode;
  });

  // 🚀 GROUPING LOGIC (Groups products by Category)
  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: { categoryName: string; items: Product[] } } = {};

    filteredProducts.forEach((prod) => {
      const catId = prod.category_id || 'uncategorized';
      const catName = prod.categories?.name || 'Uncategorized';

      if (!groups[catId]) {
        groups[catId] = { categoryName: catName, items: [] };
      }
      groups[catId].items.push(prod);
    });

    return Object.values(groups);
  }, [filteredProducts]);

  const currentSubcategories = categories.find(c => c.id === newProduct.category_id)?.subcategories || [];

  return (
    <SafeAreaView className="flex-1 bg-[#121212]">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-800">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-[#1C1C1E] rounded-full items-center justify-center border border-zinc-800">
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white font-black text-[18px]">Merchant Portal</Text>
          <Text className="text-[#FACC15] font-bold text-[11px] uppercase tracking-widest">Store Dashboard</Text>
        </View>
        <TouchableOpacity className="w-10 h-10 bg-[#1C1C1E] rounded-full items-center justify-center border border-zinc-800">
          <Feather name="settings" size={18} color="#A1A1AA" />
        </TouchableOpacity>
      </View>

      {/* TAB SWITCHER */}
      <View className="flex-row px-4 mt-5 mb-4">
        <TouchableOpacity 
          onPress={() => setActiveTab('orders')}
          className={`flex-1 py-3 rounded-l-lg border-y border-l items-center flex-row justify-center ${activeTab === 'orders' ? 'bg-[#FACC15]/10 border-[#FACC15]' : 'bg-[#1C1C1E] border-zinc-800'}`}
        >
          <Feather name="bell" size={16} color={activeTab === 'orders' ? '#FACC15' : '#A1A1AA'} />
          <Text className={`font-bold ml-2 ${activeTab === 'orders' ? 'text-[#FACC15]' : 'text-zinc-400'}`}>Live Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('products')}
          className={`flex-1 py-3 rounded-r-lg border-y border-r items-center flex-row justify-center ${activeTab === 'products' ? 'bg-[#FACC15]/10 border-[#FACC15]' : 'bg-[#1C1C1E] border-zinc-800'}`}
        >
          <Feather name="box" size={16} color={activeTab === 'products' ? '#FACC15' : '#A1A1AA'} />
          <Text className={`font-bold ml-2 ${activeTab === 'products' ? 'text-[#FACC15]' : 'text-zinc-400'}`}>My Products</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#FACC15" /></View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-2" showsVerticalScrollIndicator={false}>
          
          {activeTab === 'orders' && (
            <View>
              <Text className="text-white font-black text-xl mb-4">Pending Preparation</Text>
              <Text className="text-zinc-500 mb-6">Order fetching logic will go here next!</Text>
            </View>
          )}

          {activeTab === 'products' && (
            <View className="pb-10">
              
              <View className="flex-row items-center mb-6">
                <View className="flex-1 bg-[#1C1C1E] border border-zinc-800 rounded-xl flex-row items-center px-4 py-3.5 mr-3">
                  <Feather name="search" size={18} color="#A1A1AA" />
                  <TextInput 
                    className="flex-1 text-white ml-2 font-medium"
                    placeholder="Search name or barcode..."
                    placeholderTextColor="#52525B"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Feather name="x-circle" size={16} color="#A1A1AA" />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity 
                  onPress={() => { resetForm(); setIsAddModalOpen(true); }}
                  className="bg-[#FACC15] w-12 h-12 rounded-xl items-center justify-center shadow-lg"
                >
                  <Feather name="plus" size={24} color="#121212" />
                </TouchableOpacity>
              </View>

              <Text className="text-white font-black text-xl mb-2">Inventory ({filteredProducts.length})</Text>

              {/* 🚀 MAPPED BY CATEGORY GROUP */}
              {groupedProducts.map((group) => (
                <View key={group.categoryName} className="mb-4 mt-2">
                  
                  {/* Category Header */}
                  <View className="flex-row items-center mb-3 ml-1">
                    <Text className="text-zinc-400 font-bold text-sm uppercase tracking-widest mr-2">
                      {group.categoryName}
                    </Text>
                    <View className="bg-zinc-800 px-2 py-0.5 rounded text-center">
                      <Text className="text-zinc-400 font-black text-[10px]">{group.items.length}</Text>
                    </View>
                  </View>

                  {/* Products inside this Category */}
                  {group.items.map((item) => (
                    <View key={item.id} className="bg-[#1C1C1E] border border-zinc-800/80 rounded-2xl p-3 mb-3 flex-row items-center">
                      
                      {/* Left: Compact Image */}
                      <View className="w-16 h-16 bg-[#121212] rounded-xl border border-zinc-700/50 items-center justify-center overflow-hidden">
                        {item.images && item.images.length > 0 ? (
                          <Image source={{ uri: item.images[0] }} className="w-full h-full" resizeMode="contain" />
                        ) : (
                          <MaterialIcons name="image" size={24} color="#52525B" />
                        )}
                      </View>
                      
                      {/* Middle: Info */}
                      <View className="flex-1 px-3">
                        <Text className="text-white font-bold text-[15px] mb-0.5" numberOfLines={1}>{item.name}</Text>
                        <Text className="text-zinc-400 font-medium text-[12px] mb-1.5">
                          ₹{item.selling_price} • {item.weight_or_volume}
                        </Text>
                        <View className="flex-row items-center">
                          <View className={`px-1.5 py-0.5 rounded mr-2 ${item.is_active ? 'bg-green-500/20' : 'bg-zinc-800'}`}>
                            <Text className={`font-black text-[9px] uppercase ${item.is_active ? 'text-green-500' : 'text-zinc-500'}`}>
                              {item.is_active ? 'Active' : 'Hidden'}
                            </Text>
                          </View>
                          <Text className={`font-bold text-[10px] ${item.stock_quantity > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            Stock: {item.stock_quantity}
                          </Text>
                        </View>
                      </View>

                      {/* Right: Tightly Stacked Actions */}
                      <View className="items-end pl-2 border-l border-zinc-800/80">
                        <TouchableOpacity onPress={() => handleToggleActive(item.id, item.is_active)} className="mb-2">
                          {item.is_active ? (
                            <MaterialCommunityIcons name="toggle-switch" size={32} color="#22C55E" style={{ margin: -8 }} />
                          ) : (
                            <MaterialCommunityIcons name="toggle-switch-off" size={32} color="#52525B" style={{ margin: -8 }} />
                          )}
                        </TouchableOpacity>
                        
                        <View className="flex-row space-x-3 mt-1">
                          <TouchableOpacity onPress={() => confirmDeleteProduct(item.id, item.name)}>
                            <Feather name="trash-2" size={16} color="#EF4444" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => openEditModal(item)} className="ml-3">
                            <Feather name="edit" size={16} color="#60A5FA" />
                          </TouchableOpacity>
                        </View>
                      </View>

                    </View>
                  ))}
                </View>
              ))}

              {filteredProducts.length === 0 && (
                <View className="items-center justify-center py-10">
                  <Feather name="box" size={40} color="#3F3F46" className="mb-4" />
                  <Text className="text-zinc-400 font-bold">No products found.</Text>
                </View>
              )}

            </View>
          )}
        </ScrollView>
      )}

      {/* ---------------------------------------------------
          ➕ ADD/EDIT MODAL
          --------------------------------------------------- */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/90">
          <View className="bg-[#121212] rounded-t-3xl h-[92%] border-t border-zinc-800">
            
            <View className="flex-row justify-between items-center p-5 border-b border-zinc-800 bg-[#1C1C1E] rounded-t-3xl">
              <Text className="text-white font-black text-xl">
                {editingProductId ? 'Edit Product' : 'Create Product'}
              </Text>
              <TouchableOpacity onPress={resetForm} className="bg-[#2A2A2E] p-2 rounded-full">
                <Feather name="x" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 p-5">
              
              {/* COVER IMAGE */}
              <View className="flex-row items-baseline justify-between mb-2">
                <Text className="text-zinc-400 font-bold text-xs uppercase">Cover Image *</Text>
                <Text className="text-yellow-500 font-bold text-[9px] uppercase">Free Crop</Text>
              </View>
              <TouchableOpacity 
                onPress={pickCoverImage}
                className="w-full h-40 border-2 border-dashed border-zinc-700 bg-[#1C1C1E] rounded-xl items-center justify-center mb-6 overflow-hidden"
              >
                {coverImage ? (
                  <View className="w-full h-full relative">
                    <Image source={{ uri: coverImage.uri }} className="w-full h-full" resizeMode="contain" />
                    <View className="absolute top-2 right-2 bg-black/60 p-2 rounded-full">
                      <Feather name="edit-2" size={14} color="white" />
                    </View>
                  </View>
                ) : (
                  <View className="items-center">
                    <Feather name="crop" size={28} color="#52525B" className="mb-2" />
                    <Text className="text-zinc-400 font-bold text-sm">Upload Cover Image</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* SLIDER IMAGES */}
              <Text className="text-zinc-400 font-bold text-xs uppercase mb-2">Slider Images (Optional)</Text>
              <View className="flex-row items-center mb-8">
                <TouchableOpacity 
                  onPress={pickSliderImages}
                  className="w-16 h-16 border-2 border-dashed border-zinc-700 bg-[#1C1C1E] rounded-xl items-center justify-center mr-3"
                >
                  <Feather name="plus" size={20} color="#52525B" />
                </TouchableOpacity>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {sliderImages.map((img, index) => (
                    <View key={index} className="w-16 h-16 mr-3 relative bg-[#1C1C1E]">
                      <Image source={{ uri: img.uri }} className="w-full h-full rounded-xl border border-zinc-700" resizeMode="contain" />
                      <TouchableOpacity 
                        onPress={() => setSliderImages(sliderImages.filter((_, i) => i !== index))}
                        className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
                      >
                        <Feather name="x" size={10} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Category */}
              <Text className="text-zinc-400 font-bold text-xs uppercase mb-2">Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {categories.map(cat => (
                  <TouchableOpacity 
                    key={cat.id} 
                    onPress={() => setNewProduct({...newProduct, category_id: cat.id, subcategory_id: null})}
                    className={`px-4 py-2 rounded-full mr-2 border ${newProduct.category_id === cat.id ? 'bg-[#FACC15] border-[#FACC15]' : 'bg-[#1C1C1E] border-zinc-700'}`}
                  >
                    <Text className={`font-bold text-[13px] ${newProduct.category_id === cat.id ? 'text-[#121212]' : 'text-zinc-300'}`}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Subcategory */}
              {currentSubcategories.length > 0 && (
                <View className="mb-4">
                  <Text className="text-zinc-400 font-bold text-xs uppercase mb-2">Subcategory</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {currentSubcategories.map(sub => (
                      <TouchableOpacity 
                        key={sub.id} 
                        onPress={() => setNewProduct({...newProduct, subcategory_id: sub.id})}
                        className={`px-3 py-1.5 rounded-full mr-2 border ${newProduct.subcategory_id === sub.id ? 'bg-zinc-200 border-zinc-200' : 'bg-[#1C1C1E] border-zinc-700'}`}
                      >
                        <Text className={`font-bold text-[12px] ${newProduct.subcategory_id === sub.id ? 'text-[#121212]' : 'text-zinc-400'}`}>{sub.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Fields */}
              <Text className="text-zinc-400 font-bold text-xs uppercase mb-2 mt-2">Product Name *</Text>
              <TextInput 
                className="bg-[#1C1C1E] text-white p-4 rounded-xl border border-zinc-800 mb-4 font-medium"
                placeholder="e.g. Fortune Chakki Fresh Atta" placeholderTextColor="#52525B"
                value={newProduct.name} onChangeText={(t) => setNewProduct({...newProduct, name: t})}
              />

              <Text className="text-zinc-400 font-bold text-xs uppercase mb-2">Description</Text>
              <TextInput 
                className="bg-[#1C1C1E] text-white p-4 rounded-xl border border-zinc-800 mb-4 font-medium h-24 text-top"
                placeholder="Add product details..." placeholderTextColor="#52525B" multiline textAlignVertical="top"
                value={newProduct.description} onChangeText={(t) => setNewProduct({...newProduct, description: t})}
              />

              <View className="flex-row space-x-4 mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-zinc-400 font-bold text-xs uppercase mb-2">Selling Price (₹) *</Text>
                  <TextInput 
                    className="bg-[#1C1C1E] text-white p-4 rounded-xl border border-zinc-800 font-medium"
                    placeholder="e.g. 45" placeholderTextColor="#52525B" keyboardType="numeric"
                    value={newProduct.selling_price} onChangeText={(t) => setNewProduct({...newProduct, selling_price: t})}
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-zinc-400 font-bold text-xs uppercase mb-2">MRP (₹)</Text>
                  <TextInput 
                    className="bg-[#1C1C1E] text-white p-4 rounded-xl border border-zinc-800 font-medium"
                    placeholder="e.g. 50" placeholderTextColor="#52525B" keyboardType="numeric"
                    value={newProduct.mrp_price} onChangeText={(t) => setNewProduct({...newProduct, mrp_price: t})}
                  />
                </View>
              </View>

              <View className="flex-row space-x-4 mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-zinc-400 font-bold text-xs uppercase mb-2">Stock Qty</Text>
                  <TextInput 
                    className="bg-[#1C1C1E] text-white p-4 rounded-xl border border-zinc-800 font-medium"
                    placeholder="10" placeholderTextColor="#52525B" keyboardType="numeric"
                    value={newProduct.stock_quantity} onChangeText={(t) => setNewProduct({...newProduct, stock_quantity: t})}
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-zinc-400 font-bold text-xs uppercase mb-2">Weight / Vol</Text>
                  <TextInput 
                    className="bg-[#1C1C1E] text-white p-4 rounded-xl border border-zinc-800 font-medium"
                    placeholder="e.g. 500g" placeholderTextColor="#52525B"
                    value={newProduct.weight_or_volume} onChangeText={(t) => setNewProduct({...newProduct, weight_or_volume: t})}
                  />
                </View>
              </View>

              <View className="flex-row space-x-4 mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-zinc-400 font-bold text-xs uppercase mb-2">Dietary Type</Text>
                  <View className="flex-row bg-[#1C1C1E] rounded-xl border border-zinc-800 overflow-hidden">
                    <TouchableOpacity 
                      onPress={() => setNewProduct({...newProduct, dietary_type: 'Veg'})}
                      className={`flex-1 py-4 items-center ${newProduct.dietary_type === 'Veg' ? 'bg-green-600/20' : ''}`}
                    >
                      <Text className={`font-bold text-xs ${newProduct.dietary_type === 'Veg' ? 'text-green-500' : 'text-zinc-500'}`}>VEG</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setNewProduct({...newProduct, dietary_type: 'Non-Veg'})}
                      className={`flex-1 py-4 items-center border-l border-zinc-800 ${newProduct.dietary_type === 'Non-Veg' ? 'bg-red-600/20' : ''}`}
                    >
                      <Text className={`font-bold text-xs ${newProduct.dietary_type === 'Non-Veg' ? 'text-red-500' : 'text-zinc-500'}`}>NON-VEG</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-zinc-400 font-bold text-xs uppercase mb-2">Shelf Life</Text>
                  <TextInput 
                    className="bg-[#1C1C1E] text-white p-4 rounded-xl border border-zinc-800 font-medium"
                    placeholder="e.g. 6 Months" placeholderTextColor="#52525B"
                    value={newProduct.shelf_life} onChangeText={(t) => setNewProduct({...newProduct, shelf_life: t})}
                  />
                </View>
              </View>

              <Text className="text-zinc-400 font-bold text-xs uppercase mb-2">Barcode (Optional)</Text>
              <TextInput 
                className="bg-[#1C1C1E] text-white p-4 rounded-xl border border-zinc-800 mb-10 font-medium"
                placeholder="Scan or type barcode..." placeholderTextColor="#52525B"
                value={newProduct.barcode} onChangeText={(t) => setNewProduct({...newProduct, barcode: t})}
              />

            </ScrollView>

            <View className="p-4 border-t border-zinc-800 bg-[#1C1C1E]">
              <TouchableOpacity 
                onPress={handleSaveProduct} disabled={isSaving}
                className={`py-4 rounded-xl items-center shadow-lg ${isSaving ? 'bg-yellow-600' : 'bg-[#FACC15]'}`}
              >
                {isSaving ? <ActivityIndicator color="#121212" /> : <Text className="text-[#121212] font-black text-[16px] uppercase tracking-wide">Save Product</Text>}
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}