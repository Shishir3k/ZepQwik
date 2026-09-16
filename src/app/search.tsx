import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  Image, ActivityIndicator, Modal, FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import HomeProductSections from '../components/HomeProductSections';

const RECENT_SEARCHES_KEY = '@zepqwik_recent_searches';

interface Product {
  id: string;
  name: string;
  images: string[];
  mrp_price: number;
  selling_price: number;
  weight_or_volume: string;
  stock_quantity: number;
  dietary_type: string;
}

interface SuggestionItem {
  id: string;
  name: string;
  image_url?: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter Modal States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('Price');
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [activeSort, setActiveSort] = useState('Relevance');

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveSearchQuery = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      const filtered = recentSearches.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  // Live Search & Suggestions Handler
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performLiveSearch(searchQuery);
        fetchSuggestions(searchQuery);
        saveSearchQuery(searchQuery);
      } else {
        setSearchResults([]);
        setSuggestions([]);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performLiveSearch = async (query: string) => {
    setIsSearching(true);
    try {
      let queryBuilder = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${query}%`);

      // Apply Price Filters if selected
      if (selectedPrices.includes('Below ₹99')) {
        queryBuilder = queryBuilder.lte('selling_price', 99);
      } else if (selectedPrices.includes('₹100 - ₹199')) {
        queryBuilder = queryBuilder.gte('selling_price', 100).lte('selling_price', 199);
      } else if (selectedPrices.includes('Above ₹200')) {
        queryBuilder = queryBuilder.gte('selling_price', 200);
      }

      // Apply Sorting
      if (activeSort === 'Price: Low to High') {
        queryBuilder = queryBuilder.order('selling_price', { ascending: true });
      } else if (activeSort === 'Price: High to Low') {
        queryBuilder = queryBuilder.order('selling_price', { ascending: false });
      }

      const { data, error } = await queryBuilder.limit(20);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchSuggestions = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name, image_url')
        .ilike('name', `%${query}%`)
        .limit(5);

      if (!error && data) {
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSelectSearch = (term: string) => {
    setSearchQuery(term);
    saveSearchQuery(term);
  };

  const handleProductPress = (productId: string) => {
    if (searchQuery) saveSearchQuery(searchQuery);
    router.push(`/product/${productId}` as any);
  };

  const togglePriceFilter = (priceRange: string) => {
    if (selectedPrices.includes(priceRange)) {
      setSelectedPrices(selectedPrices.filter(p => p !== priceRange));
    } else {
      setSelectedPrices([...selectedPrices, priceRange]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top']}>
      
      {/* 🚀 BLINKIT STYLE SEARCH HEADER */}
      <View className="px-4 py-3 border-b border-zinc-800 bg-[#1C1C1E] flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View className="flex-1 bg-[#2A2A2E] flex-row items-center px-4 py-2.5 rounded-2xl border border-zinc-700">
          <TextInput 
            className="flex-1 text-white text-base font-medium"
            placeholder="Search across atta, dal, coke..."
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="mr-3 bg-zinc-600/50 p-1 rounded-full">
              <Feather name="x" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {/* Vertical Divider */}
          <View className="h-5 w-[1px] bg-zinc-600 mr-3" />
          <TouchableOpacity>
            <Feather name="mic" size={18} color="#A1A1AA" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 pt-3" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* RECENT SEARCHES CHIPS */}
        {searchQuery.length === 0 && recentSearches.length > 0 && (
          <View className="px-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-black text-xl">Recent searches</Text>
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text className="text-green-500 font-bold text-sm">clear</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
              {recentSearches.map((term, index) => (
                <TouchableOpacity 
                  key={index}
                  onPress={() => handleSelectSearch(term)}
                  className="bg-[#1C1C1E] border border-zinc-800 px-4 py-2.5 rounded-2xl mr-3 flex-row items-center shadow-sm"
                >
                  <Feather name="search" size={15} color="#A1A1AA" className="mr-2.5" />
                  <Text className="text-zinc-200 font-bold text-sm">{term}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ---------------------------------------------------------
            SUGGESTIONS & FILTER BAR (When typing a query)
            --------------------------------------------------------- */}
        {searchQuery.length > 0 && (
          <View>
            {/* Brand / Keyword Suggestions List */}
            {suggestions.length > 0 && (
              <View className="px-4 mb-4 border-b border-zinc-800/80 pb-2">
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleSelectSearch(item.name)}
                    className="flex-row items-center py-2.5"
                  >
                    <View className="w-9 h-9 bg-zinc-800 rounded-full items-center justify-center mr-3 overflow-hidden border border-zinc-700">
                      {item.image_url ? (
                        <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <Feather name="search" size={16} color="#A1A1AA" />
                      )}
                    </View>
                    <Text className="text-white font-bold text-base">{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Filter & Sort Bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-4 flex-row">
              <TouchableOpacity 
                onPress={() => setIsFilterModalOpen(true)}
                className="bg-[#1C1C1E] border border-zinc-700 px-4 py-2 rounded-xl flex-row items-center mr-2.5"
              >
                <Feather name="sliders" size={14} color="#FFFFFF" className="mr-2" />
                <Text className="text-white font-bold text-xs">Filters</Text>
                <Feather name="chevron-down" size={14} color="#FFFFFF" className="ml-1.5" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setActiveSort(activeSort === 'Relevance' ? 'Price: Low to High' : 'Relevance')}
                className="bg-[#1C1C1E] border border-zinc-700 px-4 py-2 rounded-xl flex-row items-center mr-2.5"
              >
                <Feather name="repeat" size={14} color="#FFFFFF" className="mr-2" />
                <Text className="text-white font-bold text-xs">Sort: {activeSort}</Text>
                <Feather name="chevron-down" size={14} color="#FFFFFF" className="ml-1.5" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => togglePriceFilter('Below ₹99')}
                className={`border px-4 py-2 rounded-xl flex-row items-center mr-2.5 ${selectedPrices.includes('Below ₹99') ? 'bg-green-600/20 border-green-500' : 'bg-[#1C1C1E] border-zinc-700'}`}
              >
                <Text className="text-white font-bold text-xs">Price &lt; ₹99</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ---------------------------------------------------------
            CONTENT DISPLAY:
            - Empty query -> Home Product Sections
            - Active query -> Search Results Grid
            --------------------------------------------------------- */}
        {searchQuery.length === 0 ? (
          <HomeProductSections />
        ) : (
          <View className="px-4 pb-10">
            {isSearching ? (
              <View className="py-20 items-center">
                <ActivityIndicator size="small" color="#FACC15" />
              </View>
            ) : searchResults.length === 0 ? (
              <View className="py-20 items-center">
                <Feather name="search" size={48} color="#3F3F46" className="mb-3" />
                <Text className="text-white font-bold text-lg">No products found</Text>
                <Text className="text-zinc-500 text-sm mt-1">Try searching for something else</Text>
              </View>
            ) : (
              <View>
                <Text className="text-zinc-400 font-bold text-xs uppercase tracking-wider mb-4">
                  Results for "{searchQuery}" ({searchResults.length})
                </Text>

                <View className="flex-row flex-wrap justify-between">
                  {searchResults.map((item) => {
                    const firstImage = item.images?.[0];
                    const isOutOfStock = item.stock_quantity <= 0;
                    const isVeg = !item.dietary_type || item.dietary_type.toLowerCase() === 'veg';

                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleProductPress(item.id)}
                        activeOpacity={0.9}
                        className="w-[48%] mb-4 bg-[#1C1C1E] border border-zinc-800/80 rounded-2xl p-3"
                      >
                        <View className="w-full aspect-square bg-[#121212] rounded-xl relative flex justify-center items-center mb-3">
                          {firstImage ? (
                            <Image
                              source={{ uri: firstImage }}
                              className="w-3/4 h-3/4 rounded-lg"
                              resizeMode="contain"
                              style={{ opacity: isOutOfStock ? 0.4 : 1 }}
                            />
                          ) : null}

                          <View className="absolute bottom-2 right-2 bg-white rounded-sm p-[2px]">
                            <View className={`border ${isVeg ? 'border-green-700' : 'border-red-700'} w-2.5 h-2.5 items-center justify-center rounded-sm`}>
                              <View className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-700' : 'bg-red-700'}`} />
                            </View>
                          </View>
                        </View>

                        <Text className="text-zinc-400 font-medium text-[11px] mb-1">{item.weight_or_volume || '1 pc'}</Text>
                        <Text className="text-white font-bold text-sm mb-2" numberOfLines={2}>{item.name}</Text>
                        
                        <View className="flex-row items-center justify-between mt-auto">
                          <Text className="text-white font-black text-base">₹{item.selling_price}</Text>
                          {isOutOfStock ? (
                            <Text className="text-red-400 font-bold text-[10px]">SOLD OUT</Text>
                          ) : (
                            <View className="bg-[#121212] border border-green-600 px-3 py-1 rounded-lg">
                              <Text className="text-green-500 text-[11px] font-black uppercase">ADD</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* ---------------------------------------------------------
          🎛️ BLINKIT FILTER BOTTOM SHEET MODAL
          --------------------------------------------------------- */}
      <Modal visible={isFilterModalOpen} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-[#1C1C1E] rounded-t-3xl h-[65%] border-t border-zinc-800 flex flex-col">
            
            {/* Modal Header */}
            <View className="px-6 py-4 border-b border-zinc-800 flex-row justify-between items-center">
              <Text className="text-white font-black text-2xl">Filters</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)} className="bg-[#2A2A2E] p-2 rounded-full">
                <Feather name="x" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Filter Search Input Across Filters */}
            <View className="px-6 pt-4 pb-2">
              <View className="bg-[#121212] flex-row items-center px-4 py-2.5 rounded-xl border border-zinc-700">
                <Feather name="search" size={16} color="#71717A" />
                <TextInput 
                  placeholder="Search across filters..." 
                  placeholderTextColor="#71717A" 
                  className="flex-1 ml-3 text-white text-sm"
                />
              </View>
            </View>

            {/* Filter Body (Left Sidebar + Right Options) */}
            <View className="flex-1 flex-row">
              {/* Left Sidebar */}
              <View className="w-1/3 border-r border-zinc-800 bg-[#121212]">
                {['Price', 'Type', 'Properties'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveFilterTab(tab)}
                    className={`px-6 py-4 border-l-4 ${activeFilterTab === tab ? 'bg-[#1C1C1E] border-green-500 text-white font-black' : 'border-transparent text-zinc-400'}`}
                  >
                    <Text className={`font-bold text-sm ${activeFilterTab === tab ? 'text-white' : 'text-zinc-400'}`}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Right Content Checklists */}
              <View className="flex-1 p-6">
                {activeFilterTab === 'Price' && (
                  <View>
                    {['Below ₹99', '₹100 - ₹199', 'Above ₹200'].map((range) => {
                      const isSelected = selectedPrices.includes(range);
                      return (
                        <TouchableOpacity
                          key={range}
                          onPress={() => togglePriceFilter(range)}
                          className="flex-row justify-between items-center py-3 border-b border-zinc-800/50"
                        >
                          <Text className="text-zinc-200 font-medium text-base">{range}</Text>
                          <View className={`w-5 h-5 rounded border items-center justify-center ${isSelected ? 'bg-green-600 border-green-600' : 'border-zinc-600 bg-transparent'}`}>
                            {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {activeFilterTab === 'Type' && (
                  <Text className="text-zinc-500 text-sm">Product types available in database.</Text>
                )}

                {activeFilterTab === 'Properties' && (
                  <Text className="text-zinc-500 text-sm">Dietary and item properties.</Text>
                )}
              </View>
            </View>

            {/* Modal Bottom Action Buttons */}
            <View className="p-4 border-t border-zinc-800 flex-row space-x-3 bg-[#1C1C1E]">
              <TouchableOpacity 
                onPress={() => { setSelectedPrices([]); }}
                className="flex-1 bg-[#2A2Y2E] border border-zinc-700 py-3.5 rounded-2xl items-center mr-2"
              >
                <Text className="text-white font-bold text-sm">Clear Filter</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => { setIsFilterModalOpen(false); performLiveSearch(searchQuery); }}
                className="flex-1 bg-green-600 py-3.5 rounded-2xl items-center ml-2 shadow-lg shadow-green-900/30"
              >
                <Text className="text-white font-black text-sm uppercase tracking-wider">Apply</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}