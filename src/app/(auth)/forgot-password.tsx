import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Feather } from '@expo/vector-icons';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [focusedInput, setFocusedInput] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const handleResetPassword = async () => {
    if (!email) {
      showError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setIsSent(true);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        showError('No account found with this email address.');
      } else {
        showError(error.message || 'Something went wrong.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top', 'bottom']}>
      {/* Back Button outside ScrollView so it doesn't move */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        className="absolute top-12 left-6 z-10 w-10 h-10 bg-[#1C1C1E] border border-zinc-800 rounded-full items-center justify-center active:bg-zinc-800"
      >
        <Feather name="arrow-left" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <View className="mb-10 mt-8">
            <Text className="text-white text-3xl font-extrabold tracking-tight">Reset Password</Text>
            <Text className="text-zinc-400 text-base mt-2 leading-6">
              {isSent ? "We've sent a secure link to your email. Please check your inbox to reset your password." : "Enter your email below and we'll send you instructions to reset your password."}
            </Text>
          </View>

          {!isSent ? (
            <View className="space-y-4">
              {errorMsg && (
                <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex-row items-center mb-4">
                  <Feather name="alert-circle" size={20} color="#EF4444" />
                  <Text className="text-red-500 text-sm font-semibold ml-3 flex-1 leading-5">{errorMsg}</Text>
                </View>
              )}

              <View className={`bg-[#1C1C1E] border rounded-2xl px-4 h-14 flex-row items-center mb-6 transition-colors ${focusedInput ? 'border-[#276ded]' : 'border-zinc-800'}`}>
                <Feather name="mail" size={20} color={focusedInput ? '#276ded' : '#A1A1AA'} />
                <TextInput
                  className="flex-1 text-white text-base ml-3"
                  placeholder="Email Address"
                  placeholderTextColor="#71717A"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput(true)}
                  onBlur={() => setFocusedInput(false)}
                />
              </View>

              <TouchableOpacity
                className="bg-[#276ded] rounded-2xl h-14 items-center justify-center shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform"
                activeOpacity={0.9}
                disabled={isLoading}
                onPress={handleResetPassword}
              >
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-white text-base font-black tracking-wide">SEND RESET LINK</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl h-14 items-center justify-center active:scale-[0.98]"
              activeOpacity={0.9}
              onPress={() => router.replace('/(auth)/sign-in' as any)}
            >
              <Text className="text-white text-base font-black tracking-wide">BACK TO LOGIN</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}