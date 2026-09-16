import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
  // Native module not available in Expo Go
}

export default function SignUp() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
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
          webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
        });
      } catch (err) {
        console.log('GoogleSignin config error:', err);
      }
    }
  }, []);

  const handleSignUp = async () => {
    if (!fullName || !phone || !email || !password || !confirmPassword) {
      showError('Please fill in all fields to create your account.');
      return;
    }
    if (phone.length < 10) {
      showError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      const payload = {
        email: userCredential.user.email?.toLowerCase(),
        firebase_uid: userCredential.user.uid,
        full_name: fullName.trim(),
        phone_number: phone.trim(),
        is_onboarded: true, 
        is_deleted: false,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("user_profiles").upsert(payload, { onConflict: "email" });
      if (error) throw error;

      await refreshProfile();
      router.replace('/(tabs)' as any);
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        showError('This email is already in use. Try logging in.');
      } else {
        showError(error.message || 'Could not create account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!GoogleSignin) {
      showError('Google Sign-Up requires a development build (npx expo run:android). It is unavailable inside Expo Go.');
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
        const payload = {
          email: userCredential.user.email?.toLowerCase(),
          firebase_uid: userCredential.user.uid,
          full_name: userCredential.user.displayName || 'Google User',
          phone_number: null,
          is_onboarded: true,
          is_deleted: false,
          updated_at: new Date().toISOString(),
        };
        await supabase.from("user_profiles").upsert(payload, { onConflict: "email" });
        await refreshProfile();
        router.replace('/(tabs)' as any);
      }
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED') {
        showError(error.message || 'Google Sign-Up failed.');
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
          
          <View className="mb-6">
            <Text className="text-white text-3xl font-extrabold tracking-tight">Create Account</Text>
            <Text className="text-zinc-400 text-base mt-2">Join us and start shopping in minutes.</Text>
          </View>

          {errorMsg && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4 flex-row items-center">
              <Feather name="alert-circle" size={20} color="#EF4444" />
              <Text className="text-red-500 text-sm font-semibold ml-3 flex-1 leading-5">{errorMsg}</Text>
            </View>
          )}

          <View className="space-y-2">
            <TouchableOpacity
              className="bg-white rounded-2xl h-14 flex-row items-center justify-center mb-4 active:scale-[0.98] transition-transform"
              activeOpacity={0.9}
              disabled={isLoading || isGoogleLoading}
              onPress={handleGoogleSignUp}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <>
                  <FontAwesome5 name="google" size={18} color="#000000" />
                  <Text className="text-black text-base font-bold ml-3">Sign up with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center mb-4 opacity-60">
              <View className="flex-1 h-[1px] bg-zinc-700" />
              <Text className="text-zinc-400 mx-4 font-semibold text-xs uppercase tracking-wider">Or with email</Text>
              <View className="flex-1 h-[1px] bg-zinc-700" />
            </View>

            <View className={getInputStyle('name')}>
              <Feather name="user" size={20} color={focusedInput === 'name' ? '#276ded' : '#A1A1AA'} />
              <TextInput
                className="flex-1 text-white text-base ml-3"
                placeholder="Full Name"
                placeholderTextColor="#71717A"
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View className={getInputStyle('phone')}>
              <Feather name="phone" size={20} color={focusedInput === 'phone' ? '#276ded' : '#A1A1AA'} />
              <TextInput
                className="flex-1 text-white text-base ml-3"
                placeholder="Mobile Number"
                placeholderTextColor="#71717A"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocusedInput('phone')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

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
                placeholder="Password (Min. 6 chars)"
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

            <View className={getInputStyle('confirmPassword')}>
              <Feather name="lock" size={20} color={focusedInput === 'confirmPassword' ? '#276ded' : '#A1A1AA'} />
              <TextInput
                className="flex-1 text-white text-base ml-3"
                placeholder="Confirm Password"
                placeholderTextColor="#71717A"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedInput('confirmPassword')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <TouchableOpacity
              className="bg-[#276ded] rounded-2xl h-14 items-center justify-center mt-2 shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform"
              activeOpacity={0.9}
              disabled={isLoading || isGoogleLoading}
              onPress={handleSignUp}
            >
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-white text-base font-black tracking-wide">CREATE ACCOUNT</Text>}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6">
              <Text className="text-zinc-400">Already have an account? </Text>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity>
                  <Text className="text-[#276ded] font-bold">Log In</Text>
                </TouchableOpacity>
              </Link>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}