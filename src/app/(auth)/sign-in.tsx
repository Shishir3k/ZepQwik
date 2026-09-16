import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

// Safely try to import Google Sign-In so it doesn't crash Expo Go instantly on load
let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
  // Native module not available (e.g. running inside Expo Go)
}

export default function SignIn() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  useEffect(() => {
    if (GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Replace with your actual Firebase Web Client ID
        });
      } catch (err) {
        console.log('GoogleSignin config error:', err);
      }
    }
  }, []);

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, email, is_onboarded, is_deleted')
        .eq('email', userCredential.user.email)
        .maybeSingle();

      const isValidExistingUser = !!profile && profile.is_onboarded === true && profile.is_deleted !== true;

      if (isValidExistingUser) {
        await refreshProfile();
        router.replace('/(tabs)' as any);
      } else {
        router.replace('/(auth)/onboarding' as any);
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        showError('Invalid email or password.');
      } else {
        showError(error.message || 'Something went wrong.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!GoogleSignin) {
      showError('Google Sign-In requires a development build (npx expo run:android). It is unavailable inside Expo Go.');
      return;
    }

    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || (userInfo as any).idToken;

      if (!idToken) throw new Error("No ID token found from Google.");

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, email, is_onboarded, is_deleted')
        .eq('email', userCredential.user.email)
        .maybeSingle();

      if (profile && profile.is_onboarded && !profile.is_deleted) {
        await refreshProfile();
        router.replace('/(tabs)' as any);
      } else {
        router.replace('/(auth)/onboarding' as any);
      }
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED') {
        showError(error.message || 'Google Sign-In failed. Check configuration.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const getInputStyle = (inputName: string) => 
    `bg-[#1C1C1E] border rounded-2xl px-4 h-14 flex-row items-center mb-4 transition-colors ${
      focusedInput === inputName ? 'border-[#276ded] bg-[#1C1C1E]' : 'border-zinc-800'
    }`;

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top', 'bottom']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <View className="items-center mb-8">
            <View className="bg-[#276ded] rounded-[28px] w-24 h-24 items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
              <Text className="text-white text-xl font-extrabold italic text-center">Zepqwik</Text>
            </View>
            <Text className="text-white text-3xl font-extrabold text-center tracking-tight">Welcome Back</Text>
            <Text className="text-zinc-400 text-base mt-2">Log in to continue shopping</Text>
          </View>

          {errorMsg && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4 flex-row items-center">
              <Feather name="alert-circle" size={20} color="#EF4444" />
              <Text className="text-red-500 text-sm font-semibold ml-3 flex-1 leading-5">{errorMsg}</Text>
            </View>
          )}

          <View>
            <View className={getInputStyle('email')}>
              <Feather name="mail" size={20} color={focusedInput === 'email' ? '#276ded' : '#A1A1AA'} />
              <TextInput
                className="flex-1 text-white text-base ml-3"
                placeholder="Email Address"
                placeholderTextColor="#71717A"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View className={getInputStyle('password')}>
              <Feather name="lock" size={20} color={focusedInput === 'password' ? '#276ded' : '#A1A1AA'} />
              <TextInput
                className="flex-1 text-white text-base ml-3"
                placeholder="Password"
                placeholderTextColor="#71717A"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <View className="items-end mb-6">
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity className="p-1">
                  <Text className="text-[#276ded] font-semibold text-sm">Forgot Password?</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <TouchableOpacity
              className="bg-[#276ded] rounded-2xl h-14 items-center justify-center mb-6 shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform"
              activeOpacity={0.9}
              disabled={isLoading || isGoogleLoading}
              onPress={handleEmailSignIn}
            >
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-white text-base font-black tracking-wide">LOG IN</Text>}
            </TouchableOpacity>

            <View className="flex-row items-center mb-6 opacity-60">
              <View className="flex-1 h-[1px] bg-zinc-700" />
              <Text className="text-zinc-400 mx-4 font-semibold text-xs uppercase tracking-wider">Or continue with</Text>
              <View className="flex-1 h-[1px] bg-zinc-700" />
            </View>

            <TouchableOpacity
              className="bg-white rounded-2xl h-14 flex-row items-center justify-center mb-6 active:scale-[0.98] transition-transform"
              activeOpacity={0.9}
              disabled={isLoading || isGoogleLoading}
              onPress={handleGoogleSignIn}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <>
                  <FontAwesome5 name="google" size={18} color="#000000" />
                  <Text className="text-black text-base font-bold ml-3">Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-2">
              <Text className="text-zinc-400">Don't have an account? </Text>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity>
                  <Text className="text-[#276ded] font-bold">Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}