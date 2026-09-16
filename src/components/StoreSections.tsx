import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

interface SectionItem {
  id: string;
  title: string;
  image_url: string;
  target_category_id?: string;
  target_type?: string;
  target_id?: string;
}

interface StoreSection {
  id: string;
  title: string;
  section_items: SectionItem[];
}

export default function StoreSections() {
  const router = useRouter();
  const [sections, setSections] = useState<StoreSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStoreSections();
  }, []);

  const fetchStoreSections = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_sections')
        .select(`
          id,
          title,
          section_items (
            id,
            title,
            image_url,
            target_category_id,
            target_type,
            target_id,
            sort_order
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (data) {
        const populatedSections = data
          .filter((section: any) => section.section_items && section.section_items.length > 0)
          .map((section: any) => ({
            ...section,
            section_items: section.section_items.sort((a: any, b: any) => 
              (a.sort_order || 0) - (b.sort_order || 0)
            )
          }));

        setSections(populatedSections);
      }
    } catch (error) {
      console.error('Error fetching store sections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemPress = (item: SectionItem) => {
    if (item.target_type === 'subcategory' && item.target_id) {
      router.push(`/subcategory/${item.target_id}` as any);
    } else if (item.target_type === 'category' && item.target_id) {
      router.push(`/category/${item.target_id}` as any);
    } else if (item.target_type === 'product' && item.target_id) {
      router.push(`/product/${item.target_id}` as any);
    } else {
      console.log('No valid target found for:', item.title);
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="small" color="#FACC15" className="mt-4 mb-8" />;
  }

  if (sections.length === 0) return null;

  return (
    <View className="px-3 pb-6">
      {sections.map((section) => (
        <View key={section.id} className="mb-4">
          <Text className="text-white font-black text-[24px] tracking-tight mb-4 ml-2">
            {section.title}
          </Text>
          <View className="flex-row flex-wrap">
            {section.section_items.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.8}
                className="w-1/3 items-center mb-4 px-1.5"
              >
                {/* 🚀 FIXED: Replaced h-[155px] with aspect-[3/4] */}
                <View className="w-full aspect-[3/4] bg-[#222225] rounded-[16px] overflow-hidden relative shadow-sm border border-zinc-800/50">
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      className="absolute inset-0 w-full h-full"
                      // 🚀 FIXED: Changed to "contain" so the image never gets cropped
                      resizeMode="contain" 
                    />
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}