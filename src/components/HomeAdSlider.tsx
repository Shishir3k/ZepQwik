import React, { useEffect, useRef, useState } from 'react';
import { View, Image, TouchableOpacity, FlatList, Dimensions, ViewToken, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

interface HomeAdSliderProps {
  activeCategory: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH * 0.85; 
const ITEM_SPACING = 16; 
const FULL_ITEM_SIZE = ITEM_WIDTH + ITEM_SPACING;

// 🚀 Create 1000 copies of the banners for an unbreakable infinite loop
const LOOPS = 1000; 

export default function HomeAdSlider({ activeCategory }: HomeAdSliderProps) {
  const router = useRouter();
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef(0); 
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  // 🚀 Generate the massive infinite array
  const infiniteAds = ads.length > 0 ? Array(LOOPS).fill(ads).flat() : [];
  // 🚀 Calculate the exact middle to start the slider
  const startIndex = ads.length > 0 ? ads.length * (LOOPS / 2) : 0;

  useEffect(() => {
    fetchBanners();
  }, [activeCategory]);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('banners').select('*').eq('is_active', true);

      if (activeCategory === 'all') {
        query = query.eq('display_screen', 'Home');
      } else {
        query = query.eq('display_screen', 'Category_Tab').eq('display_category_id', activeCategory);
      }

      // 🚀 RANKING FIX: Order by the sort_order assigned in the Admin app
      const { data, error } = await query.order('sort_order', { ascending: true });
      if (error) throw error;
      
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 Instantly jump to the middle of the infinite list without animation
  useEffect(() => {
    if (ads.length > 0 && flatListRef.current) {
      const snapTimer = setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: startIndex,
          animated: false,
          viewPosition: 0.5,
        });
        currentIndexRef.current = startIndex;
      }, 100);

      return () => clearTimeout(snapTimer);
    }
  }, [ads]); // Runs every time new ads are loaded

  // 🚀 Smooth Auto-Scroll Forward forever
  useEffect(() => {
    if (!isAutoScrolling || ads.length <= 1) return;

    const timer = setInterval(() => {
      const nextIndex = currentIndexRef.current + 1;
      currentIndexRef.current = nextIndex;
      
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }, 3500); // 3.5 seconds per slide

    return () => clearInterval(timer);
  }, [isAutoScrolling, ads.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems && viewableItems.length > 0) {
      const centerItem = viewableItems.find(item => item.isViewable) || viewableItems[0];
      if (centerItem.index !== null) {
        currentIndexRef.current = centerItem.index;
      }
    }
  }).current;

  // 🚀 EXTERNAL LINK FIX: Gracefully handles both Categories and External URLs
  const handleAdPress = (banner: any) => {
    if (banner.target_screen === 'Category' && banner.target_id) {
      router.push(`/category/${banner.target_id}` as any);
    } else if (banner.target_screen === 'External_URL' && banner.external_url) {
      Linking.openURL(banner.external_url).catch((err) =>
        console.error('Failed to open external link:', err)
      );
    }
  };

  if (isLoading) return <ActivityIndicator color="#E6AF19" className="my-6" />;
  if (ads.length === 0) return null;

  return (
    <View className="mt-4 mb-6">
      <FlatList
        ref={flatListRef}
        data={infiniteAds}
        // 🚀 Use index for key because we have hundreds of duplicates
        keyExtractor={(_, index) => index.toString()} 
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={FULL_ITEM_SIZE}
        snapToAlignment="center"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onScrollBeginDrag={() => setIsAutoScrolling(false)}
        onMomentumScrollEnd={() => setIsAutoScrolling(true)}
        getItemLayout={(_, index) => ({
          length: FULL_ITEM_SIZE,
          offset: FULL_ITEM_SIZE * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={{ width: ITEM_WIDTH, marginHorizontal: ITEM_SPACING / 2 }}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => handleAdPress(item)}
              className="relative rounded-[20px] overflow-hidden bg-zinc-800"
              style={{ height: 170 }}
            >
              <Image source={{ uri: item.image_url }} className="w-full h-full" resizeMode="cover" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}