import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1C1C1E', 
          borderTopWidth: 1,
          borderTopColor: '#2A2A2E',
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FACC15', 
        tabBarInactiveTintColor: '#A1A1AA', 
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories', tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} /> }} />
      <Tabs.Screen name="print" options={{ title: 'Print', tabBarIcon: ({ color }) => <Feather name="printer" size={22} color={color} /> }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarIcon: ({ color }) => <Feather name="shopping-cart" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />

      {/* 🚀 FIXED: Removed tabBarButton, relying strictly on href: null */}
      <Tabs.Screen 
        name="category/electronics" 
        options={{ 
          href: null,
          headerShown: false 
        }} 
      />

      <Tabs.Screen 
        name="category/pharmacy" 
        options={{ 
          href: null,
          headerShown: false 
        }} 
      />
      
      <Tabs.Screen 
        name="subcategory/[id]" 
        options={{ 
          href: null,
          headerShown: false 
        }} 
      />
    </Tabs>
  );
}