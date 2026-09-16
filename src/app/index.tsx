import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function IndexScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#276ded" />
    </View>
  );
}